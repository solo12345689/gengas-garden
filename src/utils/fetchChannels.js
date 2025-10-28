// src/utils/fetchChannels.js
export async function loadChannels() {
  const remote =
    "https://raw.githubusercontent.com/solo12345689/gengas-garden/main/public/channels.json";

  try {
    const res = await fetch(remote, { cache: "no-store" });
    if (!res.ok) throw new Error("Remote fetch failed");
    const data = await res.json();
    console.log("📦 fetchChannels — loaded from remote");
    return data;
  } catch (e) {
    console.warn("⚠️ Remote fetch failed, falling back to local", e);
    try {
      const r = await fetch("/channels.json");
      if (!r.ok) throw new Error("Local fetch failed");
      const data = await r.json();
      console.log("📦 fetchChannels — loaded from local");
      return data;
    } catch (err) {
      console.error("❌ Both remote and local fetch failed", err);
      return null;
    }
  }
}
