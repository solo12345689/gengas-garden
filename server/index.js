import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import ytdlp from 'yt-dlp-exec';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(cors());
app.use(express.json());

const distPath = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

app.get('/api/channels', (req, res) => {
  try{
    const file = path.join(__dirname, 'channels.json');
    const raw = fs.readFileSync(file, 'utf-8');
    res.type('json').send(raw);
  }catch(e){ res.status(500).json({error:'channels not available'}); }
});

app.get('/api/play', async (req, res) => {
  const url = req.query.url;
  if(!url) return res.status(400).json({ error: 'missing url' });
  try{
    const out = await ytdlp(url, { args: ['-g','-f','best'] });
    const streamUrl = (out || '').toString().split('\n')[0].trim();
    if(!streamUrl) return res.status(500).json({ error: 'no stream url' });
    res.json({ streamUrl });
  }catch(err){ console.error('yt-dlp error', err); res.status(500).json({ error: 'yt-dlp failed' }); }
});

app.get('*', (req, res) => {
  if (fs.existsSync(path.join(distPath, 'index.html'))) {
    res.sendFile(path.join(distPath, 'index.html'));
  } else {
    res.send('Gengas Garden server running');
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, ()=> console.log('Server listening on', PORT));
