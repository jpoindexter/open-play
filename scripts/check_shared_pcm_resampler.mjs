// Compare retained pre-extraction PCM with the shared production helper on fixed source geometries.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const phase=process.argv.includes('--before')?'before':'after';const tag=process.argv.find(a=>a.startsWith('--tag='))?.slice(6);assert(!tag||/^[a-z-]{1,32}$/.test(tag));
const out='local-evidence/shared-pcm-resampler';fs.mkdirSync(out,{recursive:true});
class SourceBuffer{constructor(sr,tones){this.sampleRate=sr;this.numberOfChannels=2;this.length=sr;this.duration=1;this.data=tones.map(hz=>Float32Array.from({length:sr},(_,n)=>.12*Math.sin(2*Math.PI*hz*n/sr)));}getChannelData(c){return this.data[c];}}
globalThis.AudioBuffer=SourceBuffer;
const {copyKeylockChunk}=await import('../prototype/keylock-shadow-live.js');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const rows=[];
for(const [sourceRate,outputRate,tones] of [[22050,48000,[440,550]],[96000,48000,[35000,1000]],[48000,48000,[330,550]]]){
 const source=new SourceBuffer(sourceRate,tones),channels=await copyKeylockChunk(source,outputRate,0,outputRate),bytes=Buffer.alloc(channels.length*outputRate*4);
 for(let n=0;n<outputRate;n++)for(let c=0;c<2;c++)bytes.writeFloatLE(channels[c][n],(n*2+c)*4);
 const file=out+'/'+sourceRate+'-'+outputRate+'.f32';
 if(phase==='before')fs.writeFileSync(file,bytes,{flag:'wx'});else assert.equal(Buffer.compare(fs.readFileSync(file),bytes),0,'Extraction changed retained PCM');
 rows.push({sourceRate,outputRate,tones,frames:outputRate,sha256:sha(bytes),byteIdenticalToBefore:phase==='after'});
}
const r={scope:'Three actual production resampler source/normalization geometries; retained before/after full PCM equality only. No broad SRC quality, audio-device or new pitch-path acceptance.',phase,liveAdapterSHA256:sha(fs.readFileSync('prototype/keylock-shadow-live.js')),rows};
fs.writeFileSync('docs/prototype/shared-pcm-resampler-'+(tag||phase)+'-results.json',JSON.stringify(r,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(r,null,2));
