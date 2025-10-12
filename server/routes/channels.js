import express from 'express';
import fs from 'fs';
import path from 'path';
const router = express.Router();
router.get('/', (req, res)=>{
  try{
    const file = path.join(process.cwd(), 'server', 'channels.json');
    const raw = fs.readFileSync(file, 'utf-8');
    res.type('json').send(raw);
  }catch(e){ res.status(500).json({ error: 'channels not available' }) }
});
export default router;
