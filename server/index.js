import express from "express";
import cors from "cors";
import youtubedl from "youtube-dl-exec"; // <-- CommonJS package import

const { exec } = youtubedl;
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("🎧 Gengas Garden backend running");
});

// Example endpoint
app.get("/video", async (req, res) => {
  const url = req.query.url;
  try {
    const result = await exec(url, {
      dumpSingleJson: true,
      noWarnings: true,
      preferFreeFormats: true,
      addHeader: ["referer:youtube.com", "user-agent:googlebot"],
    });
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch video data" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
