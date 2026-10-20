// One process per track releases decoded PCM before the next file.
import {readFile,writeFile} from 'node:fs/promises';
import {analyzePCM} from '../prototype/analysis.js';
import {createBeatgrid} from '../prototype/beatgrid.js';
const [pcmPath,outputPath]=process.argv.slice(2),rate=Number(process.argv[4]??22050);
if(!pcmPath||!outputPath)throw new Error('Usage: node scripts/check_tempo_corpus_track.mjs scratch.f32 result.json');
const bytes=await readFile(pcmPath);
if(bytes.length%8)throw new Error('Expected complete stereo float32 frames');
const raw=new Float32Array(bytes.buffer,bytes.byteOffset,bytes.length/4),frames=raw.length/2;
const channels=[new Float32Array(frames),new Float32Array(frames)];
let energies=[0,0];
for(let i=0;i<frames;i++)for(let c=0;c<2;c++){const v=raw[2*i+c];channels[c][i]=v;energies[c]+=v*v;}
const result=analyzePCM(channels,rate,{maxSeconds:180,analyzeKey:false});
const track={duration:result.duration,bpm:result.bpm,grid:result.grid?.firstBeat};
const grid=createBeatgrid(track),suggestion=result.grid?.drift?.suggestion;
const proposed=suggestion?createBeatgrid({...track,bpm:suggestion.bpm,grid:suggestion.firstBeat,gridWarpMarkers:suggestion.markers}):null;
const beats=grid?Array.from({length:Math.max(0,Math.floor(grid.beatAt(track.duration)))},(_,beat)=>({beat,before:grid.timeAt(beat),after:proposed?.timeAt(beat)??null})):[];
await writeFile(outputPath,JSON.stringify({result,chosenChannel:energies[1]>energies[0]?1:0,beats}));
