import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {createDeckTapTempo} from './deck-tap-tempo.js';

test('actual deck Tap callback refreshes the changed track without rebuilding active controls',async()=>{
 const source=await readFile(new URL('./app.js',import.meta.url),'utf8');
 const line=source.split('\n').find(line=>line.startsWith('const deckTapTempo='));
 assert.ok(line,'Actual Tap constructor');
 const track={id:'tap',bpm:120,grid:0,key:'Am'},deck={index:1,track},calls=[];
 const engine={audibleRate:()=>1,onGridWillChange:()=>calls.push('before'),onGridChanged:async()=>calls.push('realign')};
 const scope={createDeckTapTempo,engine,persist:()=>calls.push('persist'),notify(){},state:{deckCount:4,decks:[deck]},time:String,
  refreshTrackDetails:(_state,t)=>{assert.equal(t,track);calls.push('metadata');},drawWaves:t=>{assert.equal(t,track);calls.push('waves');},
  renderDecks:()=>calls.push('rebuild'),renderTracks:()=>calls.push('rows')};
 vm.runInNewContext(line+'\nglobalThis.tap=deckTapTempo;',scope);
 await scope.tap.tap(deck,1000);await scope.tap.tap(deck,1480);
 assert.equal(track.bpm,125);
 assert.equal(calls.includes('rebuild'),false,'Tap must not replace focused/pointer-owned controls');
 assert.deepEqual(calls,['before','persist','realign','metadata','rows','waves']);
});

test('failed grid realignment still presents saved Tap metadata and preserves the error',async()=>{
 const track={id:'tap',bpm:120},deck={index:0,track},rendered=[],messages=[];
 const tap=createDeckTapTempo({engine:{audibleRate:()=>1,onGridChanged:async()=>{throw Error('realignment failed');}},render:t=>rendered.push(t),notify:s=>messages.push(s)});
 await tap.tap(deck,1000);await assert.rejects(tap.tap(deck,1480),/realignment failed/);
 assert.equal(track.bpm,125);assert.deepEqual(rendered,[track]);
 assert.equal(messages.some(s=>s.includes('tapped BPM')),false,'Failed realignment must not announce success');
});
