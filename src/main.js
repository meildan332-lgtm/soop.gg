import './styles.css';
import './emblem-overrides.css';
import { streamers, categories, lastUpdated, loadStreamers, addStreamer, hasMoreStreamers, streamersLoading } from './data.js';
import { getTierInfo, formatCompact } from './tiers.js';

const app = document.querySelector('#app');
const state = { query: '', category: '전체', tier: '전체 등급', sort: '누적 유저 많은 순', imminent: false, period: 'monthly' };
let loadError = '';
let searchBusy = false;
let listObserver;

const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
const tierAssetKey = (tier) => ({ 미등급: 'unranked', 실버: 'silver', 골드: 'gold', 플래티넘: 'platinum', 에메랄드: 'emerald', 다이아: 'diamond', 프레스티지: 'prestige' }[tier.group]);
const tierArt = (tier, variant, extraClass = '') => `<span class="tier-art tier-art-${variant} tier-art-${tierAssetKey(tier)} ${extraClass}" style="--tier:${tier.color}" aria-hidden="true"><img src="/emblems/sets/tier-${tierAssetKey(tier)}.png" alt=""/></span>`;
const rankImage = (tier) => tierAssetKey(tier) === 'unranked' ? '/emblems/icons/unranked.png' : `/emblems/ranks/${tierAssetKey(tier)}.png`;
const listRankImage = (tier) => `/emblems/icons/${tierAssetKey(tier)}.png`;
const rankCrest = (tier) => `<span class="rank-crest rank-crest-${tierAssetKey(tier)}" aria-hidden="true"><img src="${rankImage(tier)}" alt=""/></span>`;
const medal = (tier) => {
  const rank = tier.group === '프레스티지' ? '★' : (tier.name.match(/[123]$/)?.[0] ?? '');
  const emblemClass = tierAssetKey(tier);
  return `<span class="emblem emblem-${emblemClass}" style="--tier:${tier.color}" aria-hidden="true"><img class="emblem-icon" src="${listRankImage(tier)}" alt=""/><b>${rank}</b></span>`;
};
const avatar = (s, large = false) => `<span class="avatar ${large ? 'avatar-large' : ''}" style="--accent:${s.accent}">${s.profileImage ? `<img src="${escapeHtml(s.profileImage)}" alt="" referrerpolicy="no-referrer"/>` : escapeHtml(s.initials)}</span>`;
const rankedAvatar = (s, tier) => `<span class="ranked-avatar ranked-avatar-${tierAssetKey(tier)}" style="--tier:${tier.color}">${avatar(s, true)}</span>`;

function getFiltered() {
  const q = state.query.trim().toLowerCase();
  const filtered = streamers.filter(s => {
    const info = getTierInfo(s.cumulativeUsers);
    return (!q || s.nickname.toLowerCase().includes(q) || s.soopId.toLowerCase().includes(q)) &&
      (state.category === '전체' || (s.categoryGroup || s.category) === state.category) &&
      (state.tier === '전체 등급' || info.current.group === state.tier) &&
      (!state.imminent || (info.next && info.progress >= 80));
  });
  return filtered.sort((a, b) => {
    if (state.sort === '누적 유저 적은 순') return a.cumulativeUsers - b.cumulativeUsers;
    if (state.sort === '다음 등급 임박 순') return getTierInfo(b.cumulativeUsers).progress - getTierInfo(a.cumulativeUsers).progress;
    if (state.sort === '닉네임 가나다순') return a.nickname.localeCompare(b.nickname, 'ko');
    return b.cumulativeUsers - a.cumulativeUsers;
  });
}

function header() {
  const updated = lastUpdated ? lastUpdated.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '불러오는 중';
  return `<header class="site-header"><div class="header-inner"><button class="brand" data-home aria-label="홈으로"><img src="/brand/soopgg-logo.png" alt="SOOP.GG"/></button><nav aria-label="주요 메뉴"><button class="nav-active" data-home>랭킹</button><button id="nav-imminent">승급 임박</button><button>등급표</button></nav><span class="update"><b>LIVE DATA</b> SOOP 공개 데이터 · ${updated}</span></div></header>`;
}

