const SOOP_API = 'https://chapi.sooplive.com/api';

const rankedIds = `devil0108 lshooooo bigbigjo2 khm11903 rlaeogus200 120510 kissday621 rrvv17 wnnw no3miggi qpwo164 sccha21 horusb zpdl1313 ch1716 jdm1197 dlgksquf159 guslgood2 seokwngud galsa skswhdkgo janjju phonics1 killgusdnk nila25 spbabobj goata111789 yunheehoho leesh2148 zkwks4413 rlaxordyd yuambo bebe010 ecvhao pig2704 joey1114 dkssyddleid aay2014 dpfgc3 eunz1nara sol3712 kimdhun b13246 isauria pi0314 since821 feel0100 gusdk2362 djsrhkwl dlghfjs gyeonjahee partypeople sang033 lyj9306 parang58 m0m099 beatjungle1 unitelshaki rlrlvkvk123 030b1004 skswldms kdb1223 zzzz4422 ansguswns519 lyl9095 thseogks1 jaedong23 1004suna vlfrl2 pookygamja e000e77 wannabe33 moonwol0614 asy1218 gosegu2 eunyoung1238 kogo0512 ehdgkr6283 horidda ksh14 lovely5959 axiaxi umj4635 sky2713 giltae1124 nada11200 sas2055 townboy gtv7 lilpa0309 rkdakstlr911 arinbbidol dmsco39 ayoona jingburger1 golaniyule0 ghth6009 viichan6 jeehyeoun cotton1217`.split(' ');
const accents = ['#7464ff', '#3e8cff', '#2dd4bf', '#ff9d43', '#a855f7', '#f05d8f', '#fb7185', '#4bd6a5'];
const seedChannels = rankedIds.map((soopId, index) => ({
  soopId,
  category: '기타',
  accent: accents[index % accents.length],
  officialRank: index + 1
}));

const cleanText = (value) => String(value || '').replace(/<[^>]*>/g, '').trim();
const absoluteImage = (url) => url?.startsWith('//') ? `https:${url}` : (url || '');

const categoryTranslations = {
  'Maple Story': '메이플스토리',
  'Sudden Attack': '서든어택',
  'League of Legends': '리그 오브 레전드',
  'StarCraft': '스타크래프트',
  'StarCraft II': '스타크래프트 2',
  'BattleGrounds': '배틀그라운드',
  'Overwatch': '오버워치',
  'Valorant': '발로란트',
  'Minecraft': '마인크래프트',
  'Talk/Cam': '토크/캠방',
  'Virtual': '버추얼',
  'Music': '음악',
  'Sports': '스포츠',
  'Travel': '여행'
};

const gameKeywords = /게임|리그 오브 레전드|메이플|서든|스타크래프트|배틀그라운드|오버워치|발로란트|마인크래프트|FC ONLINE|로스트아크|던전|Raven|TFT|전략적 팀 전투/i;

function categoryGroup(category) {
  if (!category) return '기타';
  if (gameKeywords.test(category)) return '게임';
  if (/버추얼|Virtual/i.test(category)) return '버추얼';
  if (/토크|캠방|보이는 라디오|소통|Talk/i.test(category)) return '보이는 라디오';
  if (/스포츠|축구|야구|농구|Sports/i.test(category)) return '스포츠';
  if (/먹방|쿡방|요리|Food/i.test(category)) return '먹방/쿡방';
  if (/음악|노래|Music/i.test(category)) return '음악';
  if (/여행|Travel/i.test(category)) return '여행';
  if (/교육|정보|시사|Education/i.test(category)) return '교육/정보';
  return '기타';
}

