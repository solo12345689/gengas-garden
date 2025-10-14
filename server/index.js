import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 5000;

// for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve client build
app.use(express.static(path.join(__dirname, "../client/dist")));

// API endpoint
app.get("/api/channels", (req, res) => {
  try {
    const channelsPath = path.join(__dirname, "channels.json");
    const channels = JSON.parse(fs.readFileSync(channelsPath));
    res.json(channels);
  } catch (err) {
    console.error("Error loading channels:", err);
    res.json({ error: "channels not available" });
  }
});

// Fallback for React router
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
