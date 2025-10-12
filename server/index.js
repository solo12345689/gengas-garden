import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import channelsRouter from './routes/channels.js';
import playRouter from './routes/play.js';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(cors());
app.use(express.json());

const distPath = path.join(__dirname, '..', 'client', 'dist');
if(fs.existsSync(distPath)){
  app.use(express.static(distPath));
}

app.use('/api/channels', channelsRouter);
app.use('/api/play', playRouter);

app.get('*', (req, res)=>{
  if(fs.existsSync(path.join(distPath,'index.html'))){
    res.sendFile(path.join(distPath,'index.html'));
  } else {
    res.send('Gengas Garden server running');
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, ()=> console.log('Server listening on', PORT));
