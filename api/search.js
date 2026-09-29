export default async function handler(req, res) {
  const keyword = String(req.query.keyword || '').trim().slice(0, 40);
  if (!keyword) return res.status(200).json({ ids: [] });
  const params = new URLSearchParams({
    keyword, sex_type: 'A', rank_type: 'all', min_viewer: '0', max_viewer: '100000',
    min_ytb: '0', max_ytb: '5000000', page: '1', page_row: '10',
    order_by: 'accu_user_count', type_sel_cnt: '1'
  });
  try {
    const response = await fetch(`https://partnership.sooplive.com/api/mcnBj.php?${params}`, {
      headers: { Accept: 'application/json', 'User-Agent': 'SOOP.GG fan ranking' }
    });
    if (!response.ok) throw new Error(`SOOP ${response.status}`);
    const payload = await response.json();
    const ids = (payload.RESULT?.DATA || []).map(item => item.user_id).filter(Boolean);
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    res.status(200).json({ ids });
  } catch {
    res.status(502).json({ error: 'SOOP 닉네임 검색에 실패했습니다.' });
  }
}
