import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Example API route
app.get("/api/channels", (req, res) => {
  try {
    const channels = [
      { id: 1, name: "Radio Garden", url: "https://example.com" },
      { id: 2, name: "BBC Radio", url: "https://bbc.co.uk" },
    ];
    res.json(channels);
  } catch (err) {
    res.status(500).json({ error: "channels not available" });
  }
});

// Serve React client (from /public or /client/dist)
app.use(express.static(path.join(__dirname, "public")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`🎧 Gengas Garden backend running on port ${PORT}`);
});
