const $=s=>document.querySelector(s),sleep=ms=>new Promise(r=>setTimeout(r,ms)),assert=(v,m)=>{if(!v)throw Error(m);};
const hash=async b=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(n=>n.toString(16).padStart(2,'0')).join('');
const files=['app.js','deck-tempo.js','beatgrid.js','smart-sync.js','engine.js','panels.js','paused-tempo-harness.js'];
const identities=async()=>Object.fromEntries(await Promise.all(files.map(async f=>[f,await hash(await(await fetch(f)).arrayBuffer())])));
async function until(f,label){const end=performance.now()+10000;while(!f()){assert(performance.now()<end,label+' timed out');await sleep(10);}}
const button=(n,a)=>`[data-deck="${n}"][data-action="${a}"]`,click=s=>{assert($(s),'Missing '+s);$(s).click();},value=(s,v)=>{assert($(s),'Missing '+s);$(s).value=String(v);};
let app;
async function run(){
 $('#paused-run').disabled=true;const {state,engine}=app,report={startedAt:new Date().toISOString(),completed:false,scope:'Actual grid/Setup/Sync/tempo/redraw controls and paused UI/FX BPM state only. No playback, audio recording, effect-tail or native/hardware/reference acceptance.',checks:[],errors:[],states:[]};
 const snapshot=name=>report.states.push({name,decks:state.decks.slice(0,2).map(d=>({position:engine.position(d),rate:d.rate,status:d.syncState,playing:d.playing,shownBPM:$(`#platter-${d.index} strong`).textContent,fxBPM:engine.nodes[d.index].channelBpm})),voices:engine.voices.size,recording:!!engine.recording});
 try{
  report.sourceBefore=await identities();await engine.resume();engine.audioMonitor.mutePhysical(true);await until(()=>!state.analysis,'Initial analysis');
  for(let n=0;n<2;n++){
   click(button(n,'grid'));value('#grid-bpm',120);value('#grid-offset',0);value('#grid-warp-time',1);value('#grid-warp-bpm',150);click('#grid-marker');click('#grid-save');await until(()=>!$('#modal').open,'Grid saved');
   for(let k=0;k<2;k++)$(`[data-seek="${n}"]`).dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true}));
   await until(()=>engine.position(state.decks[n])===2,'Paused needle position');
  }
  click('[data-panel="settings"]');value('[data-setting="Sync Mode"]','Smart Sync');$('[data-setting="Sync Mode"]').dispatchEvent(new Event('change',{bubbles:true}));click('#save-settings');
  click(button(0,'sync'));await until(()=>state.decks[0].syncState==='armed','Primary armed');
  click(button(1,'sync'));await until(()=>state.decks[1].syncState==='armed','Secondary armed');
  await until(()=>state.decks.slice(0,2).every(d=>$(`#platter-${d.index} strong`).textContent==='150.0'&&engine.nodes[d.index].channelBpm===150),'Source-selected150BPM planned group');snapshot('source-selected150BPM');
  report.checks.push('First paused primary after a warp selects150BPM; both armed UI and FX targets use that group target');
  value('[data-tempo="0"]',4);$('[data-tempo="0"]').dispatchEvent(new Event('input',{bubbles:true}));
  await until(()=>state.decks.slice(0,2).every(d=>d.rate===1.04&&$(`#platter-${d.index} strong`).textContent==='124.8'&&Math.abs(engine.nodes[d.index].channelBpm-124.8)<1e-8),'Paused124.8BPM after slider');snapshot('paused124.8BPM');report.checks.push('Tempo input keeps both warped paused headers and FX targets124.8 instead of156');
  click('[data-action="tab"][data-deck="1"][data-tab="Loops"]');await until(()=>state.decks[1].tab==='Loops'&&$('#platter-1 strong').textContent==='124.8','Redrawn124.8BPM');snapshot('after-redraw');
  assert(state.decks.every(d=>!d.playing&&!d.processing)&&engine.voices.size===0&&!engine.recording,'Display workflow started playback/processing');report.checks.push('Full deck redraw retains target; no playback voice or recording started');
 }catch(error){report.errors.push({message:error.message,stack:error.stack});}
 finally{report.sourceAfter=await identities();report.sourceStable=JSON.stringify(report.sourceBefore)===JSON.stringify(report.sourceAfter);report.completed=report.checks.length===3&&!report.errors.length&&report.sourceStable;report.finishedAt=new Date().toISOString();$('#paused-original').textContent=JSON.stringify(report,null,2);$('#paused-status').textContent=report.completed?'Scoped paused tempo UI/FX-state workflow passed; audio not played':'Failed: '+report.errors.map(e=>e.message).join('; ');}
}
$('#paused-run').onclick=()=>run();
async function boot(){const source=new DOMParser().parseFromString(await(await fetch('index.html')).text(),'text/html');for(const n of [...source.body.children])if(n.tagName!=='SCRIPT')document.body.append(n);await import('./app.js');await until(()=>window.openPlay?.state.decks[1].track,'Actual app');app=window.openPlay;$('#paused-run').disabled=false;$('#paused-run').textContent='Run paused tempo state workflow';}
boot().catch(error=>$('#paused-status').textContent=error.message);
