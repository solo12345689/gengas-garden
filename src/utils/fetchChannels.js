// src/utils/fetchChannels.js

// Cache key name
const CACHE_KEY = "genga_tv_channels";
const CACHE_DURATION = 1000 * 60 * 60 * 6; // 6 hours

/**
 * Fetches TV channels (with caching for speed)
 */
export default async function fetchChannels() {
  try {
    // Load cached channels if available
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_DURATION) {
        console.log("📺 Loaded channels from cache");
        return parsed.data;
      }
    }

    // If no cache, fetch fresh data
    console.log("🌐 Fetching channels from server...");
    const response = await fetch("/channels.json"); // or your API endpoint
    if (!response.ok) throw new Error("Failed to fetch channel data");

    const data = await response.json();

    // Save to cache
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ timestamp: Date.now(), data })
    );

    console.log(`✅ Channels fetched: ${data.length}`);
    return data;
  } catch (error) {
    console.error("❌ Error fetching channels:", error);
    return [];
  }
}