function primaryCategory(vods) {
  const counts = new Map();
  for (const vod of vods?.data || []) {
    const raw = cleanText(vod?.ucc?.category_tags?.[0]);
    if (!raw) continue;
    const label = categoryTranslations[raw] || raw;
    counts.set(label, (counts.get(label) || 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] || '';
}

function mapStation(data, seed, detectedCategory = '') {
  const station = data.station;
  if (!station?.upd) throw new Error('채널 정보를 찾을 수 없습니다.');
  const nickname = cleanText(station.user_nick || station.station_name || seed.soopId);
  const cumulativeUsers = Number(station.upd.total_view_cnt) || 0;
  const point = { label: '현재', value: cumulativeUsers };

  return {
    ...seed,
    category: detectedCategory || seed.category || '기타',
    categoryGroup: categoryGroup(detectedCategory || seed.category),
    nickname,
    initials: nickname.replace(/[^0-9A-Za-z가-힣]/g, '').slice(0, 2) || seed.soopId.slice(0, 2),
    profileImage: absoluteImage(data.profile_image || station.profile_image),
    cumulativeUsers,
    delta: 0,
    isLive: Boolean(data.broad),
    liveViewers: Number(data.broad?.current_sum_viewer) || 0,
    liveTitle: cleanText(data.broad?.broad_title || ''),
    broadNo: data.broad?.broad_no || null,
    liveThumbnail: data.broad?.broad_no ? `https://liveimg.sooplive.com/m/${data.broad.broad_no}.jpg` : '',
    lastUpdated: data.current_timestamp ? `${data.current_timestamp}+09:00` : new Date().toISOString(),
    totalBroadcastHours: Math.round((Number(station.total_broad_time) || 0) / 3600),
    followers: Number(station.upd.fan_cnt) || 0,
    subscribers: { basic: Number(data.subscription?.tier1) || 0, plus: Number(data.subscription?.tier2) || 0 },
    fanClub: null,
    history: { daily: [point], monthly: [point], yearly: [point] },
    stationTitle: cleanText(station.station_title || ''),
    dataSource: 'SOOP 공개 채널 API'
  };
}

export let streamers = [];
export let lastUpdated = null;
export let hasMoreStreamers = true;
export let streamersLoading = false;
let directoryPage = 0;
let activeDirectoryCategory = 'all';

const directoryCategory = {
  '전체': 'all', '게임': 'game', '버추얼': 'virtual', '보이는 라디오': 'talkcam',
  '스포츠': 'sports_general', '먹방/쿡방': 'mukbang', '음악': 'music',
  '여행': 'travel', '교육/정보': 'study', '기타': 'all'
};

export async function fetchStreamer(soopId, overrides = {}) {
  const id = String(soopId || '').trim().replace(/^@/, '');
  if (!/^[0-9A-Za-z_-]{2,40}$/.test(id)) throw new Error('올바른 SOOP ID를 입력해 주세요.');
  const requestOptions = { headers: { Accept: 'application/json' }, credentials: 'omit' };
  const [stationResponse, vodResponse] = await Promise.all([
    fetch(`${SOOP_API}/${encodeURIComponent(id)}/station`, requestOptions),
    fetch(`${SOOP_API}/${encodeURIComponent(id)}/vods/all/streamer?page=1&per_page=10&orderby=reg_date`, requestOptions).catch(() => null)
  ]);
  if (!stationResponse.ok) throw new Error('SOOP 채널 정보를 불러오지 못했습니다.');
  const [stationData, vodData] = await Promise.all([
    stationResponse.json(),
    vodResponse?.ok ? vodResponse.json().catch(() => null) : null
  ]);
  return mapStation(stationData, { soopId: id, category: '기타', accent: '#7968ff', ...overrides }, primaryCategory(vodData));
}

async function fetchDirectoryPage(page, category) {
  const response = await fetch(`/api/streamers?page=${page}&category=${encodeURIComponent(category)}`);
  if (!response.ok) throw new Error('SOOP 스트리머 목록을 불러오지 못했습니다.');
  const payload = await response.json();
  if (payload.ids) return payload;
  const result = payload.RESULT || {};
  return { ids: (result.DATA || []).map(item => item.user_id), page, totalPages: Number(result.TOTAL_PAGE) || page };
}

export async function loadStreamers({ reset = true, category = '전체' } = {}) {
  if (streamersLoading) return streamers;
  streamersLoading = true;
  const requestedCategory = directoryCategory[category] || 'all';
  if (reset || requestedCategory !== activeDirectoryCategory) {
    streamers = [];
    directoryPage = 0;
    hasMoreStreamers = true;
    activeDirectoryCategory = requestedCategory;
  }
  if (!hasMoreStreamers) { streamersLoading = false; return streamers; }

  const loaded = [];
  const nextPage = directoryPage + 1;
  let directory;
  try {
    directory = await fetchDirectoryPage(nextPage, activeDirectoryCategory);
  } catch (error) {
    if (nextPage !== 1 || activeDirectoryCategory !== 'all') { streamersLoading = false; throw error; }
    directory = { ids: rankedIds, page: 1, totalPages: 1 };
  }
  const known = new Set(streamers.map(item => item.soopId));
  const seeds = directory.ids.filter(id => !known.has(id)).map((soopId, index) => ({
    soopId, category: category === '전체' ? '기타' : category,
    categoryGroup: category === '전체' ? '기타' : category,
    accent: accents[(streamers.length + index) % accents.length],
    officialRank: streamers.length + index + 1
  }));
  let cursor = 0;
  async function worker() {
    while (cursor < seeds.length) {
      const seed = seeds[cursor++];
      try { loaded.push(await fetchStreamer(seed.soopId, seed)); } catch { /* unavailable channels are skipped */ }
    }
  }
  await Promise.all(Array.from({ length: 10 }, worker));
  loaded.sort((a, b) => a.officialRank - b.officialRank);
  streamers = [...streamers, ...loaded];
  directoryPage = nextPage;
  hasMoreStreamers = nextPage < directory.totalPages && directory.ids.length > 0;
  streamersLoading = false;
  lastUpdated = new Date();
  if (!streamers.length) throw new Error('SOOP 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
  return streamers;
}

export async function addStreamer(soopId) {
  const existing = streamers.find(item => item.soopId.toLowerCase() === soopId.toLowerCase());
  if (existing) return existing;
  const streamer = await fetchStreamer(soopId);
  streamers = [...streamers, streamer];
  lastUpdated = new Date();
  return streamer;
}

export const categories = ['전체', '게임', '버추얼', '보이는 라디오', '스포츠', '먹방/쿡방', '음악', '여행', '교육/정보', '기타'];
