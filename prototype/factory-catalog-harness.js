const $=s=>document.querySelector(s),sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const assert=(ok,message)=>{if(!ok)throw Error(message);};
async function until(fn,label){const end=performance.now()+60000;while(!fn()){assert(performance.now()<end,label+' timed out');await sleep(20);}}
const click=s=>{assert($(s),'Missing '+s);$(s).click();};
const field=(s,v)=>{$(s).value=String(v);$(s).dispatchEvent(new Event('change',{bubbles:true}));};
const fakeInput={id:'factory-check-input',name:'Synthetic factory input',state:'connected',type:'input',onmidimessage:null};
Object.defineProperty(navigator,'requestMIDIAccess',{configurable:true,value:async()=>({inputs:new Map([[fakeInput.id,fakeInput]]),onstatechange:null})});
const input=(channel,number,value=127,type='Note')=>fakeInput.onmidimessage?.({data:new Uint8Array([(type==='CC'?0xb0:0x90)+channel-1,number,value]),timeStamp:performance.now()});
const factoryId='1f33a04a1c5b924a0b2b1ea12a35216ddebed8d099cd6ed7cb6e5890e03d5ec3';
async function importFiles(files){
 const dt=new DataTransfer();for(const [name,text] of files)dt.items.add(new File([text],name,{type:'application/json'}));
 $('#catalog-file').files=dt.files;$('#catalog-file').dispatchEvent(new Event('change',{bubbles:true}));
 await until(()=>$('#catalog-status').textContent.startsWith('Imported ')||$('#catalog-status').textContent.startsWith('Catalog storage error:'),'Catalog batch');
 return $('#catalog-status').textContent;
}
let app;
async function run(){
 $('#factory-run').disabled=true;const report={startedAt:new Date().toISOString(),scope:'Actual recovered factory catalogs and browser app; synthetic input/audio; no hardware or native acceptance',checks:[],errors:[],phase:sessionStorage.getItem('factory-check-phase')||'import',physicalCompatibilityVerified:false,fullParity:false};
 const {state,engine}=app;
 try{
  await engine.resume();engine.audioMonitor.mutePhysical(true);await until(()=>engine.audioMonitor.snapshot().physicalMuted,'Physical mute');await until(()=>!state.analysis,'Initial analysis');
  click('[data-panel="midi"]');await until(()=>!$('#catalog-status').textContent.startsWith('Reading'),'Catalog ready');
  if(report.phase==='import'){
   assert(state.mappings.length===0,'Use a fresh isolated test origin');
   field('#midi-target','Deck 4 level');field('#midi-type','CC');field('#midi-channel',2);field('#midi-number',32);click('#midi-add');await until(()=>$('#catalog-file'),'Editor redraw');
   const before=JSON.stringify(state.mappings);
   const index=await(await fetch('/api/controller-fixtures')).json(),files=[];let hercules;
   for(const url of index.files){const text=await(await fetch(url)).text();files.push([url.split('/').pop(),text]);const p=JSON.parse(text).profiles.find(p=>p.id===factoryId);if(p)hercules=p;}
   assert(hercules,'Actual Hercules fixture missing');
   const result=await importFiles(files);assert(result.startsWith('Imported 197 profile(s)')&&result.includes('0 file(s) rejected'),result);
   assert(JSON.stringify(state.mappings)===before,'Import changed live assignments');
   field('#catalog-profile',factoryId);assert($('#catalog-profile-detail').textContent.includes('Official Serato')&&$('#catalog-profile-detail').textContent.includes('56 translated assignments'),'Factory content not authenticated');
   assert($('#catalog-apply').disabled,'Unbound profile can be applied');assert($('#catalog-profile').options.length===198,'Missing factory definitions');
   report.checks.push('Actual multi-file UI imported all 197 factory definitions from 16 shards without installing mappings; Hercules source authenticated');
   const forged=structuredClone(hercules);forged.mappings[0].number=(forged.mappings[0].number+1)%128;forged.officialSourceVerified=true;
   const rejected=await importFiles([['forged.json',JSON.stringify({format:'open-play-controller-catalog-v1',profiles:[forged]})]]);
   assert(rejected.includes('1 file(s) rejected')&&rejected.includes('modified or unsupported'),'Modified source claim accepted');
   report.checks.push('Actual import rejected a changed mapping claiming the authentic factory source hash');
   field('#catalog-source-kind','alternative');field('#catalog-source-name','Authored alternative');
   const alt={id:'e'.repeat(64),sourceSHA256:'e'.repeat(64),name:'Authored alternative',controls:[{tag:'condition',children:[{tag:'unknown'}]}],mappings:[],issues:[{reason:'Authored inactive test condition'}],provenance:{kind:'official'},officialSourceVerified:true};
   const mixed=await importFiles([['alternative.json',JSON.stringify({format:'open-play-controller-catalog-v1',profiles:[alt]})],['invalid.json','{}']]);
   assert(mixed.includes('Imported 1 profile(s)')&&mixed.includes('1 file(s) rejected'),'Partial-batch result was hidden');
   field('#catalog-profile',alt.id);assert($('#catalog-profile-detail').textContent.includes('Alternative mapping — Authored alternative'),'Untrusted official flag promoted');
   report.checks.push('Alternative provenance remained separate; partial batch imported valid file and reported rejected file');
   sessionStorage.setItem('factory-check-phase','restored');sessionStorage.setItem('factory-check-import',JSON.stringify(report));report.awaitingReload=true;
  }else{
   await until(()=>$('#catalog-profile').options.length===199,'Restored 198 profiles');field('#catalog-profile',factoryId);
   assert($('#catalog-profile-detail').textContent.includes('Official Serato'),'Reload lost factory authentication');
   assert(state.mappings.length===1&&state.mappings[0].number===32,'Reload lost original conflicting assignment');
   click('#midi-connect');await until(()=>$('#midi-test-device').options.length===2,'Synthetic input enumeration');await until(()=>$('#catalog-profile').options.length===199,'Connected catalog ready');
   field('#catalog-profile',factoryId);field('#catalog-device',fakeInput.id);click('#catalog-apply');
   await until(()=>state.mappings.length>1,'Factory binding');assert(state.mappings[0].target==='Deck 4 level','Original assignment replaced');
   assert(!state.mappings.some(m=>m.target==='Deck 1 level'&&m.channel===2),'Complement CC conflict not preserved');
   assert(state.mappings.filter(m=>m.controllerProfile===factoryId).every(m=>m.mappingSource==='Official Serato'&&m.deviceId===fakeInput.id),'Binding source/identity missing');
   report.binding={retainedAssignments:1,added:state.mappings.length-1,sourceAssignments:56};
   report.checks.push('Page reload restored all profiles and reauthenticated source; explicit binding preserved the existing complement-CC assignment');
   const d=state.decks[0];Object.assign(d,{keylock:false,keyShift:0,level:.8,rate:1,loop:false,reverse:false,position:0});engine.mix(0,'level',.8);
   const buf=engine.ctx.createBuffer(2,engine.ctx.sampleRate*4,engine.ctx.sampleRate);for(let c=0;c<2;c++){const data=buf.getChannelData(c);for(let i=0;i<data.length;i++)data[i]=.1*Math.sin(2*Math.PI*(330+110*c)*i/buf.sampleRate);}engine.buffers.set(d.track.id,buf);
   await engine.recordStart();input(2,7);await until(()=>d.playing,'Factory Play');input(2,7,0);const start=engine.position(d);await sleep(350);assert(engine.position(d)>start+.1,'Factory input did not move transport');input(2,7);await until(()=>!d.playing,'Factory pause');input(2,7,0);
   const recorded=await engine.recordStop(),decoded=await engine.ctx.decodeAudioData(await recorded.arrayBuffer());report.audio={frames:decoded.length,sampleRate:decoded.sampleRate,channels:decoded.numberOfChannels,rms:[]};
   for(let c=0;c<decoded.numberOfChannels;c++){const data=decoded.getChannelData(c);let sum=0;for(const v of data){assert(Number.isFinite(v),'Nonfinite master audio');sum+=v*v;}report.audio.rms.push(Math.sqrt(sum/data.length));}
   assert(report.audio.rms.length===2&&report.audio.rms.every(v=>v>.005),'Factory map produced no stereo master audio');
   report.checks.push('Authentic Hercules factory Play address drove actual browser transport Play/pause and recorded finite stereo master audio');
   // Check one actual source range, not every already-tested router target.
   input(2,8,64,'CC');input(2,40,0,'CC');await sleep(100);input(2,8,127,'CC');input(2,40,127,'CC');await until(()=>d.rate<1,'Source inverted tempo range');report.tempo={rate:d.rate,sourceInvert:state.mappings.find(m=>m.target==='Deck 1 tempo').invert};
   input(1,1,1,'CC');await sleep(50);assert(state.midiLog.length>0,'Factory library packet not received');
   report.checks.push('Imported 14-bit inverted tempo range lowered the actual deck rate');
   report.priorImport=JSON.parse(sessionStorage.getItem('factory-check-import'));report.completed=true;
  }
 }catch(error){report.errors.push({message:error.message,stack:error.stack});}
 finally{for(const d of state.decks)engine.pause(d);report.finishedAt=new Date().toISOString();$('#factory-results').textContent=JSON.stringify(report,null,2);$('#factory-status').textContent=report.errors.length?'Failed: '+report.errors.map(e=>e.message).join('; '):report.awaitingReload?'Imports retained. Reload this page, then run the restored workflow.':'Scoped factory workflow passed; playback stopped';}
}
$('#factory-run').onclick=run;
async function boot(){const parsed=new DOMParser().parseFromString(await(await fetch('index.html')).text(),'text/html');for(const n of [...parsed.body.children])if(n.tagName!=='SCRIPT')document.body.append(n);await import('./app.js');await until(()=>window.openPlay?.state.decks[1].track,'Actual app');app=window.openPlay;$('#factory-run').disabled=false;$('#factory-run').textContent=sessionStorage.getItem('factory-check-phase')?'Run restored factory workflow':'Run factory import workflow';}
boot().catch(error=>$('#factory-status').textContent=error.message);
