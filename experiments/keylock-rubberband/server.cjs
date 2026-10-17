// Experimental same-origin offline DSP endpoint; no filesystem paths from requests.
'use strict';
const {spawn}=require('node:child_process');
const {createAssetServer}=require('../../desktop/server.cjs');
function installOfflineR3(server,{origin,executable}){
 const existing=server.listeners('request');server.removeAllListeners('request');let active=null,closing=false;const queue=[];
 function startNext(){
  if(active||closing)return;
  let job;while(queue.length){const next=queue.shift();if(!next.cancelled&&!next.req.aborted&&!next.res.destroyed){job=next;break;}}
  if(!job)return;
  const {req,res,length,reject}=job,child=spawn(executable,[],{stdio:['pipe','pipe','pipe']});job.child=child;active=job;let total=0,errors='',responseBytes=0;
  const timer=setTimeout(()=>child.kill('SIGTERM'),120000);timer.unref();
  child.stdin.on('error',()=>{});child.stderr.on('data',b=>{if(errors.length<4096)errors+=b.toString().slice(0,4096-errors.length);});
  req.on('data',b=>{total+=b.length;if(total>length){req.destroy();child.kill('SIGTERM');}});
  child.stdout.on('data',b=>{responseBytes+=b.length;if(responseBytes>320000032){child.kill('SIGTERM');res.destroy();}});
  child.on('error',()=>{if(!res.headersSent)reject(503,'Local R3 worker is unavailable.');else res.destroy();});
  // Complete HTTP only after the worker exits0; failed prefixes are never cached.
  child.stdout.pipe(res,{end:false});req.pipe(child.stdin);
  child.on('close',code=>{
   clearTimeout(timer);job.finished=true;if(active===job)active=null;
   if(!res.destroyed){if(code===0&&total===length)res.end();else if(!res.headersSent)reject(422,'R3 preparation failed: '+errors.slice(-800));else res.destroy();}
   startNext();
  });
 }
 function cancel(job){
  if(job.finished||job.cancelled)return;job.cancelled=true;
  if(job.child)job.child.kill('SIGTERM');else{const index=queue.indexOf(job);if(index>=0)queue.splice(index,1);}
 }
 server.on('request',(req,res)=>{
  let url;try{url=new URL(req.url,origin);}catch{res.writeHead(400);return res.end();}
  if(url.pathname!=='/api/keylock-r3'){for(const handler of existing)handler(req,res);return;}
  const reject=(status,text)=>{res.writeHead(status,{'Content-Type':'text/plain','Cache-Control':'no-store'});res.end(text);};
  if(req.headers.host!==new URL(origin).host||req.headers.origin!==origin||req.headers['x-open-play']!=='offline-r3'||req.method!=='POST')return reject(403,'Local app request required.');
  const length=Number(req.headers['content-length']);if(!Number.isSafeInteger(length)||length<44||length>320000040)return reject(413,'Offline cache request exceeds this local worker budget.');
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/octet-stream');
  // Leave waiting uploads paused/backpressured instead of buffering another PCM
  // body or failing a second deck just because the sole native worker is busy.
  req.pause();const job={req,res,length,reject,child:null,cancelled:false,finished:false};
  req.on('aborted',()=>cancel(job));res.on('close',()=>{if(!res.writableEnded)cancel(job);});queue.push(job);startNext();
 });
 const close=server.close.bind(server);server.close=(...args)=>{closing=true;for(const job of [...queue]){cancel(job);job.req.destroy();job.res.destroy();}if(active){cancel(active);active.req.destroy();active.res.destroy();}return close(...args);};
 return {get activePID(){return active?.child?.pid??null;},get pendingCount(){return queue.length;}};
}
async function createR3Server(options){const host=await createAssetServer(options);host.worker=installOfflineR3(host.server,{origin:host.origin,executable:options.executable});return host;}
module.exports={createR3Server,installOfflineR3};
