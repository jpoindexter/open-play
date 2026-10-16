import assert from 'node:assert/strict';
import {createCDGDecoder,CDG_FORMAT} from '../prototype/cdg.js';
const checks=[];
function test(name,run){run();checks.push({name,passed:true});}
const packet=(instruction,data=[],command=9)=>{const out=new Uint8Array(24);out[0]=command;out[1]=instruction;out.set(data,4);return out;};
const stream=(...packets)=>{const out=new Uint8Array(packets.length*24);packets.forEach((p,i)=>out.set(p,i*24));return out;};
const colors=[0x000,0xf00,0x0f0,0x00f,0xff0,0x0ff,0xf0f,0x888,0x123,0x456,0x789,0xabc,0xdef,0x135,0x579,0xfff];
const clut=(high=false,palette=colors)=>packet(high?31:30,palette.slice(high?8:0,high?16:8).flatMap(color=>[(color>>6)&63,color&63]));
const tile=(row=8,column=20,color0=0,color1=1,pattern=Array(12).fill(63),xor=false)=>packet(xor?38:6,[color0,color1,row,column,...pattern]);
const pixel=(frame,x,y)=>Array.from(frame.data.slice((y*frame.width+x)*4,(y*frame.width+x)*4+4));
const render=(bytes,options)=>createCDGDecoder(bytes,options).renderAt(1e9);

