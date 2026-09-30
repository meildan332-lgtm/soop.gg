const VOD_API = 'https://chapi.sooplive.com/api';

export default async function handler(req, res) {
  const id = String(req.query.id || '').trim();
  const page = Math.max(1, Number(req.query.page) || 1);
  if (!/^[0-9A-Za-z_-]{2,40}$/.test(id)) {
    return res.status(400).json({ error: '올바른 SOOP ID가 아닙니다.' });
  }

  try {
    const response = await fetch(`${VOD_API}/${encodeURIComponent(id)}/vods/all/streamer?page=${page}&per_page=24&orderby=reg_date`, {
      headers: { Accept: 'application/json', 'User-Agent': 'SOOP.GG fan ranking' },
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) throw new Error(`SOOP ${response.status}`);
    const payload = await response.json();
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
    return res.status(200).json(payload);
  } catch {
    return res.status(502).json({ error: 'VOD 목록을 불러오지 못했습니다.' });
  }
}
