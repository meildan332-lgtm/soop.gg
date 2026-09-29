const SOOP_API = 'https://chapi.sooplive.com/api';

const seedChannels = [
  { soopId: 'phonics1', category: '게임', accent: '#7464ff' },
  { soopId: 'devil0108', category: '스포츠', accent: '#3e8cff' },
  { soopId: 'sccha21', category: '게임', accent: '#2dd4bf' },
  { soopId: 'babysds', category: '게임', accent: '#ff9d43' },
  { soopId: 'parang1995', category: '버추얼', accent: '#a855f7' },
  { soopId: 'dbdms139', category: '보이는 라디오', accent: '#f05d8f' },
  { soopId: 'joreangyee', category: '버추얼', accent: '#fb7185' },
  { soopId: 'snfl90', category: '보이는 라디오', accent: '#4bd6a5' }
];

const cleanText = (value) => String(value || '').replace(/<[^>]*>/g, '').trim();
const absoluteImage = (url) => url?.startsWith('//') ? `https:${url}` : (url || '');

function mapStation(data, seed) {
  const station = data.station;
  if (!station?.upd) throw new Error('채널 정보를 찾을 수 없습니다.');
  const nickname = cleanText(station.user_nick || station.station_name || seed.soopId);
  const cumulativeUsers = Number(station.upd.total_view_cnt) || 0;
  const point = { label: '현재', value: cumulativeUsers };

  return {
    ...seed,
    nickname,
    initials: nickname.replace(/[^0-9A-Za-z가-힣]/g, '').slice(0, 2) || seed.soopId.slice(0, 2),
    profileImage: absoluteImage(data.profile_image || station.profile_image),
    cumulativeUsers,
    delta: 0,
    isLive: Boolean(data.broad),
    liveViewers: Number(data.broad?.current_sum_viewer) || 0,
    liveTitle: cleanText(data.broad?.broad_title || ''),
    broadNo: data.broad?.broad_no || null,
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

export async function fetchStreamer(soopId, overrides = {}) {
  const id = String(soopId || '').trim().replace(/^@/, '');
  if (!/^[0-9A-Za-z_-]{2,40}$/.test(id)) throw new Error('올바른 SOOP ID를 입력해 주세요.');
  const response = await fetch(`${SOOP_API}/${encodeURIComponent(id)}/station`, { headers: { Accept: 'application/json' }, credentials: 'omit' });
  if (!response.ok) throw new Error('SOOP 채널 정보를 불러오지 못했습니다.');
  return mapStation(await response.json(), { soopId: id, category: '기타', accent: '#7968ff', ...overrides });
}

export async function loadStreamers() {
  const results = await Promise.allSettled(seedChannels.map(seed => fetchStreamer(seed.soopId, seed)));
  streamers = results.filter(result => result.status === 'fulfilled').map(result => result.value);
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
