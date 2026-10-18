// Actual production offline entry point; complete returned PCM retained for separate inspection.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {transformChannels} from '../prototype/keylock-dsp.js';
const out='local-evidence/keylock-resampled-production';assert(!fs.existsSync(out));fs.mkdirSync(out,{recursive:true});
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const cases=[
 {id:'retained-shifted',sr:44100,tones:[330,550],seconds:14,tempo:1.08,semitones:2,gradePitch:true},
 {id:'retained-bass',sr:44100,tones:[97,173],seconds:14,tempo:.75,semitones:-12,gradePitch:true},
 {id:'minimum-internal-rate',sr:44100,tones:[330,550],seconds:1,tempo:.25,semitones:24,gradePitch:false},
 {id:'maximum-internal-rate',sr:44100,tones:[330,550],seconds:1,tempo:4,semitones:-24,gradePitch:false}
];
const rows=[];
for(const row of cases){
 const input=row.tones.map(hz=>Float32Array.from({length:row.sr*row.seconds},(_,n)=>.12*Math.sin(2*Math.PI*hz*n/row.sr)));
 const hashes=input.map(c=>sha(new Uint8Array(c.buffer))),started=performance.now();
 const result=await transformChannels(input,row.sr,{tempo:row.tempo,semitones:row.semitones});
 assert.deepEqual(input.map(c=>sha(new Uint8Array(c.buffer))),hashes,'Source PCM mutated');
 const frames=Math.round(input[0].length/row.tempo);assert.equal(result.length,2);assert(result.every(c=>c.length===frames&&c.every(Number.isFinite)));
 const bytes=Buffer.alloc(frames*2*4);for(let n=0;n<frames;n++)for(let c=0;c<2;c++)bytes.writeFloatLE(result[c][n],(n*2+c)*4);
 const file=out+'/'+row.id+'.f32';fs.writeFileSync(file,bytes,{flag:'wx'});
 rows.push({...row,frames,channels:2,wholeFinite:true,inputUnchanged:true,rawPath:file,bytes:bytes.length,sha256:sha(bytes),serialWallMs:performance.now()-started});
}
const report={scope:'Production transformChannels with actual WASM and shared resampler in serial host; two pitch checks plus two policy-extreme output geometry/finite checks. No live adapter/native/browser/music/cursor/latency acceptance.',sourceHashes:Object.fromEntries(['prototype/keylock-dsp.js','prototype/pcm-resample.js','prototype/vendor/signalsmith-stretch/SignalsmithStretch-open-play-history.mjs'].map(p=>[p,sha(fs.readFileSync(p))])),rows,fullKeylockAccepted:false};
fs.writeFileSync('docs/prototype/keylock-resampled-production-render.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(rows.map(({id,frames,serialWallMs})=>({id,frames,serialWallMs})),null,2));
