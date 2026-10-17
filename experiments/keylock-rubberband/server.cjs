// Experimental same-origin offline DSP endpoint; no filesystem paths from requests.
'use strict';
const {spawn}=require('node:child_process');
const {createAssetServer}=require('../../desktop/server.cjs');
function installOfflineR3(server,{origin,executable}){
 const existing=server.listeners('request');server.removeAllListeners('request');let active=null;
 server.on('request',(req,res)=>{
  let url;try{url=new URL(req.url,origin);}catch{res.writeHead(400);return res.end();}
  if(url.pathname!=='/api/keylock-r3'){for(const handler of existing)handler(req,res);return;}
  const reject=(status,text)=>{res.writeHead(status,{'Content-Type':'text/plain','Cache-Control':'no-store'});res.end(text);};
  if(req.headers.host!==new URL(origin).host||req.headers.origin!==origin||req.headers['x-open-play']!=='offline-r3'||req.method!=='POST')return reject(403,'Local app request required.');
  const length=Number(req.headers['content-length']);if(!Number.isSafeInteger(length)||length<44||length>320000040)return reject(413,'Offline cache request exceeds this local worker budget.');
  if(active)return reject(503,'Another local DSP job is active. Retry after preparation finishes.');
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/octet-stream');
  const child=spawn(executable,[],{stdio:['pipe','pipe','pipe']});active=child;let total=0,errors='',responseBytes=0,finished=false;
  const stop=()=>{if(!finished)child.kill('SIGTERM');};const timer=setTimeout(stop,120000);timer.unref();
  req.on('data',chunk=>{total+=chunk.length;if(total>length){req.destroy();stop();}});req.on('aborted',stop);res.on('close',()=>{if(!res.writableEnded)stop();});
  child.stdin.on('error',()=>{});child.stderr.on('data',b=>{if(errors.length<4096)errors+=b.toString().slice(0,4096-errors.length);});
  child.stdout.on('data',b=>{responseBytes+=b.length;if(responseBytes>320000032){stop();res.destroy();}});
  child.on('error',()=>{if(!res.headersSent)reject(503,'Local R3 worker is unavailable.');else res.destroy();});
  // Buffering a failed worker's prefix in the renderer is harmless: only an exit0
  // complete response is accepted. End HTTP only after the child exit is known.
  child.stdout.pipe(res,{end:false});req.pipe(child.stdin);
  child.on('close',(code)=>{finished=true;clearTimeout(timer);if(active===child)active=null;
   if(code===0&&total===length){if(!res.headersSent)res.setHeader('Content-Type','application/octet-stream');res.end();}
   else if(!res.headersSent)reject(422,'R3 preparation failed: '+errors.slice(-800));else res.destroy();
  });
 });
 server.once('close',()=>active?.kill('SIGTERM'));
 return {get activePID(){return active?.pid??null;}};
}
async function createR3Server(options){const host=await createAssetServer(options);host.worker=installOfflineR3(host.server,{origin:host.origin,executable:options.executable});return host;}
module.exports={createR3Server,installOfflineR3};