function controls() {
  return `<section class="search-hero"><img class="search-brand" src="/brand/soopgg-logo.png" alt="SOOP.GG"/><label class="search"><span>⌕</span><input id="search" type="search" value="${escapeHtml(state.query)}" placeholder="닉네임 검색 또는 SOOP ID 입력" autocomplete="off"/><button type="button" id="search-submit" aria-label="SOOP 채널 검색" ${searchBusy ? 'disabled' : ''}>${searchBusy ? '조회 중' : '검색'}</button></label>${loadError ? `<p class="data-error" role="alert">${escapeHtml(loadError)}</p>` : ''}</section>
  <section class="rank-tools" aria-label="스트리머 검색과 필터"><div class="category-row">${categories.map(c => `<button class="chip ${state.category === c ? 'active' : ''}" data-category="${c}">${c}</button>`).join('')}</div><div class="filter-row"><div><select id="tier" aria-label="등급 필터">${['전체 등급','미등급','실버','골드','플래티넘','에메랄드','다이아','프레스티지'].map(v => `<option ${state.tier === v ? 'selected' : ''}>${v}</option>`).join('')}</select><select id="sort" aria-label="정렬 방식">${['누적 유저 많은 순','누적 유저 적은 순','다음 등급 임박 순','닉네임 가나다순'].map(v => `<option ${state.sort === v ? 'selected' : ''}>${v}</option>`).join('')}</select></div><button class="imminent ${state.imminent ? 'active' : ''}" id="imminent">${state.imminent ? '✓' : '↗'} 승급 임박</button></div></section>`;
}

function row(s, index) {
  const info = getTierInfo(s.cumulativeUsers);
  const rank = index + 1;
  return `<article class="streamer-row" tabindex="0" role="link" data-streamer="${s.soopId}" aria-label="${escapeHtml(s.nickname)} 상세 보기">
    <div class="rank ${rank <= 3 ? 'top' : ''}"><small>RANK</small><strong>${String(rank).padStart(2,'0')}</strong></div>
    <div class="identity">${avatar(s)}<div><strong>${escapeHtml(s.nickname)}</strong><span>@${escapeHtml(s.soopId)}</span></div></div>
    <span class="category">${escapeHtml(s.category)}</span>
    <div class="tier">${medal(info.current)}<div><strong style="color:${info.current.color}">${info.current.name}</strong><span>${info.next ? `다음 ${info.next.name}` : '최고 등급 달성'}</span></div></div>
    <div class="users"><strong>${formatCompact(s.cumulativeUsers)}</strong><span>${s.cumulativeUsers.toLocaleString('ko-KR')}명</span></div>
    <div class="goal"><div><span>${info.next ? `${formatCompact(info.remaining)} 남음` : '최고 등급'}</span><strong>${info.progress.toFixed(1)}%</strong></div><div class="progress"><i style="width:${info.progress}%;--tier:${info.current.color}"></i></div></div>
    <span class="chevron">›</span>
  </article>`;
}

function renderList() {
  const items = getFiltered();
  app.innerHTML = `${header()}<main>${controls()}<div class="list-head"><div><span class="rank-title-icon">≡</span><strong>${state.category === '전체' ? 'SOOP 스트리머 랭킹' : state.category + ' 스트리머 랭킹'}</strong><span>${items.length}명 불러옴</span></div><span>처음 100명 · 스크롤할 때마다 다음 100명 추가</span></div>
  <section class="streamer-list">${items.length ? items.map(row).join('') : `<div class="empty"><strong>조건에 맞는 스트리머가 없어요.</strong><span>${hasMoreStreamers ? '다음 스트리머를 불러오는 중입니다.' : '검색어나 필터를 바꿔보세요.'}</span><button id="reset">필터 초기화</button></div>`}</section>
  ${hasMoreStreamers ? `<div class="load-sentinel" id="load-more"><span class="loader"></span>${streamersLoading ? '불러오는 중…' : '아래로 스크롤하면 100명을 더 불러옵니다'}</div>` : ''}
  <footer><p>본 사이트는 SOOP 공식 서비스가 아닌 팬 제작 정보 사이트입니다.</p><p>수치는 SOOP 공개 채널 응답에서 불러오며, 플랫폼 반영 시점에 따라 차이가 날 수 있습니다.</p></footer></main>`;
  bindList();
  observeMore();
}

