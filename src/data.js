const MAX_STREAMERS = 1000;

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
  'Talk/Cam': '보이는 라디오',
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
  const raw = cleanText(vods?.data?.[0]?.ucc?.category_tags?.[0]);
  return categoryTranslations[raw] || raw;
}

function mapVods(vods) {
  return (vods?.data || []).map((item) => {
    const ucc = item?.ucc || item || {};
    const vodId = ucc.title_no || ucc.ucc_no || ucc.vod_no || item.title_no || item.ucc_no;
    const thumbnail = absoluteImage(
      ucc.thumb || ucc.thumbnail || ucc.thumbnail_url || item.thumb || item.thumbnail || ''
    );
    return {
      id: String(vodId || ''),
      title: cleanText(item.title_name || ucc.title || ucc.subject || item.title || '다시보기'),
      thumbnail,
      date: ucc.reg_date || ucc.created_at || item.reg_date || item.created_at || '',
      views: Number(item.count?.vod_read_cnt || item.count?.read_cnt || ucc.view_cnt || ucc.read_cnt || item.view_cnt || item.read_cnt) || 0,
      duration: Math.round((Number(ucc.total_file_duration) || 0) / 1000) || Number(ucc.duration || item.duration) || 0,
      url: vodId ? `https://vod.sooplive.com/player/${encodeURIComponent(vodId)}` : ''
    };
  }).filter(vod => vod.id || vod.url);
}

function vodMeta(vods) {
  const meta = vods?.meta || {};
  return {
    currentPage: Number(meta.current_page) || 1,
    lastPage: Number(meta.last_page) || 1,
    total: Number(meta.total) || (vods?.data?.length || 0)
  };
}

function mapStationStatus(status, seed, detectedCategory = '') {
  const nickname = cleanText(status.user_nick || status.station_name || seed.soopId);
  const cumulativeUsers = Number(status.total_view_cnt) || 0;
  const point = { label: '현재', value: cumulativeUsers };
  const profilePrefix = encodeURIComponent(seed.soopId.slice(0, 2));
  const profileId = encodeURIComponent(seed.soopId);

  return {
    ...seed,
    category: detectedCategory || seed.category || '기타',
    categoryGroup: seed.categoryGroup && seed.categoryGroup !== '기타' ? seed.categoryGroup : categoryGroup(detectedCategory || seed.category),
    nickname,
    initials: nickname.replace(/[^0-9A-Za-z가-힣]/g, '').slice(0, 2) || seed.soopId.slice(0, 2),
    profileImage: `https://profile.img.sooplive.co.kr/LOGO/${profilePrefix}/${profileId}/${profileId}.jpg`,
    cumulativeUsers,
    delta: 0,
    isLive: Boolean(status.broad_no),
    liveViewers: 0,
    liveTitle: '',
    broadNo: status.broad_no || null,
    liveThumbnail: status.broad_no ? `https://liveimg.sooplive.com/m/${status.broad_no}.jpg` : '',
    lastUpdated: new Date().toISOString(),
    totalBroadcastHours: Math.round((Number(status.total_broad_time) || 0) / 3600),
    followers: Number(status.fan_cnt) || 0,
    subscribers: { basic: Number(status.total_sub_cnt) || 0, plus: 0 },
    fanClub: null,
    vods: [],
    vodMeta: { currentPage: 1, lastPage: 1, total: 0 },
    vodsLoaded: false,
    history: { daily: [point], monthly: [point], yearly: [point] },
    stationTitle: cleanText(status.station_title || ''),
    dataSource: 'SOOP 공개 채널 상태 API'
  };
}

export let streamers = [];
export let lastUpdated = null;
export let hasMoreStreamers = true;
export let streamersLoading = false;
export let rankingPopulation = 0;
const streamerCache = new Map();
let directoryPage = 0;
let activeDirectoryCategory = 'all';
let activePageSize = 100;

const directoryCategory = {
  '전체': 'all', '게임': 'game', '버추얼': 'all', '보이는 라디오': 'talkcam',
  '스포츠': 'sports_general', '먹방/쿡방': 'mukbang', '음악': 'music',
  '여행': 'travel', '교육/정보': 'study', '기타': 'all'
};

