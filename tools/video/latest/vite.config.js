import process from 'node:process';
import {writeFileSync, mkdirSync} from 'node:fs';
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({cacheDir:'.vite-cache',
  plugins: [react(), {name:'film-save',configureServer(server){server.middlewares.use('/__film/save/',(req,res)=>{if(req.method!=='POST'){res.statusCode=405;res.end();return;}const name=req.url.slice(1);if(!/^[a-z0-9.-]+$/.test(name)){res.statusCode=400;res.end();return;}const chunks=[];req.on('data',c=>chunks.push(c));req.on('end',()=>{mkdirSync(process.env.FILM_RAW_DIR || '../raw',{recursive:true});writeFileSync((process.env.FILM_RAW_DIR || '../raw')+'/'+name,Buffer.concat(chunks));res.end('ok');});});}}],
})
