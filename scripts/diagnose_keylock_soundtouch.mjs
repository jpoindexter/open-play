import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'local-evidence/keylock-soundtouch-initial');assert(!fs.existsSync(out));fs.mkdirSync(out,{recursive:true});
const {SoundTouch}=await import(path.join(root,'local-evidence/keylock-soundtouch-source/node_modules/@soundtouchjs/core/.dist/index.js'));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),planPath='docs/prototype/keylock-soundtouch-plan.json',holdout=JSON.parse(fs.readFileSync(path.join(root,'docs/prototype/keylock-holdout-initial-render.json'))),results=[];
const states=[{rate:.75,semitones:-12},{rate:1.08,semitones:2},{rate:1.5,semitones:12}];
const cases=holdout.sources.flatMap(source=>states.map(state=>({source,...state})));
for(const sampleRate of [44100,48000])for(const semitones of [0,2])cases.push({source:{id:`original-${sampleRate}`,sampleRate,tones:[330,550]},rate:1.08,semitones});
for(const item of cases){
 const {source,rate,semitones}=item,sr=source.sampleRate;let input;
 if(source.path){const b=fs.readFileSync(path.join(root,source.path));assert.equal(hash(b),source.sha256);input=new Float32Array(b.buffer,b.byteOffset,b.byteLength/4);}else{input=new Float32Array(sr*14*2);for(let i=0;i<sr*14;i++)for(let c=0;c<2;c++)input[2*i+c]=.14*Math.sin(2*Math.PI*source.tones[c]*i/sr+[.17,.53][c]);}
 const processor=new SoundTouch({sampleRate:sr,interpolationStrategy:'lanczos'});processor.pitchSemitones=semitones;processor.stretch.tempo=rate/(2**(semitones/12));
 const frames=Math.ceil(sr*10/128)*128,output=new Float32Array(frames*2),underflows=[];let consumed=0,nonfinite=0;
 const began=performance.now();for(let at=0;at<frames;at+=128){let guard=0;while(processor.outputBuffer.frameCount<128&&consumed<input.length/2){const count=Math.min(1024,input.length/2-consumed);processor.inputBuffer.putSamples(input,consumed,count);consumed+=count;processor.process();assert(++guard<200,'Pipeline stalled');}const got=processor.outputBuffer.extract(output.subarray(at*2,(at+128)*2),0,128,true);if(got<128)underflows.push({outputFrame:at,framesCopied:got});for(let i=at*2;i<(at+128)*2;i++)if(!Number.isFinite(output[i]))nonfinite++;}
 const id=`${source.id}-rate${rate}-shift${semitones}`,p=path.join(out,id+'.f32'),bytes=Buffer.from(output.buffer);fs.writeFileSync(p,bytes,{flag:'wx'});results.push({id,sourceID:source.id,sampleRate:sr,tones:source.tones,rate,semitones,pitchFactor:2**(semitones/12),stretchTempo:processor.stretch.tempo,sourceFrames:input.length/2,inputFramesConsumed:consumed,frames,channels:2,nonfinite,underflows,serialProcessMilliseconds:performance.now()-began,path:path.relative(root,p),sha256:hash(bytes),bytes:bytes.length});assert.equal(nonfinite,0);console.log(JSON.stringify({id,underflows:underflows.length}));
 processor.clear();
}
assert.equal(results.length,28);fs.writeFileSync(path.join(root,'docs/prototype/keylock-soundtouch-initial-render.json'),JSON.stringify({created_at:new Date().toISOString(),planPath,planSHA256:hash(fs.readFileSync(path.join(root,planPath))),module:'@soundtouchjs/core2.1.1, real WSOLA/Lanczos; no DSP emulation',results,full_parity_verified:false},null,2)+'\n',{flag:'wx'});
