const CATEGORY_TYPES = new Set(['all', 'game', 'talkcam', 'sports_general', 'mukbang', 'music', 'travel', 'study']);

export default async function handler(req, res) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(10, Number(req.query.pageSize) || 30));
  const category = CATEGORY_TYPES.has(req.query.category) ? req.query.category : 'all';
  const params = new URLSearchParams({
    keyword: '', sex_type: 'A', rank_type: category,
    min_viewer: '0', max_viewer: '100000', min_ytb: '0', max_ytb: '5000000',
    page: String(page), page_row: String(pageSize), order_by: 'accu_user_count', type_sel_cnt: '1'
  });

  try {
    const response = await fetch(`https://partnership.sooplive.com/api/mcnBj.php?${params}`, {
      headers: { Accept: 'application/json', 'User-Agent': 'SOOP.GG fan ranking' }
    });
    if (!response.ok) throw new Error(`SOOP ${response.status}`);
    const payload = await response.json();
    const result = payload.RESULT || {};
    let ids = (result.DATA || []).map(item => item.user_id).filter(Boolean);
    // SOOP 목록은 장기 미방송 채널을 제외하지만 채널 공개 API에는 유효한 데이터가 남아 있다.
    if (category === 'all' && page === 1) ids = ['y1026', ...ids.filter(id => id !== 'y1026')].slice(0, pageSize);
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.status(200).json({
      ids,
      page,
      totalPages: Number(result.TOTAL_PAGE) || page,
      totalCount: Number(result.TOTAL_CNT) || 0
    });
  } catch (error) {
    res.status(502).json({ error: 'SOOP 스트리머 목록을 불러오지 못했습니다.' });
  }
}
