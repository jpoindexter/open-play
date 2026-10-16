// Executes the current panels.js callback, not a copied implementation. Import,
// audio load and graphics read are controlled adapters. This does NOT establish
// browser file decoding, AudioEngine behavior, Canvas pixels or native parity.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {File} from 'node:buffer';
const path=new URL('../prototype/panels.js',import.meta.url),source=await readFile(path,'utf8');
const start=source.indexOf('  async function importKaraoke('),end=source.indexOf('\n  function video()',start);
assert(start>=0&&end>start,'Current importKaraoke callback must be extractable from panels.js');
const callback=source.slice(start,end),callbackSHA256=createHash('sha256').update(callback).digest('hex');
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};};
const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
function harness() {
 const tracks=new Map(),decks=[0,1].map(index=>({index,track:{id:'original-'+index,type:'MP3'},playing:false,videoLoadGeneration:7}));
 const h={state:{decks,settings:{}},calls:{imports:[],loads:[],graphics:[],render:0,persist:0},importQueue:[],graphicsQueue:[],loadGate:null};
 const a={importFiles:async files=>{h.calls.imports.push(files);const next=h.importQueue.shift();const results=next?await next.promise:[{id:'imported-'+h.calls.imports.length,type:'MP3'}];for(const track of results)tracks.set(track.id,track);return results;}};
 const load=async(index,id)=>{h.calls.loads.push({index,id});const deck=h.state.decks[index];deck.playing=false;deck.track=tracks.get(id);deck.videoLoadGeneration=(deck.videoLoadGeneration||0)+1;if(h.loadGate)await h.loadGate.promise;};
 const videoMixer={loadKaraoke:async(...args)=>{h.calls.graphics.push(args);const gate=h.graphicsQueue.shift();return gate?await gate.promise:{available:true};}};
 h.run=new Function('s','a','karaokeImportTokens','load','videoMixer','renderTracks','persist',callback+';return importKaraoke;')(h.state,a,[0,0],load,videoMixer,()=>h.calls.render++,()=>h.calls.persist++);
 h.args=(index=0,name='generated.mp3')=>({index,audio:new File([new Uint8Array(64)],name,{type:name.endsWith('.wav')?'audio/wav':'audio/mpeg'}),graphics:new File([new Uint8Array(48)],'generated.cdg',{type:'application/octet-stream'}),transparency:'index',crop:false});
 return h;
}
const tests=[],test=(name,run)=>tests.push({name,run});
test('Normal MP3 pair commits exact selected arguments and scalar metadata once',async()=>{
 const h=harness(),args=h.args(),track=await h.run(args);
 assert.deepEqual(h.calls.loads,[{index:0,id:track.id}]);assert.deepEqual(h.calls.graphics,[[0,args.graphics,track.id,{transparency:'index',crop:false}]]);
 assert.equal(track.type,'MP3+G');assert.deepEqual(track.karaoke,{graphicsName:'generated.cdg',transparency:'index',crop:false});assert.equal(h.calls.render,1);assert.equal(h.calls.persist,1);assert.equal(h.state.decks[0].playing,false);
});
test('WAV fixture remains honestly labeled Audio+CDG with selected alpha/crop options',async()=>{
 const h=harness(),args={...h.args(1,'original.wav'),transparency:'alpha-table',crop:true},track=await h.run(args);assert.equal(track.type,'Audio+CDG');assert.deepEqual(h.calls.graphics[0],[1,args.graphics,track.id,{transparency:'alpha-table',crop:true}]);
});
test('Later ordinary audio load during pending import preserves the newer track',async()=>{
 const h=harness(),gate=deferred();h.importQueue.push(gate);const request=h.run(h.args());const newer={id:'newer-user-choice'};h.state.decks[0].track=newer;h.state.decks[0].videoLoadGeneration++;gate.resolve([{id:'late-pair'}]);await assert.rejects(request,/target deck changed/i);assert.equal(h.state.decks[0].track,newer);assert.equal(h.calls.loads.length,0);assert.equal(h.calls.persist,0);
});
test('Ordinary eject during pending import is authoritative even without a generation increment',async()=>{
 const h=harness(),gate=deferred();h.importQueue.push(gate);const request=h.run(h.args());h.state.decks[0].track=null;gate.resolve([{id:'late-pair'}]);await assert.rejects(request,/target deck changed/i);assert.equal(h.state.decks[0].track,null);assert.equal(h.calls.graphics.length,0);
});
test('Same-object same-ID audio reload is rejected through generation ownership',async()=>{
 const h=harness(),gate=deferred();h.importQueue.push(gate);const original=h.state.decks[0].track,request=h.run(h.args());h.state.decks[0].videoLoadGeneration++;gate.resolve([{id:'late-pair'}]);await assert.rejects(request,/target deck changed/i);assert.equal(h.state.decks[0].track,original);assert.equal(h.calls.loads.length,0);
});
test('A replaced deck object cannot be claimed even with equal track identity and generation',async()=>{
 const h=harness(),gate=deferred();h.importQueue.push(gate);const request=h.run(h.args());h.state.decks[0]={...h.state.decks[0]};gate.resolve([{id:'late-pair'}]);await assert.rejects(request,/target deck changed/i);assert.equal(h.calls.loads.length,0);
});
test('Playing-deck lock enabled during import is rechecked before audio replacement',async()=>{
 const h=harness(),gate=deferred();h.importQueue.push(gate);const request=h.run(h.args()),deck=h.state.decks[0];deck.playing=true;h.state.settings['Lock Playing Deck']=true;gate.resolve([{id:'blocked'}]);await assert.rejects(request,/started playing.*locked/i);assert.equal(deck.track.id,'original-0');assert(deck.playing);assert.equal(h.calls.loads.length,0);
});
test('An initially locked playing deck rejects before the audio importer is invoked',async()=>{
 const h=harness();h.state.decks[0].playing=true;h.state.settings['Lock Playing Deck']=true;await assert.rejects(h.run(h.args()),/locked playing deck/i);assert.equal(h.calls.imports.length,0);
});
test('Concurrent pair audio requests on one deck keep only the newest import owner',async()=>{
 const h=harness(),first=deferred(),second=deferred();h.importQueue.push(first,second);const old=h.run(h.args()),newest=h.run(h.args());first.resolve([{id:'old-pair'}]);await assert.rejects(old,/target deck changed/i);second.resolve([{id:'new-pair'}]);await newest;assert.deepEqual(h.calls.loads,[{index:0,id:'new-pair'}]);assert.equal(h.calls.graphics.length,1);assert.equal(h.calls.persist,1);
});
test('Pair imports on separate decks do not cancel each other',async()=>{
 const h=harness(),first=deferred(),second=deferred();h.importQueue.push(first,second);const a=h.run(h.args(0)),b=h.run(h.args(1));second.resolve([{id:'right-pair'}]);first.resolve([{id:'left-pair'}]);await Promise.all([a,b]);assert.equal(h.state.decks[0].track.id,'left-pair');assert.equal(h.state.decks[1].track.id,'right-pair');assert.equal(h.calls.persist,2);
});
test('An ordinary change while audio load preparation is pending blocks graphics attachment',async()=>{
 const h=harness();h.loadGate=deferred();const request=h.run(h.args());await flush();assert.equal(h.calls.loads.length,1);const newer={id:'later-during-audio-buffer'};h.state.decks[0].track=newer;h.state.decks[0].videoLoadGeneration++;h.loadGate.resolve();await assert.rejects(request,/target audio track changed/i);assert.equal(h.state.decks[0].track,newer);assert.equal(h.calls.graphics.length,0);
});
test('A stale graphics adapter rejection cannot label/persist a completed karaoke pair',async()=>{
 const h=harness(),graphics=deferred();h.graphicsQueue.push(graphics);const request=h.run(h.args());await flush();assert.equal(h.calls.graphics.length,1);const imported=h.state.decks[0].track;h.state.decks[0].track=null;graphics.reject(new Error('Graphics request lost deck ownership'));await assert.rejects(request,/lost deck ownership/i);assert.equal(imported.type,'MP3');assert(!('karaoke'in imported));assert.equal(h.calls.persist,0);
});
test('A newer pair request started during older graphics read invalidates older metadata commit',async()=>{
 const h=harness(),graphics=deferred(),newAudio=deferred();h.graphicsQueue.push(graphics);const older=h.run(h.args());await flush();const oldTrack=h.state.decks[0].track;h.importQueue.push(newAudio);const newer=h.run(h.args());graphics.resolve({available:true});const outcome=await older.then(()=>({committed:true}),error=>({error}));
 // Finish all controlled work before asserting so this regression leaves no orphan.
 newAudio.resolve([{id:'newer-after-graphics'}]);await newer;
 assert(outcome.error,'Older callback still committed after its karaoke token was replaced');assert.equal(oldTrack.type,'MP3');assert(!('karaoke'in oldTrack));assert.equal(h.calls.persist,1);
});
test('Invalid deck/missing files/partial CDG fail before any audio import',async()=>{
 const h=harness();await assert.rejects(h.run({...h.args(),index:2}),/deck 1 or 2/i);await assert.rejects(h.run({...h.args(),audio:null}),/Choose an audio/i);await assert.rejects(h.run({...h.args(),graphics:new File([new Uint8Array(23)],'partial.cdg')}),/24-byte packet/i);assert.equal(h.calls.imports.length,0);
});
const checks=[];for(const {name,run} of tests){try{await run();checks.push({name,passed:true});}catch(error){checks.push({name,passed:false,error:error.stack});}}
const result={scope:'Executed current extracted panels.js importKaraoke callback with controlled async import/load/graphics adapters. Browser decoding, AudioEngine, file-picker interaction, Canvas and reference parity are not established.',source:'prototype/panels.js#importKaraoke',callbackSHA256,passed:checks.filter(c=>c.passed).length,failed:checks.filter(c=>!c.passed).length,checks};console.log(JSON.stringify(result,null,2));if(result.failed)process.exitCode=1;
