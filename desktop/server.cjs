'use strict';
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.md':'text/plain; charset=utf-8','.wasm':'application/wasm','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.wav':'audio/wav','.mp3':'audio/mpeg','.mp4':'video/mp4','.webm':'video/webm'};
const cspHash=source=>"'sha256-"+crypto.createHash('sha256').update(source).digest('base64')+"'";
async function createAssetServer({root,port=18768,stemPort=8768}={}){
  root=fs.realpathSync(root);
  const index=fs.readFileSync(path.join(root,'prototype/index.html'),'utf8');
  const inline=[...index.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>cspHash(m[1]));
  let origin;
  const server=http.createServer(async(req,res)=>{
    const respond=(status,message)=>{res.writeHead(status,{'Content-Type':'text/plain; charset=utf-8'});res.end(message);};
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-store');
    res.setHeader('Content-Security-Policy',`default-src 'self'; script-src 'self' blob: 'wasm-unsafe-eval' ${inline.join(' ')}; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; media-src 'self' blob: data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'`);
    if(req.headers.host!==new URL(origin).host||(req.headers.origin&&req.headers.origin!==origin))return respond(403,'Only this local Open Play window may use its server.');
    let decoded;
    try{decoded=decodeURIComponent(new URL(req.url,origin).pathname);}catch{return respond(400,'Invalid path.');}
    if(decoded.startsWith('/api/stems')){
      if(!/^\/api\/stems(?:\/[A-Za-z0-9_.-]+){0,2}$/.test(decoded)||!['GET','POST','DELETE'].includes(req.method))return respond(404,'Not found.');
      if(req.method!=='GET'&&req.headers['x-open-play']!=='local-prototype')return respond(403,'Local request token required.');
      const length=Number(req.headers['content-length']||0);
      if(req.method==='POST'&&(!Number.isSafeInteger(length)||length<44||length>128*1024*1024))return respond(413,'WAV must be44bytes to128MiB.');
      const upstream=http.request({hostname:'127.0.0.1',port:stemPort,path:req.url,method:req.method,headers:{host:`127.0.0.1:${stemPort}`,origin:`http://127.0.0.1:${stemPort}`,'x-open-play':'local-prototype',...(req.method==='POST'?{'content-length':String(length),'content-type':'audio/wav'}:{})}},reply=>{reply.on('error',()=>res.destroy());reply.on('aborted',()=>res.destroy());res.writeHead(reply.statusCode,{'Content-Type':reply.headers['content-type']||'application/json'});reply.pipe(res);});
      upstream.setTimeout(30000,()=>upstream.destroy());upstream.on('error',()=>{if(!res.headersSent){res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Optional local stem service is unavailable. Start the documented local model service; playback and mixing do not require it.'}));}else res.destroy();});
      req.on('aborted',()=>upstream.destroy());res.on('close',()=>{if(!res.writableEnded)upstream.destroy();});
      req.pipe(upstream);return;
    }
    if(!['GET','HEAD'].includes(req.method))return respond(405,'Read-only assets.');
    if(decoded==='/'){res.writeHead(302,{Location:'/prototype/'});return res.end();}
    const relative=decoded.replace(/^\/+/,''),target=path.resolve(root,relative);
    const allowed=relative.startsWith('prototype/')||relative.startsWith('docs/')||relative.startsWith('handoffs/')||['README.md','FULL_BUILD_PLAN.md','PROJECT_PROMPT.md'].includes(relative);
    if(!allowed||!target.startsWith(root+path.sep))return respond(404,'Not found.');
    let file=target;
    try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');file=fs.realpathSync(file);const served=['prototype','docs','handoffs'].some(folder=>file.startsWith(path.join(root,folder)+path.sep))||['README.md','FULL_BUILD_PLAN.md','PROJECT_PROMPT.md'].some(name=>file===path.join(root,name));if(!served)return respond(404,'Not found.');const stat=fs.statSync(file);if(!stat.isFile())return respond(404,'Not found.');
      let start=0,end=stat.size-1,status=200;
      if(req.headers.range){const m=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);if(!m||(!m[1]&&!m[2])){res.setHeader('Content-Range',`bytes */${stat.size}`);return respond(416,'Invalid range.');}
        if(!m[1])start=Math.max(0,stat.size-Number(m[2]));else start=Number(m[1]);
        if(m[1]&&m[2])end=Math.min(end,Number(m[2]));
        if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>end||start>=stat.size){res.setHeader('Content-Range',`bytes */${stat.size}`);return respond(416,'Invalid range.');}status=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${stat.size}`);
      }
      res.writeHead(status,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Content-Length':Math.max(0,end-start+1),'Accept-Ranges':'bytes'});
      if(req.method==='HEAD'||!stat.size)return res.end();
      const stream=fs.createReadStream(file,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
    }catch{respond(404,'Not found.');}
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
  origin=`http://127.0.0.1:${server.address().port}`;
  return{server,origin,close:()=>new Promise(resolve=>server.close(resolve))};
}
module.exports={createAssetServer};
