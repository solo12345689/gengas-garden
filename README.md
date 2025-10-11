# Gengas Garden - Full (Frontend + yt-dlp backend)

This package includes a React + Vite frontend and an Express backend that proxies YouTube via yt-dlp.

How it works
1. The frontend fetches public/channels.json and shows countries + channels.
2. When a YouTube channel is clicked, frontend requests /api/play?url=YOUTUBE_URL
3. Server runs yt-dlp (via yt-dlp-exec) to extract a playable stream URL and returns it as JSON.
4. Frontend plays that stream URL in the <video> player.

Run locally (requires Node 20+):

npm install
npm run build
npm start

Notes:
- yt-dlp-exec downloads/uses a yt-dlp binary at runtime. Ensure server has access to internet and permissions.
- This proxy may be rate-limited by YouTube and streams can expire; consider caching.
