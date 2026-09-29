export const streamers = [
  { soopId: 'kimminsik', nickname: '김민교', category: '게임', cumulativeUsers: 2531223192, accent: '#7464ff', initials: '김민', delta: 16840000 },
  { soopId: 'broadcast_b', nickname: '감스트', category: '스포츠', cumulativeUsers: 1892382100, accent: '#3e8cff', initials: '감스', delta: 21300000 },
  { soopId: 'broadcast_c', nickname: '봉준', category: '보이는 라디오', cumulativeUsers: 1721113281, accent: '#f05d8f', initials: '봉준', delta: 11800000 },
  { soopId: 'virtual_mango', nickname: '마왕루야', category: '버추얼', cumulativeUsers: 987400000, accent: '#a855f7', initials: '루야', delta: 9400000 },
  { soopId: 'game_master', nickname: '타요', category: '게임', cumulativeUsers: 794200000, accent: '#ff9d43', initials: '타요', delta: 7300000 },
  { soopId: 'haetbi', nickname: '햇비', category: '버추얼', cumulativeUsers: 423810000, accent: '#4bd6a5', initials: '햇비', delta: 12600000 },
  { soopId: 'cook_daily', nickname: '쯔양', category: '먹방/쿡방', cumulativeUsers: 297100000, accent: '#ff765c', initials: '쯔양', delta: 5100000 },
  { soopId: 'music_room', nickname: '소리나', category: '음악', cumulativeUsers: 196500000, accent: '#f2c14e', initials: '소리', delta: 4600000 },
  { soopId: 'travel_j', nickname: '여행가J', category: '여행', cumulativeUsers: 79800000, accent: '#2dd4bf', initials: '여행', delta: 2900000 },
  { soopId: 'learn_today', nickname: '오늘의지식', category: '교육/정보', cumulativeUsers: 49850000, accent: '#38bdf8', initials: '지식', delta: 1800000 },
  { soopId: 'rookie_gamer', nickname: '루키온', category: '게임', cumulativeUsers: 19880000, accent: '#818cf8', initials: '루키', delta: 840000 },
  { soopId: 'new_voice', nickname: '새봄소리', category: '버추얼', cumulativeUsers: 9300000, accent: '#fb7185', initials: '새봄', delta: 620000 }
].map((item, index) => ({
  ...item,
  lastUpdated: '2026-09-29T16:29:00+09:00',
  totalBroadcastHours: 12840 - index * 713,
  followers: Math.max(18200, Math.round(item.cumulativeUsers / 4100)),
  subscribers: {
    basic: Math.max(320, Math.round(item.cumulativeUsers / 184000)),
    plus: Math.max(48, Math.round(item.cumulativeUsers / 790000))
  },
  fanClub: Math.max(860, Math.round(item.cumulativeUsers / 22500)),
  history: {
    daily: [0.965, 0.97, 0.976, 0.981, 0.986, 0.993, 1].map((r, i) => ({ label: `${23 + i}일`, value: Math.round(item.cumulativeUsers * r) })),
    monthly: [0.72, 0.77, 0.79, 0.84, 0.87, 0.93, 1].map((r, i) => ({ label: `${i + 4}월`, value: Math.round(item.cumulativeUsers * r) })),
    yearly: [0.19, 0.34, 0.51, 0.73, 1].map((r, i) => ({ label: `${2022 + i}년`, value: Math.round(item.cumulativeUsers * r) }))
  },
  seedRank: index + 1
}));

export const categories = ['전체', '게임', '버추얼', '보이는 라디오', '스포츠', '먹방/쿡방', '음악', '여행', '교육/정보', '기타'];
