export const tiers = [
  { name: '언랭크', group: '미등급', min: 0, color: '#222630' },
  { name: '실버 3', group: '실버', min: 5_000_000, color: '#aab7ca' },
  { name: '실버 2', group: '실버', min: 7_000_000, color: '#b8c4d5' },
  { name: '실버 1', group: '실버', min: 10_000_000, color: '#d0d9e5' },
  { name: '골드 3', group: '골드', min: 12_000_000, color: '#d6a83d' },
  { name: '골드 2', group: '골드', min: 15_000_000, color: '#e5b94f' },
  { name: '골드 1', group: '골드', min: 20_000_000, color: '#f3cc63' },
  { name: '플래티넘 3', group: '플래티넘', min: 30_000_000, color: '#9a82ef' },
  { name: '플래티넘 2', group: '플래티넘', min: 50_000_000, color: '#ad90ff' },
  { name: '플래티넘 1', group: '플래티넘', min: 80_000_000, color: '#c3aaff' },
  { name: '에메랄드 3', group: '에메랄드', min: 100_000_000, color: '#45cba4' },
  { name: '에메랄드 2', group: '에메랄드', min: 300_000_000, color: '#50dfb5' },
  { name: '에메랄드 1', group: '에메랄드', min: 500_000_000, color: '#6ae8c4' },
  { name: '다이아 3', group: '다이아', min: 1_000_000_000, color: '#55b9ff' },
  { name: '다이아 2', group: '다이아', min: 1_300_000_000, color: '#70c7ff' },
  { name: '다이아 1', group: '다이아', min: 1_500_000_000, color: '#8dd5ff' },
  { name: '프레스티지', group: '프레스티지', min: 2_000_000_000, color: '#d9a8ff' }
];

export function getTierInfo(users) {
  let index = 0;
  tiers.forEach((tier, i) => { if (users >= tier.min) index = i; });
  const current = tiers[index];
  const next = tiers[index + 1] ?? null;
  const span = next ? next.min - current.min : 0;
  const progress = next ? Math.min(100, Math.max(0, ((users - current.min) / span) * 100)) : 100;
  return { current, next, progress, remaining: next ? Math.max(0, next.min - users) : 0 };
}

export function formatCompact(value) {
  if (value >= 100_000_000) return `${(value / 100_000_000).toLocaleString('ko-KR', { maximumFractionDigits: 2 })}억`;
  if (value >= 10_000) return `${Math.floor(value / 10_000).toLocaleString('ko-KR')}만`;
  return value.toLocaleString('ko-KR');
}
