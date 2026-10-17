// Optional public evidence pane. No hidden-state automation or media capture.
// This module observes only explicit scalar input/owner fields; absent query flag
// it installs no listeners and creates no UI.
export function createScratchInputDebug({documentTarget=document,windowTarget=window,maxEvents=1024}={}){
 if(!new URL(windowTarget.location.href).searchParams.has('scratch-input-debug'))return null;
 const events=[];let omitted=0,url=null,sequence=0;
 const pane=documentTarget.createElement('details');pane.open=true;pane.setAttribute('aria-label','Scratch input trace');pane.style.cssText='position:fixed;right:12px;bottom:12px;width:430px;max-width:90vw;z-index:10000;background:#191c20;color:#eee;border:1px solid #888;padding:8px;font:11px/1.3 monospace;';
 const summary=documentTarget.createElement('summary');summary.textContent='Scratch input diagnostic (opt-in)';const status=documentTarget.createElement('p');const pre=documentTarget.createElement('pre');pre.style.cssText='max-height:160px;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere;margin:4px 0;';pre.id='scratch-input-trace';
 const download=documentTarget.createElement('a');download.textContent='Download trace JSON';download.download='open-play-scratch-input-trace.json';download.style.color='#9bcbff';download.href='#';download.onclick=()=>{if(url)URL.revokeObjectURL(url);url=URL.createObjectURL(new Blob([JSON.stringify({scope:'Optional actual browser input/controller scalar event observations; omitted count explicit. No full-parity or audio acceptance.',events,omitted},null,2)],{type:'application/json'}));download.href=url;};pane.append(summary,status,pre,download);documentTarget.body.append(pane);
 function record(source,data){
  const copy={sequence:++sequence,source,observedAt:performance.now()};
  for(const [key,value]of Object.entries(data||{})){if(typeof value==='string')copy[key]=value.slice(0,160);else if(typeof value==='boolean'||value===null)copy[key]=value;else if(typeof value==='number')copy[key]=Number.isFinite(value)?value:null;}
  if(events.length<maxEvents)events.push(copy);else omitted++;
  status.textContent=`${events.length} retained events; ${omitted} omitted after explicit cap. No source audio or input text.`;
  pre.textContent=JSON.stringify(events.slice(-8),null,1);
 }
 const types=['pointerdown','pointermove','pointerup','pointercancel','mousedown','mousemove','mouseup','dragstart','dragend'];
 const observed=event=>{if((event.type==='pointermove'||event.type==='mousemove')&&!event.buttons)return;record('document-capture',{type:event.type,pointerId:event.pointerId??null,pointerType:event.pointerType??null,button:event.button??null,buttons:event.buttons??null,clientX:event.clientX??null,clientY:event.clientY??null,targetTag:event.target?.tagName||'',targetId:event.target?.id||'',platterId:event.target?.closest?.('[data-deck-scratch]')?.id||'',defaultPrevented:!!event.defaultPrevented,isTrusted:!!event.isTrusted});};
 for(const type of types)documentTarget.addEventListener(type,observed,{capture:true,passive:true});
 const dispose=()=>{for(const type of types)documentTarget.removeEventListener(type,observed,true);if(url)URL.revokeObjectURL(url);pane.remove();};
 windowTarget.addEventListener('beforeunload',dispose,{once:true});return{onEvent:data=>record('controller',data),dispose};
}
