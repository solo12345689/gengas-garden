export async function fetchChannels(){ const res = await fetch('/api/channels'); if(!res.ok) throw new Error('channels fetch failed'); return res.json(); }
export async function requestStream(url){ const res = await fetch('/api/play?url='+encodeURIComponent(url)); if(!res.ok) throw new Error('play failed'); return res.json(); }