export async function fetchStreamer(soopId, overrides = {}) {
  const id = String(soopId || '').trim().replace(/^@/, '');
  if (!/^[0-9A-Za-z_-]{2,40}$/.test(id)) throw new Error('올바른 SOOP ID를 입력해 주세요.');
  const cached = streamerCache.get(id.toLowerCase());
  if (cached) return {
    ...cached,
    soopId: id,
    accent: overrides.accent || cached.accent,
    officialRank: overrides.officialRank || cached.officialRank
  };
  const requestOptions = { headers: { Accept: 'application/json' }, credentials: 'omit' };
  const [stationResponse, vodResponse] = await Promise.all([
    fetch(`/api/station?id=${encodeURIComponent(id)}`, requestOptions),
    fetch(`/api/vods?id=${encodeURIComponent(id)}&page=1`, requestOptions).catch(() => null)
  ]);
  if (!stationResponse.ok) throw new Error('SOOP 채널 정보를 불러오지 못했습니다.');
  const [stationPayload, vodData] = await Promise.all([
    stationResponse.json(),
    vodResponse?.ok ? vodResponse.json().catch(() => null) : null
  ]);
  const status = stationPayload.status || stationPayload.DATA;
  if (!status) throw new Error('SOOP 채널 정보를 불러오지 못했습니다.');
  const streamer = mapStationStatus(status, { soopId: id, category: '기타', accent: '#7968ff', ...overrides }, primaryCategory(vodData));
  streamer.vods = mapVods(vodData);
  streamer.vodMeta = vodMeta(vodData);
  streamer.vodsLoaded = Boolean(vodData);
  streamerCache.set(id.toLowerCase(), streamer);
  return streamer;
}

export async function loadStreamerVods(soopId, page = 1) {
  const id = String(soopId || '').trim();
  const response = await fetch(`/api/vods?id=${encodeURIComponent(id)}&page=${Math.max(1, Number(page) || 1)}`, {
    headers: { Accept: 'application/json' }, credentials: 'omit'
  });
  if (!response.ok) throw new Error('VOD 목록을 불러오지 못했습니다.');
  const payload = await response.json();
  const update = { vods: mapVods(payload), vodMeta: vodMeta(payload), vodsLoaded: true };
  const key = id.toLowerCase();
  const cached = streamerCache.get(key);
  if (cached) streamerCache.set(key, { ...cached, ...update });
  streamers = streamers.map(item => item.soopId.toLowerCase() === key ? { ...item, ...update } : item);
  return update;
}

async function fetchDirectoryPage(page, category, pageSize) {
  const response = await fetch(`/api/streamers?page=${page}&category=${encodeURIComponent(category)}&pageSize=${pageSize}`);
  if (!response.ok) throw new Error('SOOP 스트리머 목록을 불러오지 못했습니다.');
  const payload = await response.json();
  if (payload.ids) {
    if (page === 1 && category === 'all') payload.ids = ['y1026', ...payload.ids.filter(id => id !== 'y1026')].slice(0, pageSize);
    const totalCount = Number(payload.totalCount) || Number(payload.totalPages) * pageSize;
    return { ...payload, totalCount, totalPages: Number(payload.totalPages) || Math.ceil(totalCount / pageSize) || page };
  }
  const result = payload.RESULT || {};
  let ids = (result.DATA || []).map(item => item.user_id);
  if (page === 1 && category === 'all') ids = ['y1026', ...ids.filter(id => id !== 'y1026')].slice(0, pageSize);
  const totalPages = Number(result.TOTAL_PAGE) || page;
  return { ids, page, totalPages, totalCount: Number(result.TOTAL_CNT || result.TOTAL_COUNT) || totalPages * pageSize };
}

let loadQueue = Promise.resolve();