test('The raw format exposes physical dimensions, packet time and honest parity/channel policy',()=>{
 assert.deepEqual([CDG_FORMAT.width,CDG_FORMAT.height,CDG_FORMAT.packetBytes,CDG_FORMAT.packetsPerSecond],[300,216,24,300]);assert.equal(CDG_FORMAT.parityCorrection,false);assert.equal(CDG_FORMAT.channelPolicy,'all channels');
});
test('Packet0 applies at0; timing and unknown packets retain slots before a1second command',()=>{
 const packets=Array.from({length:301},()=>packet(0,[],0));packets[0]=clut();packets[300]=packet(1,[1]);
 const decoder=createCDGDecoder(stream(...packets));
 assert.equal(decoder.renderAt(0).packetCursor,1);assert.deepEqual(pixel(decoder.renderAt(.99999),100,100),[0,0,0,255]);
 const at=decoder.renderAt(1);assert.equal(at.packetCursor,301);assert.deepEqual(pixel(at,100,100),[255,0,0,255]);assert.equal(at.diagnostics.timingPackets,299);
});
test('Both CLUT halves decode nibble endpoints and recolor existing indexed pixels',()=>{
 const decoder=createCDGDecoder(stream(clut(),clut(true),packet(1,[15]),packet(30,Array(16).fill(0))));
 assert.deepEqual(pixel(decoder.renderAt(2/300),20,20),[255,255,255,255]);
 assert.deepEqual(pixel(decoder.renderAt(3/300),20,20),[255,255,255,255]);
 const recolored=createCDGDecoder(stream(clut(),packet(1,[1]),clut(false,[0,0x0f0,...colors.slice(2)])));
 assert.deepEqual(pixel(recolored.renderAt(1/300),30,30),[255,0,0,255]);assert.deepEqual(pixel(recolored.renderAt(2/300),30,30),[0,255,0,255]);
});
test('Tile origin, last valid tile and bit5-left ordering match asymmetric6x12 patterns',()=>{
 const bytes=stream(clut(),tile(0,0,0,1,[32,1,...Array(10).fill(0)]),tile(17,49,0,2,[32,1,...Array(10).fill(63)]));
 const frame=render(bytes);assert.deepEqual(pixel(frame,0,0),[255,0,0,255]);assert.deepEqual(pixel(frame,5,0),[0,0,0,255]);assert.deepEqual(pixel(frame,5,1),[255,0,0,255]);assert.deepEqual(pixel(frame,294,204),[0,255,0,255]);assert.deepEqual(pixel(frame,299,215),[0,255,0,255]);
});
test('XOR acts on indices even with identical palette RGB entries and its inverse restores exact pixels',()=>{
 const palette=[...colors];palette[1]=palette[3]=0xf00;
 const decoder=createCDGDecoder(stream(clut(false,palette),packet(1,[1]),tile(8,20,0,2,Array(12).fill(63),true),clut(false,[...palette.slice(0,3),0x0f0,...palette.slice(4)]),tile(8,20,0,2,Array(12).fill(63),true)));
 assert.deepEqual(pixel(decoder.renderAt(2/300),120,96),[255,0,0,255]);assert.deepEqual(pixel(decoder.renderAt(3/300),120,96),[0,255,0,255]);assert.deepEqual(pixel(decoder.renderAt(4/300),120,96),[255,0,0,255]);
});
test('Memory and border presets affect exact bands and valid repeated memory packets are applied',()=>{
 const decoder=createCDGDecoder(stream(clut(),packet(1,[1]),packet(2,[2]),packet(1,[3,15])));
 const frame=decoder.renderAt(2/300);for(const [x,y] of [[0,0],[5,100],[294,100],[100,11],[100,204],[299,215]])assert.deepEqual(pixel(frame,x,y),[0,255,0,255]);
 for(const [x,y] of [[6,12],[293,203],[100,100]])assert.deepEqual(pixel(frame,x,y),[255,0,0,255]);
 assert.deepEqual(pixel(decoder.renderAt(3/300),100,100),[0,0,255,255]);assert.equal(decoder.diagnostics().memoryRepeatPackets,1);
});
for(const [name,h,v,dx,dy] of [['right',16,0,6,0],['left',32,0,-6,0],['down',0,16,0,12],['up',0,32,0,-12],['diagonal',16,32,6,-12]])test('Scroll Preset '+name+' moves a marker and fills exposed pixels',()=>{
 const frame=render(stream(clut(),tile(),packet(20,[3,h,v])));assert.deepEqual(pixel(frame,120+dx,96+dy),[255,0,0,255]);assert.deepEqual(pixel(frame,120+(dx>0?0:dx<0?5:0),96+(dy>0?0:dy<0?11:0)),[0,0,0,255]);
 const edge=dx>0?[0,50]:dx<0?[299,50]:dy>0?[50,0]:[50,215];assert.deepEqual(pixel(frame,...edge),[0,0,255,255]);
});
test('Scroll Copy wraps every edge and inverse diagonal scroll restores the entire framebuffer',()=>{
 for(const [h,v,row,col,x,y] of [[16,0,4,49,0,48],[32,0,4,0,294,48],[0,16,17,20,120,0],[0,32,0,20,120,204]])assert.deepEqual(pixel(render(stream(clut(),tile(row,col),packet(24,[0,h,v]))),x,y),[255,0,0,255]);
 const decoder=createCDGDecoder(stream(clut(),tile(0,0),tile(17,49,0,2),packet(24,[0,16,32]),packet(24,[0,32,16])));
 assert.deepEqual(decoder.renderAt(2/300).data,decoder.renderAt(4/300).data);
});
test('Fine offsets alone alter visible viewport sampling, remain absolute, and crop yields288x192',()=>{
 const pattern=Array.from({length:12},(_,i)=>i===11?1:32);
 const decoder=createCDGDecoder(stream(clut(),tile(1,1,0,1,pattern),packet(20,[0,5,11]),packet(20,[0,5,11]),packet(20,[0,0,0])));
 assert.deepEqual(pixel(decoder.renderAt(1/300),6,12),[255,0,0,255]);const shifted=decoder.renderAt(2/300);assert.deepEqual(pixel(shifted,6,12),[255,0,0,255]);assert.deepEqual(pixel(shifted,6,13),[0,0,0,255]);
 assert.deepEqual(decoder.renderAt(3/300).data,shifted.data);const crop=decoder.renderAt(3/300,{crop:true});assert.deepEqual([crop.width,crop.height],[288,192]);assert.deepEqual(pixel(crop,0,0),pixel(shifted,6,12));assert.deepEqual(decoder.renderAt(4/300).data,decoder.renderAt(1/300).data);
});
test('Index transparency changes existing pixels immediately and a new key restores previous alpha',()=>{
 const decoder=createCDGDecoder(stream(clut(),packet(1,[1]),packet(28,[1]),packet(28,[0])));
 assert.equal(pixel(decoder.renderAt(1/300),30,30)[3],255);assert.equal(pixel(decoder.renderAt(2/300),30,30)[3],0);assert.equal(pixel(decoder.renderAt(3/300),30,30)[3],255);
});
test('Alpha-table profile remains explicit and independently produces255/127/3 alpha',()=>{
 const table=Array(16).fill(0);table[1]=63;table[2]=32;
 const bytes=stream(clut(),packet(1,[1]),tile(8,20,0,2),packet(28,table));const frame=render(bytes,{transparency:'alpha-table'});
 assert.equal(pixel(frame,30,30)[3],3);assert.equal(pixel(frame,120,96)[3],127);
 assert.equal(render(stream(clut(),packet(28,table)),{transparency:'alpha-table'}).data[3],255);
 assert.equal(render(bytes).data[3],255);
});
test('Backward seeks/reverse samples exactly equal fresh replay including CLUT,scroll and transparency state',()=>{
 const bytes=stream(clut(),clut(true),packet(1,[1]),tile(),packet(24,[0,16,16]),packet(28,[1]),clut(false,[0,0x0f0,...colors.slice(2)]),packet(20,[3,5,11]),tile(17,49),packet(1,[0]));
 const decoder=createCDGDecoder(bytes);
 for(const t of [0,.01,.02,.03,.015,0,.025,.005,.03])assert.deepEqual(decoder.renderAt(t).data,createCDGDecoder(bytes).renderAt(t).data);
 assert(decoder.diagnostics().replaysLifetime>0);
});
test('Malformed tiles skip whole writes;unknown commands/instructions/high bits/parity retain timing and diagnostics',()=>{
 const bytes=stream(clut(),tile(18,0),tile(0,50),packet(63),packet(1,[],8),tile(8,20,48,49));
 bytes[0]|=192;bytes[1]|=128;bytes[2]=7;bytes[20]=9;
 const decoder=createCDGDecoder(bytes),frame=decoder.renderAt(999),diag=decoder.diagnostics();
 assert.equal(diag.invalidTiles,2);assert.equal(diag.unknownInstructions,1);assert.equal(diag.unknownCommands,1);assert.equal(diag.tilePacketsWithChannelBits,1);assert.equal(diag.packetsWithParityData,1);assert.equal(frame.packetCursor,6);assert.deepEqual(pixel(frame,120,96),[255,0,0,255]);
});
test('Invalid scroll fields are diagnosed/clamped and reserved directions perform no coarse shift',()=>{
 const decoder=createCDGDecoder(stream(clut(),tile(),packet(20,[0,55,63])));decoder.renderAt(9);const d=decoder.diagnostics();assert.equal(d.invalidScrollPackets,1);assert.equal(d.invalidScrollFields,4);assert.deepEqual([d.horizontalOffset,d.verticalOffset],[5,11]);
});
test('Empty/partial/trailing packets are diagnosed without invented packets, and no time cap truncates EOF',()=>{
 for(let trailing=0;trailing<24;trailing++){
  const partial=createCDGDecoder(new Uint8Array(trailing));assert.equal(partial.renderAt(0).packetCursor,0);assert.equal(partial.diagnostics().trailingBytes,trailing);
  const bytes=new Uint8Array(24+trailing);bytes.set(clut());const decoder=createCDGDecoder(bytes);assert.equal(decoder.renderAt(Number.MAX_VALUE).packetCursor,1);assert.equal(decoder.diagnostics().trailingBytes,trailing);
 }
});
test('Input/output/diagnostics are detached; repeat render and replay do not inflate prefix statistics',()=>{
 const bytes=stream(clut(),tile(18,0),tile()),decoder=createCDGDecoder(bytes);bytes.fill(0);
 const a=decoder.renderAt(1),before=decoder.diagnostics();a.data.fill(0);a.diagnostics.invalidTiles=99;
 const b=decoder.renderAt(1);assert.deepEqual(pixel(b,120,96),[255,0,0,255]);assert.equal(b.diagnostics.invalidTiles,1);assert.equal(b.diagnostics.decodedPackets,before.decodedPackets);
 decoder.renderAt(0);decoder.renderAt(1);assert.equal(decoder.diagnostics().invalidTiles,1);assert.equal(decoder.diagnostics().decodedPackets,3);assert(decoder.diagnostics().processedPacketsLifetime>3);
});
test('Reset clears all graphic state; dispose releases bytes, is idempotent and rejects reuse',()=>{
 const decoder=createCDGDecoder(stream(clut(),packet(1,[1]),packet(28,[1]),packet(24,[0,5,11])));decoder.renderAt(9);decoder.reset();
 assert.equal(decoder.diagnostics().packetCursor,0);assert.equal(decoder.diagnostics().horizontalOffset,0);assert.deepEqual(pixel(decoder.renderAt(0),20,20),[0,0,0,255]);
 decoder.dispose();decoder.dispose();assert.equal(decoder.diagnostics().retainedInputBytes,0);assert(decoder.diagnostics().disposed);assert.throws(()=>decoder.renderAt(0),/disposed/);assert.throws(()=>decoder.reset(),/disposed/);
});
test('Wrong inputs/profiles/options and nonfinite/negative/coercing times fail explicitly',()=>{
 for(const input of [null,[],new ArrayBuffer(24),'bytes'])assert.throws(()=>createCDGDecoder(input),TypeError);
 assert.throws(()=>createCDGDecoder(new Uint8Array(),{transparency:'auto'}),RangeError);
 const decoder=createCDGDecoder(new Uint8Array());for(const t of [-1,NaN,Infinity,-Infinity,'1',{},null])assert.throws(()=>decoder.renderAt(t),RangeError);
 assert.throws(()=>decoder.renderAt(0,{crop:1}),TypeError);
});
console.log(JSON.stringify({scope:'Executed original pure decoder on hand-built packets. No browser Canvas/audio/reference parity established.',passed:checks.length,checks},null,2));
