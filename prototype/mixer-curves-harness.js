const $=s=>document.querySelector(s),sleep=ms=>new Promise(r=>setTimeout(r,ms)),assert=(v,m)=>{if(!v)throw Error(m);};
const hash=async b=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(v=>v.toString(16).padStart(2,'0')).join('');
const files=['app.js','engine.js','mixer-curves.js','fixtures.js','panels.js','deck-midi.js','mixer-curves-harness.js'];
const identities=async()=>Object.fromEntries(await Promise.all(files.map(async f=>[f,await hash(await(await fetch(f,{cache:'no-store'})).arrayBuffer())])));
const click=s=>{assert($(s),'Missing '+s);$(s).click();},change=(s,v)=>{const e=$(s);assert(e,'Missing '+s);if(e.type==='checkbox')e.checked=v;else e.value=String(v);e.dispatchEvent(new Event('change',{bubbles:true}));},input=(s,v)=>{const e=$(s);assert(e,'Missing '+s);e.value=String(v);e.dispatchEvent(new Event('input',{bubbles:true}));};
async function until(fn,label){const end=performance.now()+20000;while(!fn()){assert(performance.now()<end,label+' timed out');await sleep(10);}}
function base64(bytes){let s='';for(let n=0;n<bytes.length;n+=16384)s+=String.fromCharCode(...bytes.subarray(n,n+16384));return btoa(s);}
function amplitude(a,sr,from,to,hz){let re=0,im=0;const start=Math.ceil(from*sr),end=Math.floor(to*sr);assert(start>=0&&end<=a.length&&end>start,'Invalid fixed audio window');for(let n=start;n<end;n++){re+=a[n]*Math.cos(2*Math.PI*hz*n/sr);im+=a[n]*Math.sin(2*Math.PI*hz*n/sr);}return 2*Math.hypot(re,im)/(end-start);}
let app;
function output(r){$('#mix-original').textContent=JSON.stringify(r,null,2);$('#mix-results').textContent=JSON.stringify({...r,recording:r.recording?{...r.recording,base64:'Retained in complete original'}:null},null,2);$('#mix-status').textContent=r.completed?'Scoped mixer audio and reload checks passed':r.errors.length?'Failed: '+r.errors.map(e=>e.message).join('; '):'Recorded mixer audio; ready for reload';}
async function run(){
 const {state,engine}=app,r={startedAt:new Date().toISOString(),completed:false,scope:'Actual four-deck Setup/mixer/MIDI-editor controls and full reload with owned stationary tones; independent curve behavior, not exact vendor DSP/native/hardware acceptance.',criteria:{fixedSettlingSeconds:.25,fixedWindowSeconds:.3,maximumAbsoluteGainError:.04,minimumBaselineAmplitude:.005},cases:[],errors:[]};$('#mix-run').disabled=true;
 try{
  r.sourceBefore=await identities();await engine.resume();engine.audioMonitor.mutePhysical(true);await until(()=>engine.audioMonitor.snapshot().physicalMuted,'Physical graph mute');await until(()=>!state.analysis,'Initial analysis');
  for(const d of state.decks)engine.pause(d);for(const bank of state.fx)for(const slot of bank)slot.on=false;engine.configureFX(state.fx,state.fxRoutes||[],state.decks.map(()=>120),state.fxTempo);
  const sr=48000,duration=30,template=structuredClone(state.decks[0].track);r.frequencies=[220,440,660,880];
  for(let i=0;i<4;i++){const d=state.decks[i],b=engine.ctx.createBuffer(2,sr*duration,sr);for(let c=0;c<2;c++){const a=b.getChannelData(c);for(let n=0;n<a.length;n++)a[n]=.025*Math.sin(2*Math.PI*r.frequencies[i]*n/sr);}d.track={...structuredClone(template),id:'mixer-owned-'+i,title:'Owned mixer tone '+r.frequencies[i]+' Hz',bpm:120,grid:0,gridWarpMarkers:[],gridMarkers:[],duration,analyzed:true};Object.assign(d,{rate:1,position:0,keylock:false,keyShift:0,reverse:false,loop:true,loopIn:0,loopOut:duration,slip:false,stemSlip:'off',sync:false,level:1,trim:1,low:0,mid:0,high:0,filter:0});engine.buffers.set(d.track.id,b);engine.mix(i,'level',1);engine.mix(i,'trim',1);}
  change('#deck-count',4);
  click('[data-panel="settings"]');click('[data-settings-tab="Mixer"]');click('#reset-settings');change('[data-setting="Crossfader Disable"]',true);click('#save-settings');
  for(let i=0;i<4;i++)click(`[data-deck="${i}"][data-action="play"]`);await until(()=>state.decks.every(d=>d.playing),'Four actual Play controls');
  await engine.recordStart();r.recordStart=engine.recordStarted;
  async function sample(name,expected,action){await action();const at=engine.ctx.currentTime-engine.recordStarted,c={name,expected,at,from:at+.25,to:at+.55,mixer:structuredClone(engine.mixerSettings),cross:engine.cross,levels:state.decks.map(d=>d.level)};r.cases.push(c);await until(()=>engine.ctx.currentTime>=engine.recordStarted+c.to+.04,name);}
  const setting=(name,v)=>change(`[data-setting="${name}"]`,v),setup=()=>{click('[data-panel="settings"]');click('[data-settings-tab="Mixer"]');};
  await sample('baseline all channels bypass',[1,1,1,1],async()=>{});
  setup();
  await sample('linear slow center',[.5,.5,.5,.5],async()=>{setting('Crossfader Disable',false);setting('Crossfader Curve Amount',0);});
  await sample('linear slow quarter A',[.75,.25,.75,.25],async()=>input('#crossfader',-.5));
  await sample('power slow center',[.25,.25,.25,.25],async()=>{setting('Crossfader Curve','Power');input('#crossfader',0);});
  await sample('power fast center',[Math.SQRT1_2,Math.SQRT1_2,Math.SQRT1_2,Math.SQRT1_2],async()=>setting('Crossfader Curve Amount',100));
  await sample('linear fast center',[1,1,1,1],async()=>setting('Crossfader Curve','Linear'));
  await sample('reversed endpoint',[0,1,0,1],async()=>{setting('Crossfader Reverse',true);input('#crossfader',-1);});
  setting('Crossfader Reverse',false);click('#save-settings');
  await sample('per-deck B A Thru B at left',[0,1,1,0],async()=>{for(const [i,v]of ['B','A','Thru','B'].entries())change(`[data-cross-assign="${i}"]`,v);});
  setup();await sample('disable overrides assignment',[1,1,1,1],async()=>setting('Crossfader Disable',true));
  await sample('slow upfader half',[.0625,.0625,.0625,.0625],async()=>{setting('Upfader Curve',0);for(let i=0;i<4;i++)input(`[data-mix="${i}:level"]`,.5);});
  await sample('fast upfader half',Array(4).fill(2**(-.25)),async()=>setting('Upfader Curve',100));
  await sample('reset restores prior default gain',[.5,.5,.5,.5],async()=>{click('#reset-settings');input('#crossfader',0);});click('#save-settings');
  for(let i=0;i<4;i++)input(`[data-mix="${i}:level"]`,1);
  click('[data-panel="midi"]');click('#midi-reset');for(const [id,v]of [['#midi-target','Crossfader'],['#midi-type','CC'],['#midi-channel',3],['#midi-number',20],['#midi-encoding','7-bit absolute']]){const e=$(id);e.value=String(v);}click('#midi-add');for(const [id,v]of [['#midi-type','CC'],['#midi-channel',3],['#midi-number',20],['#midi-test-value',127]])$(id).value=String(v);
  await sample('synthetic MIDI crossfader endpoint',[0,1,0,1],async()=>click('#midi-send'));click('#modal-close');
  setup();for(const [k,v]of [['Crossfader Curve','Power'],['Crossfader Curve Amount',37],['Crossfader Reverse',true],['Upfader Curve',62],['Deck 2 Crossfader Assign','Thru'],['Deck 3 Crossfader Assign','B'],['Deck 4 Crossfader Assign','Thru']])setting(k,v);click('#save-settings');r.savedMixer=structuredClone(engine.mixerSettings);
 }catch(e){r.errors.push({message:e.message,stack:e.stack});}
 finally{
  for(const d of state.decks)engine.pause(d);
  if(engine.recording){const blob=await engine.recordStop(),bytes=new Uint8Array(await blob.arrayBuffer());r.recording={bytes:bytes.length,format:blob.type,sha256:await hash(bytes),base64:base64(bytes)};try{const b=await engine.ctx.decodeAudioData(bytes.buffer.slice(0));r.decoded={duration:b.duration,frames:b.length,sampleRate:b.sampleRate,channels:b.numberOfChannels};assert(b.numberOfChannels===2,'Expected stereo master');for(let c=0;c<2;c++)for(const v of b.getChannelData(c))assert(Number.isFinite(v),'Nonfinite whole recording');for(const test of r.cases)test.amplitudes=r.frequencies.map(hz=>[0,1].map(c=>amplitude(b.getChannelData(c),b.sampleRate,test.from,test.to,hz)));assert(r.cases[0].amplitudes.flat().every(v=>v>.005),'Baseline too quiet');for(const test of r.cases){test.ratios=test.amplitudes.map((channels,i)=>channels.map((v,c)=>v/r.cases[0].amplitudes[i][c]));test.maxError=Math.max(...test.ratios.flatMap((channels,i)=>channels.map(v=>Math.abs(v-test.expected[i]))));test.passed=test.maxError<=.04;}assert(r.cases.length===13&&r.cases.every(c=>c.passed),'Expected 13 passing declared mixer windows');r.audioPassed=true;}catch(e){r.errors.push({message:e.message,stack:e.stack});}}
  r.sourceAfter=await identities();r.sourceStable=JSON.stringify(r.sourceBefore)===JSON.stringify(r.sourceAfter);assert(r.sourceStable,'Source changed during workflow');r.recordedAt=new Date().toISOString();output(r);sessionStorage.setItem('mixer-curves-report',JSON.stringify(r));$('#mix-reload').hidden=false;
 }
}
$('#mix-run').onclick=run;$('#mix-reload').onclick=()=>{sessionStorage.setItem('mixer-curves-reload','yes');location.reload();};
async function boot(){const parsed=new DOMParser().parseFromString(await(await fetch('index.html')).text(),'text/html');for(const n of [...parsed.body.children])if(n.tagName!=='SCRIPT')document.body.append(n);await import('./app.js');await until(()=>window.openPlay?.state.decks[0].track,'Actual app');app=window.openPlay;
 if(sessionStorage.getItem('mixer-curves-reload')==='yes'){sessionStorage.removeItem('mixer-curves-reload');const r=JSON.parse(sessionStorage.getItem('mixer-curves-report'));r.sourceReload=await identities();r.reload={mixer:structuredClone(app.engine.mixerSettings),stopped:app.state.decks.every(d=>!d.playing),preferencesMatch:JSON.stringify(app.engine.mixerSettings)===JSON.stringify(r.savedMixer)};r.completed=r.audioPassed&&r.sourceStable&&JSON.stringify(r.sourceReload)===JSON.stringify(r.sourceBefore)&&r.reload.preferencesMatch&&r.reload.stopped&&!r.errors.length;r.finishedAt=new Date().toISOString();output(r);click('[data-panel="settings"]');click('[data-settings-tab="Mixer"]');}
 else{$('#mix-run').disabled=false;$('#mix-status').textContent='Ready for one recorded mixer workflow';}}
boot().catch(e=>$('#mix-status').textContent=e.message);
