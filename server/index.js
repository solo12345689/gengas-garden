import express from 'express'
import path from 'path'
import cors from 'cors'
import { fileURLToPath } from 'url'
import ytdlp from 'yt-dlp-exec'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const app = express()
app.use(cors())
app.use(express.json())

// serve built frontend
const distPath = path.join(__dirname, '..', 'dist')
app.use(express.static(distPath))

app.get('/api/play', async (req, res) => {
  const url = req.query.url
  if(!url) return res.status(400).json({ error: 'missing url' })
  try{
    // ytdlp -g -f best
    const out = await ytdlp(url, { args: ['-g', '-f', 'best'] })
    // yt-dlp-exec returns string with newline; take first line
    const streamUrl = (out || '').toString().split('\n')[0].trim()
    if(!streamUrl) return res.status(500).json({ error: 'no stream' })
    return res.json({ streamUrl })
  }catch(err){
    console.error('yt-dlp error', err)
    return res.status(500).json({ error: 'failed' })
  }
})

// fallback to index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

const port = process.env.PORT || 8080
app.listen(port, () => console.log('Server listening on', port))