function observeMore() {
  listObserver?.disconnect();
  const sentinel = document.querySelector('#load-more');
  if (!sentinel || streamersLoading) return;
  listObserver = new IntersectionObserver(async entries => {
    if (!entries[0].isIntersecting || streamersLoading) return;
    listObserver.disconnect();
    sentinel.classList.add('loading');
    sentinel.innerHTML = '<span class="loader"></span>다음 100명을 불러오는 중…';
    try { await loadStreamers({ reset: false, category: state.category }); loadError = ''; }
    catch (error) { loadError = error.message; }
    renderList();
  }, { rootMargin: '400px 0px' });
  listObserver.observe(sentinel);
}

function chart(s) {
  const data = s.history[state.period];
  if (data.length < 2) return `<div class="chart-empty"><strong>성장 기록 수집 전</strong><span>SOOP 공개 응답은 현재 누적값만 제공해요. 이후 저장된 기록부터 변화 그래프가 표시됩니다.</span></div>`;
  const periodLabel = { daily: '최근 7일', monthly: '최근 7개월', yearly: '최근 5년' }[state.period];
  const max = Math.max(...data.map(h => h.value));
  const min = Math.min(...data.map(h => h.value)) * .96;
  const points = data.map((h,i) => `${(i/(data.length-1))*100},${82-((h.value-min)/(max-min))*62}`).join(' ');
  return `<div class="chart" aria-label="${periodLabel} 누적 유저 변화"><svg viewBox="0 0 100 90" preserveAspectRatio="none"><defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.accent}" stop-opacity=".35"/><stop offset="1" stop-color="${s.accent}" stop-opacity="0"/></linearGradient></defs><polygon points="0,90 ${points} 100,90" fill="url(#area)"/><polyline points="${points}" fill="none" stroke="${s.accent}" stroke-width="2" vector-effect="non-scaling-stroke"/></svg><div>${data.map(h => `<span>${h.label}</span>`).join('')}</div></div>`;
}

