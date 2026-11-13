import test from 'node:test';
import assert from 'node:assert/strict';
import {AudioEngine} from './engine.js';
import {demoTracks} from './fixtures.js';
test('cold demo preparation yields to controls and concurrent requests share complete PCM',async()=>{
 const engine=new AudioEngine();let channels,created=0,heartbeat=false;
 engine.ctx={createBuffer(numberOfChannels,length,sampleRate){created++;channels=Array.from({length:numberOfChannels},()=>new Float32Array(length));return{numberOfChannels,length,sampleRate,duration:length/sampleRate,getChannelData:index=>channels[index]};}};
 const track=demoTracks[2],timer=setTimeout(()=>heartbeat=true,0);
 try{
  const first=engine.buffer(track),second=engine.buffer(track),[a,b]=await Promise.all([first,second]);
  assert(heartbeat,'A scheduled control task must run before full demo synthesis finishes');assert.equal(a,b);assert.equal(created,1);assert.equal(engine.bufferLoads.size,0);assert.equal(engine.buffers.get(track.id),a);
  assert.equal(a.duration,48);assert.equal(a.sampleRate,22050);assert.equal(a.numberOfChannels,2);
  // Samples captured from the original generator before adding scheduling yields.
  const expected=[[-.01254898589104414,.08230793476104736,.07026510685682297],[-.012521802447736263,.080964095890522,.06912536174058914]];
  channels.forEach((data,c)=>[1234,50000,1000000].forEach((frame,i)=>assert(Math.abs(data[frame]-expected[c][i])<1e-7,'Demo PCM changed')));
 }finally{clearTimeout(timer);}
});
