export async function loadChannels() {
  const cacheKey = "gengas-channels-v1";
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      console.log("Loaded channels from cache");
      return JSON.parse(cached);
    } catch {}
  }

  const remote = "https://raw.githubusercontent.com/solo12345689/gengas-garden/main/public/channels.json";

  try {
    const res = await fetch(remote, { cache: "force-cache" });
    const data = await res.json();
    localStorage.setItem(cacheKey, JSON.stringify(data));
    return data;
  } catch (err) {
    console.error("Failed to load channels", err);
    return {};
  }
}
