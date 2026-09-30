const STATION_STATUS_API = 'https://st.sooplive.com/api/get_station_status.php';

export default async function handler(req, res) {
  const id = String(req.query.id || '').trim();
  if (!/^[0-9A-Za-z_-]{2,40}$/.test(id)) {
    return res.status(400).json({ error: '올바른 SOOP ID가 아닙니다.' });
  }

  try {
    const response = await fetch(`${STATION_STATUS_API}?szBjId=${encodeURIComponent(id)}`, {
      headers: { Accept: 'application/json', 'User-Agent': 'SOOP.GG fan ranking' },
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) throw new Error(`SOOP ${response.status}`);
    const payload = await response.json();
    if (Number(payload.RESULT) !== 1 || !payload.DATA) return res.status(404).json({ error: '채널을 찾을 수 없습니다.' });
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({ status: payload.DATA });
  } catch {
    return res.status(502).json({ error: 'SOOP 채널 정보를 불러오지 못했습니다.' });
  }
}
