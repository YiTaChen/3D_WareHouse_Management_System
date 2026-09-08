import {spawn,spawnSync} from 'node:child_process';
import {readFile,writeFile,mkdir,symlink,access,copyFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import ffmpeg from 'ffmpeg-static';
const templates=path.dirname(fileURLToPath(import.meta.url));
const repoRoot=path.resolve(templates,'../../..');
const root=path.join(repoRoot,'.video-production');
const repo=repoRoot;const run=path.join(root,'run',String(Date.now()));const raw=path.join(root,'raw');
await mkdir(run,{recursive:true});await mkdir(raw,{recursive:true});
function command(cmd,args,cwd=repo,env=process.env){return new Promise((resolve,reject)=>{const p=spawn(cmd,args,{cwd,env,stdio:'inherit'});p.on('exit',code=>code===0?resolve():reject(Error(cmd+' exited '+code)));});}
await command('npm',['ci']);await command('npm',['ci'],path.join(repo,'backend'));
const stage=path.join(run,'stage');await mkdir(stage,{recursive:true});
const archive=path.join(run,'source.tar');
await command('git',['archive','f912d07d5307ccbe13f1fd3f61273eeb63d46dfa','-o',archive]);
await command('tar',['-xf',archive,'-C',stage]);
for(const name of ['Film.jsx','capture.js'])await copyFile(path.join(templates,name),path.join(stage,'src',name));
await copyFile(path.join(templates,'vite.config.js'),path.join(stage,'vite.config.js'));
let app=await readFile(path.join(stage,'src/App.jsx'),'utf8');
app="import Film from './Film.jsx';\n"+app.replace('<FrameRateLimiter fps={30} />','<FrameRateLimiter fps={30} /><Film />');
await writeFile(path.join(stage,'src/App.jsx'),app);

const env={...process.env,DATABASE_URL:'',DB_ENV:'sqlite',SQLITE_STORAGE:path.join(run,'warehouse.sqlite'),PORT_LOCAL:'3030',VITE_API_BASE_URL:'http://localhost:3030',FILM_RAW_DIR:raw};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function ready(url){for(let i=0;i<120;i++){try{if((await fetch(url)).ok)return;}catch{}await pause(500);}throw Error('Server not ready: '+url);}
const chrome=process.env.CHROME_PATH || (process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined);
const browser=await chromium.launch({headless:true,...(chrome?{executablePath:chrome}:{}),args:['--disable-background-timer-throttling','--disable-renderer-backgrounding']});
try {
 for(const [name,mode,id] of [['latest','latest','main-demo']]){
  const stageEnv={...env,SQLITE_STORAGE:path.join(run,name+'.sqlite')};
  const backend=spawn('node',['index.js'],{cwd:path.join(repo,'backend'),env:stageEnv,stdio:'inherit'});
  await ready('http://localhost:3030');
  try{await access(path.join(stage,'node_modules'));}catch{await symlink(path.join(repo,'node_modules'),path.join(stage,'node_modules'),'dir');}
  const server=spawn(process.execPath,[path.join(repo,'node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port','5297','--strictPort'],{cwd:stage,env,stdio:'inherit'});
  try {
   await ready('http://127.0.0.1:5297');
   const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
   const errors=[];page.on('pageerror',e=>errors.push(String(e)));
   await page.goto('http://127.0.0.1:5297/?film='+mode);
   await page.waitForFunction(id=>document.title==='SAVED '+id,id,{timeout:240000});
   await writeFile(path.join(raw,id+'-browser-errors.json'),JSON.stringify(errors,null,2));
   const info=JSON.parse(await readFile(path.join(raw,id+'.json'),'utf8'));
   if(info.width!==1920||info.height!==1080||info.frames<info.duration*10)throw Error('Capture failed validation: '+id);
   if(id==='main-demo'){
    const initial=JSON.parse(await readFile(path.join(raw,'main-demo-initial.json'),'utf8'));
    const audit=JSON.parse(await readFile(path.join(raw,'main-demo-complete.json'),'utf8'));
    if(initial.initialIds.length || audit.created.length!==1 || audit.violations.length || audit.results.length!==2 || audit.results.some(r=>r.status!=='done'))throw Error('Single-box crane mission validation failed');
    if(audit.samples.some(s=>s.boxes.length>1 || s.boxes.some(b=>b.position && b.position[1]<1.4)))throw Error('Extra box or fallen box detected');
   }
   await page.close();
  } finally {server.kill('SIGTERM');backend.kill('SIGTERM');await pause(1000);}
 }
}finally{await browser.close();}
await command('python3',[path.join(templates,'encode.py'),'--ffmpeg',process.env.FFMPEG||ffmpeg,'--raw',raw,'--output',path.join(root,'warehouse-latest-demo.mp4')],root);
console.log('Finished warehouse-latest-demo.mp4');
