const CATEGORY_TYPES = new Set(['all', 'game', 'virtual', 'talkcam', 'sports_general', 'mukbang', 'music', 'travel', 'study']);

export default async function handler(req, res) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const category = CATEGORY_TYPES.has(req.query.category) ? req.query.category : 'all';
  const params = new URLSearchParams({
    keyword: '', sex_type: 'A', rank_type: category,
    min_viewer: '0', max_viewer: '100000', min_ytb: '0', max_ytb: '5000000',
    page: String(page), page_row: '100', order_by: 'accu_user_count', type_sel_cnt: '1'
  });

  try {
    const response = await fetch(`https://partnership.sooplive.com/api/mcnBj.php?${params}`, {
      headers: { Accept: 'application/json', 'User-Agent': 'SOOP.GG fan ranking' }
    });
    if (!response.ok) throw new Error(`SOOP ${response.status}`);
    const payload = await response.json();
    const result = payload.RESULT || {};
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.status(200).json({
      ids: (result.DATA || []).map(item => item.user_id).filter(Boolean),
      page,
      totalPages: Number(result.TOTAL_PAGE) || page,
      totalCount: Number(result.TOTAL_CNT) || 0
    });
  } catch (error) {
    res.status(502).json({ error: 'SOOP 스트리머 목록을 불러오지 못했습니다.' });
  }
}