function renderDetail(id) {
  const s = streamers.find(x => x.soopId === id);
  if (!s) { history.replaceState({}, '', '/'); renderList(); return; }
  const requestedPeriod = new URLSearchParams(location.search).get('period');
  if (['daily', 'monthly', 'yearly'].includes(requestedPeriod)) state.period = requestedPeriod;
  const info = getTierInfo(s.cumulativeUsers);
  const periodData = s.history[state.period];
  const periodGrowth = periodData.length > 1 ? periodData.at(-1).value - periodData[0].value : null;
  const stationUrl = `https://www.sooplive.com/station/${encodeURIComponent(s.soopId)}`;
  const liveUrl = s.broadNo ? `https://play.sooplive.com/${encodeURIComponent(s.soopId)}/${s.broadNo}` : stationUrl;
  const livePanel = s.isLive ? `<a class="live-card" href="${liveUrl}" target="_blank" rel="noopener noreferrer"><span class="live-thumb" style="--accent:${s.accent}"><img src="${escapeHtml(s.liveThumbnail)}" alt="${escapeHtml(s.nickname)} 라이브 방송 썸네일" referrerpolicy="no-referrer"/><b><i></i> ${s.liveViewers.toLocaleString('ko-KR')}</b><strong>${escapeHtml(s.initials)}</strong></span><span class="live-title"><i>LIVE</i><span>${escapeHtml(s.liveTitle || '현재 라이브 방송')}</span></span></a>` : `<a class="station" href="${stationUrl}" target="_blank" rel="noopener noreferrer">SOOP 방송국 바로가기</a>`;
  app.innerHTML = `${header()}<main class="detail"><button class="back" data-home>‹ 전체 랭킹으로</button>
    <section class="profile-hero"><div class="profile-main">${rankedAvatar(s, info.current)}<div><span class="category">${s.category}</span><h1>${escapeHtml(s.nickname)} <em>SOOP</em></h1><p>@${escapeHtml(s.soopId)}</p></div></div>${livePanel}</section>
    <section class="profile-stats" aria-label="스트리머 주요 정보">
      <article><span class="metric-icon purple">◷</span><div><small>총 방송 시간</small><strong>${s.totalBroadcastHours.toLocaleString('ko-KR')}<i>시간</i></strong></div></article>
      <article><span class="metric-icon blue">◉</span><div><small>누적 유저</small><strong>${s.cumulativeUsers.toLocaleString('ko-KR')}<i>명</i></strong></div></article>
      <article><span class="metric-icon favorite" aria-hidden="true">★</span><div><small>애청자 수</small><strong>${s.followers.toLocaleString('ko-KR')}<i>명</i></strong></div></article>
      <article class="subscriber-stat"><span class="metric-icon subscribe" aria-hidden="true"><i>▶</i></span><div><small>구독팬 수</small><strong>${(s.subscribers.basic + s.subscribers.plus).toLocaleString('ko-KR')}<i>명</i></strong><p><b>베이직 ${s.subscribers.basic.toLocaleString('ko-KR')}</b><b>플러스 ${s.subscribers.plus.toLocaleString('ko-KR')}</b></p></div></article>
      <article><span class="metric-icon fanclub" aria-hidden="true">♥</span><div><small>팬클럽 수</small><strong>${s.fanClub == null ? '미제공' : `${s.fanClub.toLocaleString('ko-KR')}<i>명</i>`}</strong></div></article>
    </section>
    <section class="tier-card" style="--tier:${info.current.color}"><div class="tier-visual">${rankCrest(info.current)}<span>CURRENT EMBLEM</span><strong>${info.current.name}</strong></div><div class="tier-numbers"><div><span>현재 누적 유저</span><strong>${s.cumulativeUsers.toLocaleString('ko-KR')}</strong></div><div><span>다음 목표</span><strong>${info.next ? `${info.next.name} · ${formatCompact(info.next.min)}` : '최고 등급 달성'}</strong></div><div class="detail-progress"><div><span>${info.next ? `${formatCompact(info.remaining)} 남음` : '모든 등급 완료'}</span><strong>${info.progress.toFixed(1)}%</strong></div><div class="progress"><i style="width:${info.progress}%"></i></div></div></div></section>
    <section class="detail-grid"><article class="panel history"><div class="panel-title"><div><span>GROWTH</span><h2>누적 유저 변화</h2></div><div class="growth-summary">${periodGrowth == null ? '' : `<strong>+${formatCompact(periodGrowth)}<small>선택 기간 증가량</small></strong>`}<div class="period-tabs" role="tablist" aria-label="성장 그래프 기간">${[['daily','일별'],['monthly','월별'],['yearly','연별']].map(([key,label]) => `<a role="tab" aria-selected="${state.period === key}" class="${state.period === key ? 'active' : ''}" href="/streamer/${encodeURIComponent(id)}?period=${key}">${label}</a>`).join('')}</div></div></div>${chart(s)}</article><article class="panel log"><div class="panel-title"><div><span>EMBLEM LOG</span><h2>등급 변경 기록</h2></div></div><div class="timeline"><i></i><div><strong>${info.current.name}</strong><span>현재 SOOP 누적 조회수 기준 자동 계산</span></div></div><div class="timeline muted"><i></i><div><strong>${info.next ? `${info.next.name} 도전 중` : '최고 등급 유지 중'}</strong><span>${info.next ? `${info.progress.toFixed(1)}% 진행` : '프레스티지'}</span></div></div><p>등급 변경 기록은 실제 데이터가 축적된 이후 표시됩니다.</p></article></section>
    <footer><p>본 사이트는 SOOP 공식 서비스가 아닌 팬 제작 정보 사이트입니다.</p><p>${escapeHtml(s.dataSource)} · ${new Date(s.lastUpdated).toLocaleString('ko-KR')} 기준</p></footer></main>`;
  bindHome();
}

