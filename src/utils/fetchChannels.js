export async function loadChannels(remoteUrl) {
  const url = remoteUrl || 'https://raw.githubusercontent.com/solo12345689/gengas-garden/main/public/channels.json';
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('fetch failed');
    return await res.json();
  } catch (e) {
    console.error('Failed to load remote channels.json, falling back to local:', e);
    try { const r = await fetch('/channels.json'); if (!r.ok) throw new Error('local fetch failed'); return await r.json(); } catch (err) { console.error('Failed local', err); return null; }
  }
}
