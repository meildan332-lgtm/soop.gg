const STATION_STATUS_API = 'https://st.sooplive.com/api/get_station_status.php';
const LIVE_API = 'https://api-channel.sooplive.co.kr/v1.1/channel';

async function fetchLiveStatus(id) {
  try {
    const response = await fetch(`${LIVE_API}/${encodeURIComponent(id)}/home/section/broad`, {
      headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0', Referer: 'https://www.sooplive.co.kr/', Origin: 'https://www.sooplive.co.kr' },
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) return null;
    const live = await response.json();
    return live?.broadNo ? live : null;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  const id = String(req.query.id || '').trim();
  if (!/^[0-9A-Za-z_-]{2,40}$/.test(id)) {
    return res.status(400).json({ error: '올바른 SOOP ID가 아닙니다.' });
  }

  try {
    const [response, live] = await Promise.all([
      fetch(`${STATION_STATUS_API}?szBjId=${encodeURIComponent(id)}`, {
        headers: { Accept: 'application/json', 'User-Agent': 'SOOP.GG fan ranking' },
        signal: AbortSignal.timeout(8000)
      }),
      fetchLiveStatus(id)
    ]);
    if (!response.ok) throw new Error(`SOOP ${response.status}`);
    const payload = await response.json();
    if (Number(payload.RESULT) !== 1 || !payload.DATA) return res.status(404).json({ error: '채널을 찾을 수 없습니다.' });
    const status = {
      ...payload.DATA,
      broad_no: live?.broadNo || null,
      live_title: live?.broadTitle || '',
      live_viewers: Number(live?.currentSumViewer) || 0
    };
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=30');
    return res.status(200).json({ status });
  } catch {
    return res.status(502).json({ error: 'SOOP 채널 정보를 불러오지 못했습니다.' });
  }
}
