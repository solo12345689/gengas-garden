export async function loadChannels() {
  const remote = 'https://raw.githubusercontent.com/solo12345689/gengas-garden/main/public/channels.json';
  try {
    const res = await fetch(remote, { cache: 'no-store' });
    if (!res.ok) throw new Error('remote fetch failed');
    return await res.json();
  } catch (e) {
    console.warn('Remote fetch failed, falling back to local', e);
    try {
      const r = await fetch('/channels.json');
      if (!r.ok) throw new Error('local fetch failed');
      return await r.json();
    } catch (err) {
      console.error('Both remote and local fetch failed', err);
      return null;
    }
  }
}
