import express from "express";
import cors from "cors";
import { exec } from "youtube-dl-exec";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// 🧩 Test route
app.get("/", (req, res) => {
  res.send("✅ Gengas Garden Server is running...");
});

// 🎥 Example YouTube downloader route
app.post("/api/download", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "Missing 'url' in request body" });
    }

    console.log(`Downloading: ${url}`);

    const result = await exec(url, {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
    });

    res.json({
      title: result.title,
      duration: result.duration,
      thumbnail: result.thumbnail,
      url: result.url,
    });
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).json({ error: "Failed to fetch video data" });
  }
});

// 🟢 Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
