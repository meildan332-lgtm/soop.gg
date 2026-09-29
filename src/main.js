import './styles.css';
import { streamers, categories } from './data.js';
import { getTierInfo, formatCompact } from './tiers.js';

const app = document.querySelector('#app');
const state = { query: '', category: '전체', tier: '전체 등급', sort: '누적 유저 많은 순', imminent: false };

const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
const medal = (tier) => `<span class="emblem" style="--tier:${tier.color}" aria-hidden="true"><i></i></span>`;
const avatar = (s, large = false) => `<span class="avatar ${large ? 'avatar-large' : ''}" style="--accent:${s.accent}">${escapeHtml(s.initials)}</span>`;

function getFiltered() {
  const q = state.query.trim().toLowerCase();
  const filtered = streamers.filter(s => {
    const info = getTierInfo(s.cumulativeUsers);
    return (!q || s.nickname.toLowerCase().includes(q) || s.soopId.toLowerCase().includes(q)) &&
      (state.category === '전체' || s.category === state.category) &&
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
  return `<header class="site-header"><button class="brand" data-home aria-label="홈으로"><span class="brand-mark">S</span><span>SOOP 엠블럼 랭킹<small>비공식 팬 정보 사이트</small></span></button><span class="update"><i></i> 샘플 데이터 · 2026.09.29</span></header>`;
}

function controls() {
  return `<section class="intro"><div><span class="eyebrow">STREAMER EMBLEM INDEX</span><h1>엠블럼의 다음 장면까지.</h1><p>스트리머의 현재 등급, 누적 유저와 다음 목표를 한눈에 확인하세요.</p></div><div class="stat"><strong>12</strong><span>등록 스트리머</span></div></section>
  <section class="search-panel" aria-label="스트리머 검색과 필터"><label class="search"><span>⌕</span><input id="search" type="search" value="${escapeHtml(state.query)}" placeholder="스트리머 닉네임 또는 SOOP ID 검색" autocomplete="off"/><kbd>/</kbd></label>
  <div class="category-row">${categories.map(c => `<button class="chip ${state.category === c ? 'active' : ''}" data-category="${c}">${c}</button>`).join('')}</div>
  <div class="filter-row"><div><select id="tier" aria-label="등급 필터">${['전체 등급','미등급','실버','골드','플래티넘','에메랄드','다이아','프레스티지'].map(v => `<option ${state.tier === v ? 'selected' : ''}>${v}</option>`).join('')}</select><select id="sort" aria-label="정렬 방식">${['누적 유저 많은 순','누적 유저 적은 순','다음 등급 임박 순','닉네임 가나다순'].map(v => `<option ${state.sort === v ? 'selected' : ''}>${v}</option>`).join('')}</select></div><button class="imminent ${state.imminent ? 'active' : ''}" id="imminent">${state.imminent ? '✓' : '↗'} 승급 임박</button></div></section>`;
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
  app.innerHTML = `${header()}<main>${controls()}<div class="list-head"><div><strong>${state.category === '전체' ? '전체' : state.category} 랭킹</strong><span>${items.length}명의 스트리머</span></div><span>현재 등급과 다음 목표</span></div>
  <section class="streamer-list">${items.length ? items.map(row).join('') : `<div class="empty"><strong>조건에 맞는 스트리머가 없어요.</strong><span>검색어나 필터를 바꿔보세요.</span><button id="reset">필터 초기화</button></div>`}</section>
  <footer><p>본 사이트는 SOOP 공식 서비스가 아닌 팬 제작 정보 사이트입니다.</p><p>현재 화면의 데이터는 UI 확인을 위한 샘플이며 실제 수치와 다를 수 있습니다.</p></footer></main>`;
  bindList();
}

function chart(s) {
  const max = Math.max(...s.history.map(h => h.value));
  const min = Math.min(...s.history.map(h => h.value)) * .96;
  const points = s.history.map((h,i) => `${(i/(s.history.length-1))*100},${82-((h.value-min)/(max-min))*62}`).join(' ');
  return `<div class="chart" aria-label="최근 7개월 누적 유저 변화"><svg viewBox="0 0 100 90" preserveAspectRatio="none"><defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.accent}" stop-opacity=".35"/><stop offset="1" stop-color="${s.accent}" stop-opacity="0"/></linearGradient></defs><polygon points="0,90 ${points} 100,90" fill="url(#area)"/><polyline points="${points}" fill="none" stroke="${s.accent}" stroke-width="2" vector-effect="non-scaling-stroke"/></svg><div>${s.history.map(h => `<span>${h.label}</span>`).join('')}</div></div>`;
}

function renderDetail(id) {
  const s = streamers.find(x => x.soopId === id);
  if (!s) { history.replaceState({}, '', '/'); renderList(); return; }
  const info = getTierInfo(s.cumulativeUsers);
  app.innerHTML = `${header()}<main class="detail"><button class="back" data-home>‹ 전체 랭킹으로</button>
    <section class="profile-hero"><div class="profile-main">${avatar(s, true)}<div><span class="category">${s.category}</span><h1>${escapeHtml(s.nickname)}</h1><p>@${escapeHtml(s.soopId)}</p></div></div><a class="station" href="https://bj.afreecatv.com/${encodeURIComponent(s.soopId)}" target="_blank" rel="noopener noreferrer">SOOP 방송국 바로가기</a></section>
    <section class="tier-card" style="--tier:${info.current.color}"><div class="tier-visual">${medal(info.current)}<span>CURRENT EMBLEM</span><strong>${info.current.name}</strong></div><div class="tier-numbers"><div><span>현재 누적 유저</span><strong>${s.cumulativeUsers.toLocaleString('ko-KR')}</strong></div><div><span>다음 목표</span><strong>${info.next ? `${info.next.name} · ${formatCompact(info.next.min)}` : '최고 등급 달성'}</strong></div><div class="detail-progress"><div><span>${info.next ? `${formatCompact(info.remaining)} 남음` : '모든 등급 완료'}</span><strong>${info.progress.toFixed(1)}%</strong></div><div class="progress"><i style="width:${info.progress}%"></i></div></div></div></section>
    <section class="detail-grid"><article class="panel history"><div class="panel-title"><div><span>GROWTH</span><h2>누적 유저 변화</h2></div><strong>+${formatCompact(s.delta)}<small>최근 증가량</small></strong></div>${chart(s)}</article><article class="panel log"><div class="panel-title"><div><span>EMBLEM LOG</span><h2>등급 변경 기록</h2></div></div><div class="timeline"><i></i><div><strong>${info.current.name} 달성</strong><span>현재 누적 유저 기준 자동 계산</span></div></div><div class="timeline muted"><i></i><div><strong>${info.next ? `${info.next.name} 도전 중` : '최고 등급 유지 중'}</strong><span>${info.next ? `${info.progress.toFixed(1)}% 진행` : '프레스티지'}</span></div></div><p>실제 데이터 연동 후 승급 이력이 표시됩니다.</p></article></section>
    <footer><p>본 사이트는 SOOP 공식 서비스가 아닌 팬 제작 정보 사이트입니다.</p><p>현재 데이터는 UI 확인을 위한 샘플입니다.</p></footer></main>`;
  bindHome();
}

function navigate(id) { history.pushState({}, '', `/streamer/${id}`); renderDetail(id); window.scrollTo(0,0); }
function bindHome() { document.querySelectorAll('[data-home]').forEach(el => el.onclick = () => { history.pushState({}, '', '/'); renderList(); }); }
function bindList() {
  bindHome();
  const search = document.querySelector('#search');
  search.addEventListener('input', e => { state.query = e.target.value; renderList(); document.querySelector('#search').focus(); document.querySelector('#search').setSelectionRange(state.query.length, state.query.length); });
  document.querySelectorAll('[data-category]').forEach(b => b.onclick = () => { state.category = b.dataset.category; renderList(); });
  document.querySelector('#tier').onchange = e => { state.tier = e.target.value; renderList(); };
  document.querySelector('#sort').onchange = e => { state.sort = e.target.value; renderList(); };
  document.querySelector('#imminent').onclick = () => { state.imminent = !state.imminent; if (state.imminent) state.sort = '다음 등급 임박 순'; renderList(); };
  document.querySelectorAll('[data-streamer]').forEach(el => { el.onclick = () => navigate(el.dataset.streamer); el.onkeydown = e => { if (e.key === 'Enter') navigate(el.dataset.streamer); }; });
  document.querySelector('#reset')?.addEventListener('click', () => { Object.assign(state, { query: '', category: '전체', tier: '전체 등급', sort: '누적 유저 많은 순', imminent: false }); renderList(); });
}

window.addEventListener('popstate', route);
window.addEventListener('keydown', e => { if (e.key === '/' && !['INPUT','SELECT'].includes(document.activeElement.tagName)) { e.preventDefault(); document.querySelector('#search')?.focus(); } });
function route() { const match = location.pathname.match(/^\/streamer\/([^/]+)/); match ? renderDetail(decodeURIComponent(match[1])) : renderList(); }
route();
