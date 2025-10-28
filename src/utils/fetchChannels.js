// src/utils/fetchChannels.js
// Fetch channels with: 1) remote raw GitHub primary, 2) local fallback,
// and 3) localStorage caching for speed and offline-friendly behavior.

const REMOTE_URL =
  "https://raw.githubusercontent.com/solo12345689/gengas-garden/main/public/channels.json";
const LOCAL_URL = "/channels.json"; // served from your public/ folder
const CACHE_KEY = "gengas_channels_cache_v1";
const CACHE_TTL = 1000 * 60 * 60 * 6; // 6 hours

export default async function fetchChannels() {
  // Try cached copy first
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const cached = JSON.parse(raw);
      if (cached?.timestamp && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log("📦 fetchChannels — loaded from cache");
        return cached.data;
      }
    }
  } catch (e) {
    console.warn("fetchChannels — cache read/parse error", e);
  }

  // Helper to store cache
  const storeCache = (data) => {
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ timestamp: Date.now(), data })
      );
    } catch (e) {
      console.warn("fetchChannels — cache write failed", e);
    }
  };

  // Try remote (GitHub raw)
  try {
    console.log("🌍 fetchChannels — fetching remote:", REMOTE_URL);
    const res = await fetch(REMOTE_URL, { cache: "no-store", mode: "cors" });
    if (!res.ok) throw new Error(`Remote fetch failed: ${res.status}`);
    const json = await res.json();
    // store and return
    storeCache(json);
    console.log("✅ fetchChannels — remote fetch OK");
    return json;
  } catch (remoteErr) {
    console.warn("⚠️ fetchChannels — remote fetch failed, trying local", remoteErr);
    // fallback to local file
    try {
      const r = await fetch(LOCAL_URL, { cache: "no-store" });
      if (!r.ok) throw new Error(`Local fetch failed: ${r.status}`);
      const localJson = await r.json();
      storeCache(localJson);
      console.log("✅ fetchChannels — local fetch OK");
      return localJson;
    } catch (localErr) {
      console.error("❌ fetchChannels — both remote and local fetch failed", localErr);
      // final fallback: empty object
      return {};
    }
  }
}