async function performLoadStreamers({ reset = true, category = '전체' } = {}) {
  streamersLoading = true;
  const requestedCategory = directoryCategory[category] || 'all';
  const requestedPageSize = 100;
  if (reset || requestedCategory !== activeDirectoryCategory) {
    streamers = [];
    directoryPage = 0;
    hasMoreStreamers = true;
    activeDirectoryCategory = requestedCategory;
    activePageSize = requestedPageSize;
  }
  if (!hasMoreStreamers) { streamersLoading = false; return streamers; }

  const loaded = [];
  const nextPage = directoryPage + 1;
  let directory;
  try {
    directory = await fetchDirectoryPage(nextPage, activeDirectoryCategory, activePageSize);
  } catch (error) {
    if (nextPage !== 1 || activeDirectoryCategory !== 'all') { streamersLoading = false; throw error; }
    directory = { ids: rankedIds, page: 1, totalPages: 1 };
  }
  if (activeDirectoryCategory === 'all' && directory.totalCount) rankingPopulation = directory.totalCount;
  const known = new Set(streamers.filter(item => !item.searchOnly).map(item => item.soopId));
  const seeds = directory.ids.filter(id => !known.has(id)).map((soopId, index) => ({
    soopId, category: activeDirectoryCategory === 'all' ? '기타' : category,
    categoryGroup: activeDirectoryCategory === 'all' ? '기타' : category,
    accent: accents[(streamers.length + index) % accents.length],
    officialRank: streamers.length + index + 1
  }));
  const statusById = new Map((directory.streamers || []).map(item => [String(item.user_id).toLowerCase(), item]));
  if (statusById.size) {
    for (const seed of seeds) {
      const status = statusById.get(seed.soopId.toLowerCase());
      if (!status) continue;
      const detectedCategory = categoryTranslations[status.category] || status.category || '';
      const streamer = mapStationStatus(status, seed, detectedCategory);
      streamerCache.set(seed.soopId.toLowerCase(), streamer);
      loaded.push(streamer);
    }
  } else {
    let cursor = 0;
    async function worker() {
      while (cursor < seeds.length) {
        const seed = seeds[cursor++];
        try { loaded.push(await fetchStreamer(seed.soopId, seed)); } catch { /* unavailable channels are skipped */ }
      }
    }
    await Promise.all(Array.from({ length: 10 }, worker));
  }
  loaded.sort((a, b) => a.officialRank - b.officialRank);
  const loadedIds = new Set(loaded.map(item => item.soopId.toLowerCase()));
  streamers = [...streamers.filter(item => !(item.searchOnly && loadedIds.has(item.soopId.toLowerCase()))), ...loaded].slice(0, MAX_STREAMERS);
  directoryPage = nextPage;
  const loadedCount = streamers.filter(item => !item.searchOnly).length;
  const availablePages = Number(directory.totalPages) || Math.ceil((Number(directory.totalCount) || MAX_STREAMERS) / activePageSize);
  hasMoreStreamers = loadedCount < MAX_STREAMERS && nextPage < availablePages && directory.ids.length > 0;
  streamersLoading = false;
  lastUpdated = new Date();
  if (!streamers.length) throw new Error('SOOP 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
  return streamers;
}

export function loadStreamers(options = {}) {
  const queuedLoad = loadQueue.catch(() => undefined).then(() => performLoadStreamers(options));
  loadQueue = queuedLoad;
  return queuedLoad;
}

export async function addStreamer(soopId) {
  const existing = streamers.find(item => item.soopId.toLowerCase() === soopId.toLowerCase());
  if (existing) return existing;
  const streamer = { ...await fetchStreamer(soopId), searchOnly: true };
  streamers = [...streamers, streamer];
  lastUpdated = new Date();
  return streamer;
}

export async function searchStreamers(keyword) {
  const query = String(keyword || '').trim();
  if (!query) return [];
  const response = await fetch(`/api/search?keyword=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error('SOOP 닉네임 검색에 실패했습니다.');
  const { ids = [] } = await response.json();
  const found = (await Promise.all(ids.slice(0, 8).map(id => fetchStreamer(id).catch(() => null)))).filter(Boolean);
  const known = new Set(streamers.map(item => item.soopId.toLowerCase()));
  const added = found.filter(item => !known.has(item.soopId.toLowerCase())).map(item => ({ ...item, searchOnly: true }));
  if (added.length) streamers = [...streamers, ...added];
  return found;
}

export const categories = ['전체', '게임', '버추얼', '보이는 라디오', '스포츠', '먹방/쿡방', '음악', '여행', '교육/정보', '기타'];
