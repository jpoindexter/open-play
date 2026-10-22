import {sessionKey} from './session-storage.js';
const frame=document.querySelector('#app'),output=document.querySelector('#result');
const results=[];
const assert=(ok,message)=>{if(!ok)throw Error(message);};
const record=message=>{results.push(message);output.textContent=JSON.stringify({passed:results.length,checks:results},null,2);};
const wait=async(check,label)=>{for(let i=0;i<400;i++){if(check())return;await new Promise(r=>setTimeout(r,50));}throw Error(`Timed out: ${label}`);};
async function boot(){frame.src=`workspace-preview.html?safety=${Date.now()}`;await new Promise(resolve=>frame.onload=resolve);await wait(()=>frame.contentWindow.openPlay&&!frame.contentWindow.openPlay.state.analysis,'workspace ready');await new Promise(r=>setTimeout(r,300));}
const doc=()=>frame.contentDocument,state=()=>frame.contentWindow.openPlay.state;
const click=selector=>{const el=doc().querySelector(selector);assert(el,selector);el.click();};
async function restore(data){
 click('#library-tools');const input=doc().querySelector('#restore-library'),w=frame.contentWindow,files=new w.DataTransfer();
 files.items.add(new w.File([JSON.stringify(data)],'library.json',{type:'application/json'}));input.files=files.files;
 await input.onchange({target:input});return doc().querySelector('#library-tool-result').textContent;
}
const metadata=()=>JSON.stringify({crates:state().crates,settings:state().settings,tags:state().tracks.map(t=>({id:t.id,title:t.title,cues:t.cues,savedLoops:t.savedLoops,color:t.color}))});
document.querySelector('#run').onclick=async()=>{
 try{
  assert(location.port==='8872','Use dedicated port8872, never the live app origin.');
  assert(localStorage.getItem('openplay-safety-owned')==='true'||localStorage.length===0,'Origin has existing data; refusing to overwrite it.');
  localStorage.setItem('openplay-safety-owned','true');localStorage.setItem(sessionKey,JSON.stringify({settings:{'Analyze Stems':false}}));
  await boot();const before=metadata(),stored=localStorage.getItem(sessionKey);
  for(const change of [{cues:null},{color:'" data-injected="yes'},{savedLoops:[{start:4,end:2}]},{gridWarpMarkers:[{time:3,bpm:0}]}]){
   const message=await restore({format:'open-play-prototype-1',crates:[],settings:{},tags:[{id:'demo-0',...change}]});
   assert(/Invalid/.test(message),'Validation message');assert(metadata()===before,'Invalid restore changed metadata');assert(localStorage.getItem(sessionKey)===stored,'Invalid restore changed saved data');click('#modal-close');
  }record('Actual restore rejects four malformed payloads without mutation or persistence');
  const valid={format:'open-play-prototype-1',crates:[{id:'audit',name:'Safety session',tracks:['demo-0']}],settings:{'Quantize Value':'1/2 Beat'},tags:[{id:'demo-0',title:'Round trip',cues:[{position:2,name:'First'}],savedLoops:[{start:4,end:8,name:'Loop'}],color:'#abcdef'}]};
  assert(/restored and saved/.test(await restore(valid)),'Valid restore saved');click('#modal-close');await boot();
  assert(state().tracks[0].title==='Round trip'&&state().tracks[0].cues[0].position===2&&state().settings['Quantize Value']==='1/2 Beat','Round trip metadata');assert(state().decks.every(d=>!d.playing&&!d.playQueued),'Unexpected restart');record('Valid backup survives actual workspace reload with stopped decks');
  const w=frame.contentWindow,write=w.Storage.prototype.setItem;
  w.Storage.prototype.setItem=function(key,value){if(key===sessionKey)throw new w.DOMException('Controlled full storage','QuotaExceededError');return write.call(this,key,value);};
  valid.tags[0].title='Unsaved edit';assert(/session only/.test(await restore(valid)),'Failed save misreported success');click('#modal-close');
  await new Promise(r=>setTimeout(r,3900));assert(!doc().querySelector('#session-save-status').hidden,'Save warning disappeared');assert(state().tracks[0].title==='Unsaved edit','Edit lost');record('Quota failure preserves edit and warning remains beyond toast timeout');
  const downloads=[];w.HTMLAnchorElement.prototype.click=function(){downloads.push({name:this.download,url:this.href});};
  click('[data-session-backup]');assert(downloads.at(-1)?.name==='open-play-library.json','Backup export not reached');
  w.Storage.prototype.setItem=write;click('[data-session-retry]');assert(doc().querySelector('#session-save-status').hidden,'Retry did not clear failure');
  await boot();assert(state().tracks[0].title==='Unsaved edit','Retried save lost on reload');record('Export control reaches download and retry persists through reload');
  // Finish unloading the healthy child before seeding corruption; unload itself saves.
  frame.src='about:blank';await new Promise(resolve=>frame.onload=resolve);
  const invalid='{"crates":{},"settings":{"Quantize Value":1}}';localStorage.setItem(sessionKey,invalid);
  await boot();assert(!doc().querySelector('#session-save-status').hidden,'Recovery inaccessible');assert(localStorage.getItem(sessionKey)===invalid,'Bad original overwritten');
  assert(doc().querySelector('[data-action="play"]')&&doc().querySelector('[data-mix="0:low"]'),'Core controls lost');
  click('[data-session-recover]');assert(doc().querySelector('#session-save-status').hidden,'Recovery save failed');
  assert(Object.keys(localStorage).some(key=>key.startsWith(sessionKey+'-recovery-')&&localStorage.getItem(key)===invalid),'Original copy missing');
  await boot();assert(doc().querySelector('#session-save-status').hidden&&state().decks.every(d=>!d.playing),'Recovered boot failed or autoplay');record('Malformed boot stays usable; explicit recovery retains original and reloads silently');
  await wait(()=>doc().querySelectorAll('.library-wave-preview[data-preview-state="ready"] img').length===state().tracks.length,'library waveform previews');
  for(const count of ['2','4'])for(const orientation of ['horizontal','vertical']){
   const density=doc().querySelector('#preview-density');density.value='compact';density.dispatchEvent(new w.Event('change',{bubbles:true}));
   const select=doc().querySelector('#deck-count');select.value=count;select.dispatchEvent(new w.Event('change',{bubbles:true}));
   const orient=doc().querySelector('#preview-orientation');orient.value=orientation;orient.dispatchEvent(new w.Event('change',{bubbles:true}));
   await new Promise(r=>setTimeout(r,100));assert(doc().querySelectorAll('[data-action="play"]').length===Number(count),'Missing deck controls');assert(doc().querySelectorAll('[data-mix$=":low"]').length===Number(count),'Missing mixer controls');
  }record('Two/four-deck compact H/V retain play and mixer controls; library previews present');
  output.textContent=JSON.stringify({complete:true,checks:results,limits:'Isolated browser profile; injected quota failure; export handoff intercepted; no listening or hardware proof.'},null,2);
 }catch(error){output.textContent=JSON.stringify({complete:false,checks:results,error:error.message,stack:error.stack},null,2);}
};
