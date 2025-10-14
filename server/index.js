import express from "express";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 10000;

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());

// Serve channels list
app.get("/api/channels", (req, res) => {
  try {
    const channelsPath = path.join(__dirname, "channels.json");
    if (!fs.existsSync(channelsPath)) {
      return res.status(404).json({ error: "channels not available" });
    }
    const data = fs.readFileSync(channelsPath, "utf8");
    res.json(JSON.parse(data));
  } catch (err) {
    console.error("Error reading channels:", err);
    res.status(500).json({ error: "failed to read channels" });
  }
});

// Play route (uses yt-dlp)
app.get("/api/play", (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: "Missing url param" });

  // Stream info via yt-dlp
  exec(`yt-dlp -g -f best "${url}"`, (error, stdout, stderr) => {
    if (error) {
      console.error("yt-dlp error:", stderr);
      return res.status(500).json({ error: "Failed to fetch stream" });
    }
    const streamUrl = stdout.trim();
    res.json({ streamUrl });
  });
});

// Serve React build
app.use(express.static(path.join(__dirname, "../client/dist")));

// Fallback (React Router)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

// Start
app.listen(PORT, () => console.log(`✅ Gengas Garden running on port ${PORT}`));
