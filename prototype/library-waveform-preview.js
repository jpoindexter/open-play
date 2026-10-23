// HTML review only. Render source-audio thumbnails without touching deck state.
import {paintSourceOverview,sourceWaveformState} from './source-waveform.js';

const width=320,height=44,cacheName='openplay-library-waveforms-rgb-v1';
const preference='openplay-preview-waveform-column';

export function installLibraryWaveforms({state,engine}){
  const root=document.querySelector('#tracks'),modal=document.querySelector('#modal-body');
  const records=new Map(),observed=new WeakSet();
  let enabled=true,busy=false,scheduled=false,decoder;
  try{enabled=localStorage.getItem(preference)!=='hidden';}catch{}
  const active=()=>enabled&&['rekordbox','serato-hybrid','traktor-flat'].includes(document.body.dataset.workspace)&&!document.hidden;
  const keyFor=track=>track.contentHash||`${track.id}:${track.seed}:${track.bpm}:${track.freq}`;
  const requestFor=key=>new Request(new URL('/__openplay-waveform-cache/'+encodeURIComponent(key),location.origin));
  const cache=globalThis.caches?.open(cacheName).catch(()=>null)||Promise.resolve(null);
  const status=(cell,phase,text)=>{
    cell.dataset.previewState=phase;cell.setAttribute('aria-busy',String(phase==='loading'));
    cell.replaceChildren();const label=document.createElement('span');label.textContent=text;cell.append(label);
  };
  function paintCell(cell,track,record){
    if(cell.dataset.previewState===(record?.phase||'waiting')&&cell.dataset.previewKey===keyFor(track)){
      const image=cell.querySelector('img'),alt=`Full-track waveform: ${track.title}`;
      if(image&&image.alt!==alt)image.alt=alt;
      const retry=cell.querySelector('button'),label=`Retry waveform preview for ${track.title}`;
      if(retry&&retry.getAttribute('aria-label')!==label)retry.setAttribute('aria-label',label);
      return;
    }
    cell.dataset.previewKey=keyFor(track);
    if(record?.phase==='ready'){
      const image=document.createElement('img');image.src=record.src;
      image.alt=`Full-track waveform: ${track.title}`;image.width=width;image.height=height;
      image.title='Decoded source audio · red bass / green midrange / blue treble';
      cell.dataset.previewSource=record.source;
      cell.dataset.previewState='ready';cell.setAttribute('aria-busy','false');cell.replaceChildren(image);
    }else if(record?.phase==='error'){
      status(cell,'error','Preview unavailable');cell.title=record.error;
      const retry=document.createElement('button');retry.textContent='Retry';retry.type='button';
      retry.setAttribute('aria-label',`Retry waveform preview for ${track.title}`);
      retry.onclick=event=>{event.stopPropagation();records.delete(keyFor(track));refresh();};cell.append(retry);
    }else status(cell,record?.phase||'waiting',record?.phase==='loading'?'Preparing waveform…':'Waiting for preview');
  }
  function rows(){return [...root.querySelectorAll('tbody tr[data-track]')];}
  function onScreen(row){
    const r=row.getBoundingClientRect(),p=root.getBoundingClientRect();
    return r.width>0&&r.bottom>p.top&&r.top<p.bottom;
  }
  function refresh(){
    scheduled=false;
    if(document.body.dataset.libraryWaveforms!==String(enabled))document.body.dataset.libraryWaveforms=String(enabled);
    const table=root.querySelector('table');if(!table)return;
    const head=table.querySelector('thead tr');
    if(!head.querySelector('.library-wave-preview')){
      const th=document.createElement('th');th.className='library-wave-preview';th.scope='col';th.textContent='Preview';head.children[0].after(th);
    }
    for(const row of rows()){
      const track=state.tracks.find(t=>t.id===row.dataset.track);if(!track)continue;
      let cell=row.querySelector('.library-wave-preview');
      if(!cell){cell=document.createElement('td');cell.className='library-wave-preview';row.children[0].after(cell);}
      paintCell(cell,track,records.get(keyFor(track)));
      if(!observed.has(cell)){observed.add(cell);visibility.observe(cell);}
    }
    void pump();
  }
  function schedule(){if(!scheduled){scheduled=true;queueMicrotask(refresh);}}
  async function thumbnail(track){
    const key=keyFor(track),disk=await cache;
    try{const hit=await disk?.match(requestFor(key));if(hit)return {src:URL.createObjectURL(await hit.blob()),source:'local-cache'};}catch{}
    let buffer=engine.buffers.get(track.id);
    if(!buffer){
      if(track.missing)throw Error('Audio file is missing. Re-import the original file.');
      if(track.demo)buffer=await engine.buffer(track);
      else{
        const file=track.file||await track.readFile?.();
        if(!file)throw Error('Audio unavailable. Re-import the original file.');
        // A decode-only context cannot connect to speakers or change playback.
        decoder??=new OfflineAudioContext(1,1,44100);
        buffer=await decoder.decodeAudioData(await file.arrayBuffer());
      }
    }
    await sourceWaveformState(buffer).ready;
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
    const context=canvas.getContext('2d');context.fillStyle='#050505';context.fillRect(0,0,width,height);
    paintSourceOverview(context,buffer,{width,height});
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
    if(!blob)throw Error('Cannot create waveform preview.');
    try{if(disk){await disk.put(requestFor(key),new Response(blob));const keys=await disk.keys();for(const old of keys.slice(0,Math.max(0,keys.length-512)))await disk.delete(old);}}catch{} // Storage failure leaves a usable session preview.
    return {src:URL.createObjectURL(blob),source:track.demo?'decoded-demo':'decoded-local-audio'};
  }
  async function pump(){
    if(busy||!active())return;busy=true;
    try{
      while(active()){
        const row=rows().find(row=>{const t=state.tracks.find(t=>t.id===row.dataset.track);return t&&onScreen(row)&&!records.has(keyFor(t));});
        if(!row)break;
        const track=state.tracks.find(t=>t.id===row.dataset.track),key=keyFor(track);
        records.set(key,{phase:'loading'});refresh();
        try{records.set(key,{phase:'ready',...await thumbnail(track)});}
        catch(error){records.set(key,{phase:'error',error:error.message||'Cannot decode this audio file.'});}
        // A sort/filter may have replaced the row during decoding. Refresh by
        // track identity, never by the original row index or DOM reference.
        refresh();
        while(records.size>256){const first=records.keys().next().value,value=records.get(first);if(value.phase==='loading')break;URL.revokeObjectURL(value.src||'');records.delete(first);}
      }
    }finally{busy=false;}
  }
  const visibility=new IntersectionObserver(()=>void pump(),{root});
  const tree=new MutationObserver(schedule);tree.observe(root,{childList:true,subtree:true});
  const workspace=new MutationObserver(schedule);workspace.observe(document.body,{attributes:true,attributeFilter:['data-workspace']});
  const dialogs=new MutationObserver(()=>{
    if(!['rekordbox','serato-hybrid','traktor-flat'].includes(document.body.dataset.workspace)||document.querySelector('#modal-title').textContent!=='Library columns'||modal.querySelector('[data-preview-column]'))return;
    const settings=modal.querySelector('.settings-grid');if(!settings)return;
    const label=document.createElement('label');label.className='setting';label.textContent='Preview waveform';
    const input=document.createElement('input');input.type='checkbox';input.dataset.previewColumn='';input.checked=enabled;
    input.onchange=()=>{enabled=input.checked;try{localStorage.setItem(preference,enabled?'shown':'hidden');}catch{}refresh();};label.append(input);settings.prepend(label);
  });dialogs.observe(modal,{childList:true,subtree:true});
  document.addEventListener('visibilitychange',schedule);root.addEventListener('scroll',()=>void pump(),{passive:true});
  window.addEventListener('beforeunload',()=>{visibility.disconnect();tree.disconnect();workspace.disconnect();dialogs.disconnect();for(const value of records.values())if(value.src)URL.revokeObjectURL(value.src);},{once:true});
  refresh();
}