function navigate(id) { history.pushState({}, '', `/streamer/${id}`); renderDetail(id); window.scrollTo(0,0); }
function bindHome() { document.querySelectorAll('[data-home]').forEach(el => el.onclick = () => { history.pushState({}, '', '/'); renderList(); }); }
function bindList() {
  bindHome();
  const search = document.querySelector('#search');
  let composing = false;
  search.addEventListener('compositionstart', () => { composing = true; });
  search.addEventListener('compositionend', e => { composing = false; state.query = e.target.value; renderList(); });
  search.addEventListener('input', e => {
    state.query = e.target.value;
    if (composing || e.isComposing) return;
    renderList();
    document.querySelector('#search').focus();
    document.querySelector('#search').setSelectionRange(state.query.length, state.query.length);
  });
  const submitSearch = async () => {
    const query = state.query.trim().replace(/^@/, '');
    const local = streamers.find(s => s.soopId.toLowerCase() === query.toLowerCase() || s.nickname.toLowerCase() === query.toLowerCase());
    if (local) { navigate(local.soopId); return; }
    if (!query) return;
    searchBusy = true; loadError = ''; renderList();
    try {
      const streamer = await addStreamer(query);
      state.query = '';
      searchBusy = false;
      navigate(streamer.soopId);
    } catch (error) {
      loadError = error.message;
      searchBusy = false;
      renderList();
    }
  };
  document.querySelector('#search-submit')?.addEventListener('click', submitSearch);
  search.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); submitSearch(); } });
  document.querySelectorAll('[data-category]').forEach(b => b.onclick = async () => {
    state.category = b.dataset.category;
    app.innerHTML = `<main class="loading-state"><img src="/brand/soopgg-logo.png" alt="SOOP.GG"/><strong>${escapeHtml(state.category)} 스트리머를 불러오는 중입니다</strong><span>SOOP 목록을 확인하고 있어요.</span></main>`;
    try { await loadStreamers({ reset: true, category: state.category }); loadError = ''; }
    catch (error) { loadError = error.message; }
    renderList();
  });
  document.querySelector('#tier').onchange = e => { state.tier = e.target.value; renderList(); };
  document.querySelector('#sort').onchange = e => { state.sort = e.target.value; renderList(); };
  document.querySelector('#imminent').onclick = () => { state.imminent = !state.imminent; if (state.imminent) state.sort = '다음 등급 임박 순'; renderList(); };
  document.querySelector('#nav-imminent')?.addEventListener('click', () => { state.imminent = true; state.sort = '다음 등급 임박 순'; renderList(); });
  document.querySelectorAll('[data-streamer]').forEach(el => { el.onclick = () => navigate(el.dataset.streamer); el.onkeydown = e => { if (e.key === 'Enter') navigate(el.dataset.streamer); }; });
  document.querySelector('#reset')?.addEventListener('click', () => { Object.assign(state, { query: '', category: '전체', tier: '전체 등급', sort: '누적 유저 많은 순', imminent: false }); renderList(); });
}

window.addEventListener('popstate', route);
window.addEventListener('keydown', e => { if (e.key === '/' && !['INPUT','SELECT'].includes(document.activeElement.tagName)) { e.preventDefault(); document.querySelector('#search')?.focus(); } });
async function route() {
  const match = location.pathname.match(/^\/streamer\/([^/]+)/);
  if (match) {
    const id = decodeURIComponent(match[1]);
    if (!streamers.some(s => s.soopId === id)) {
      try { await addStreamer(id); } catch { history.replaceState({}, '', '/'); }
    }
  }
  const current = location.pathname.match(/^\/streamer\/([^/]+)/);
  current ? renderDetail(decodeURIComponent(current[1])) : renderList();
}

app.innerHTML = `<main class="loading-state"><img src="/brand/soopgg-logo.png" alt="SOOP.GG"/><strong>SOOP 실제 데이터를 불러오는 중입니다</strong><span>공개 채널 정보를 확인하고 있어요.</span></main>`;
loadStreamers().then(route).catch(error => { loadError = error.message; renderList(); });
