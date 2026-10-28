// Diagnostic only: call in the actual app document, with generated demos stopped
// and audioMonitor physical mute enabled. Events are synthetic, not OS focus proof.
export async function runJogFocusCheck(app){
 const {state,engine}=app,doc=document,win=doc.defaultView;
 const assert=(value,message)=>{if(!value)throw Error(message);};
 const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 async function until(check,label){const end=performance.now()+3000;while(!check()){assert(performance.now()<end,label+' timed out');await sleep(10);}}
 const key=type=>doc.body.dispatchEvent(new KeyboardEvent(type,{key:'h',code:'KeyH',shiftKey:!!state.settings['Playback Keys Use Shift'],bubbles:true,cancelable:true}));
 const play=()=>{const button=doc.querySelector('[data-action="play"][data-deck="1"]');assert(button,'Deck B Play missing');button.click();};
 assert(state.tracks.length&&state.tracks.every(track=>track.demo),'Generated-demo-only diagnostic session required');
 assert(state.decks.every(deck=>!deck.playing&&!deck.processing&&!deck.playQueued),'Start with every deck stopped');
 assert(engine.audioMonitor?.snapshot().physicalMuted,'Physical output must already be muted');
 assert(!doc.querySelector('#modal')?.open,'Close diagnostic modal first');
 const d=state.decks[1];assert(d?.track?.demo,'Load a generated demo on deck B');
 assert(!d.sync&&!d.keylock&&!d.keyShift&&!d.loop&&!d.reverse,'Use an ordinary unsynced, unshifted deck B');
 const track=d.track,position=engine.position(d),plays=track.plays,historyLength=state.history.length,prepare=[...state.prepare];
 const controls=[...doc.querySelectorAll('.deck button,.channel-strip input,#crossfader,.library-wave-preview img')];
 const report={scope:'Actual renderer keyboard and installed window-blur handler with raw engine voice; dispatched blur, not OS foreground switching or physical jog'};
 try{
  play();await until(()=>d.playing&&!d.processing&&!d.playQueued,'B playback');
  const voice=engine.voices.get(1),nominal=d.rate;
  assert(voice?.sources?.length&&!voice.gridTimeline&&!voice.liveKeylock,'Expected ordinary raw source voice');
  const rate=()=>voice.sources[0].playbackRate.value*(voice.timelineScale||1);
  const closeTo=value=>Math.abs(rate()-value)<1e-7;
  assert(!key('keydown'),'App did not handle H');await until(()=>closeTo(nominal*1.04),'H bend');
  const bent=rate();assert(d.rate===nominal,'Jog changed nominal tempo');
  win.dispatchEvent(new Event('blur'));await until(()=>closeTo(nominal),'Blur restoration');
  key('keyup');await sleep(200);
  assert(closeTo(nominal)&&d.rate===nominal,'Bend returned after cleanup');
  assert(d.playing&&engine.voices.get(1)===voice,'Blur interrupted or replaced the playing voice');
  assert(engine.audioMonitor.snapshot().physicalMuted,'Physical mute changed');
  Object.assign(report,{key:'H',bentRate:bent,restoredRate:rate(),nominalRate:d.rate,stableAfterMilliseconds:200});
  play();await until(()=>!d.playing&&!d.processing&&!d.playQueued,'B stop');
  const stoppedPosition=engine.position(d),token=engine.startTokens.get(1);await sleep(200);
  assert(!d.playing&&!engine.voices.has(1)&&engine.position(d)===stoppedPosition&&engine.startTokens.get(1)===token,'Queued bend or restart after Stop');
  assert(controls.every(node=>node.isConnected),'Jog/cleanup replaced controls or previews');
  Object.assign(report,{completed:true,retainedControlsAndPreviews:controls.length,stopped:true,physicalMuted:true});return report;
 }finally{
  key('keyup');win.dispatchEvent(new Event('blur'));
  engine.pause(d);engine.audioMonitor.mutePhysical(true);
  if(d.track===track){await engine.seek(d,position);track.plays=plays;}
  state.history.length=historyLength;state.prepare=prepare;
 }
}
