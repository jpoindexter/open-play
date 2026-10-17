import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
import {createVideoControls,createVideoOverlaySpec} from '../prototype/video-controls.js';
import {createVideoOverlayMIDI} from '../prototype/video-overlay-midi.js';
import {createVideoMIDIRouter} from '../prototype/video-midi.js';
import {createVideoMixer} from '../prototype/video.js';
import {decodeMIDI} from '../prototype/midi.js';
const output=process.argv[2];if(!output||fs.existsSync(output))throw Error('Choose new immutable result');
const fixture=fs.readFileSync('scripts/test_overlay_editor_midi_consistency_review.mjs','utf8');const start=fixture.indexOf('function host(){'),end=fixture.indexOf('const checks=[];',start);assert(start>=0&&end>start);
const host=new Function('createVideoControls','createVideoOverlaySpec','createVideoOverlayMIDI','createVideoMIDIRouter','createVideoMixer','decodeMIDI',fixture.slice(start,end)+';return host;')(createVideoControls,createVideoOverlaySpec,createVideoOverlayMIDI,createVideoMIDIRouter,createVideoMixer,decodeMIDI);
const h=host(),evidence={};let error;
try{
 h.node('#video-overlay-list').value='i1';h.node('#video-overlay-list').onchange();
 await h.router.dispatch('Video text overlay select',h.message(127),'7-bit absolute');evidence.beforeReopen=structuredClone(h.state.video.midiOverlaySelection);
 h.controls.overlaysDialog();evidence.afterReopen=structuredClone(h.state.video.midiOverlaySelection);
 await h.router.dispatch('Video text overlay opacity',h.message(0),'7-bit absolute');evidence.opacities=[h.a.opacity,h.b.opacity];
 assert.equal(evidence.afterReopen.text.id,evidence.beforeReopen.text.id,'Opening the editor must not replace a previously selected MIDI text owner');assert.deepEqual(evidence.opacities,[1,0]);
}catch(x){error=x.message}finally{await h.dispose()}
const paths=['prototype/video-controls.js','prototype/video-overlay-midi.js','prototype/video-midi.js'];const result={scope:'Actual editor reopen/selection/router callbacks with controlled DOM/storage; no real browser/native/physical.',passed:error?0:1,failed:error?1:0,evidence,error,sourceHashes:Object.fromEntries(paths.map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')]))};fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result,null,2));if(error)process.exitCode=1;
