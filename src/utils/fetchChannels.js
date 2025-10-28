export default async function fetchChannels() {
  const remote =
    "https://raw.githubusercontent.com/solo12345689/gengas-garden/main/public/channels.json";
  try {
    const res = await fetch(remote, { cache: "no-store" });
    if (!res.ok) throw new Error("remote fetch failed");
    const json = await res.json();
    console.log("📦 fetchChannels — loaded from remote");
    return json;
  } catch {
    console.warn("⚠️ Remote fetch failed, falling back to local");
    try {
      const res = await fetch("/channels.json");
      return await res.json();
    } catch {
      console.error("❌ Both remote and local fetch failed");
      return {};
    }
  }
}
