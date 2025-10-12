import express from 'express';
import ytdlp from 'yt-dlp-exec';
const router = express.Router();
router.get('/', async (req, res)=>{
  const url = req.query.url;
  if(!url) return res.status(400).json({ error: 'missing url' });
  try{
    const out = await ytdlp(url, { args: ['-g','-f','best'] });
    const streamUrl = (out || '').toString().split('\n')[0].trim();
    if(!streamUrl) return res.status(500).json({ error: 'no stream url' });
    res.json({ streamUrl });
  }catch(err){ console.error('yt-dlp error', err); res.status(500).json({ error: 'yt-dlp failed' }); }
});
export default router;
