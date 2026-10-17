const $ = selector => document.querySelector(selector);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const assert = (value, message) => {if (!value) throw new Error(message);};
const hash = async bytes => [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(n => n.toString(16).padStart(2, '0')).join('');
const files = ['app.js', 'engine.js', 'sync.js', 'loop-simple-sync-harness.js'];
async function identities() {
  return Object.fromEntries(await Promise.all(files.map(async file => [file, await hash(await (await fetch(file)).arrayBuffer())])));
}
async function until(predicate, label, ms = 12000) {
  const deadline = performance.now() + ms;
  while (!predicate()) {assert(performance.now() < deadline, label + ' timed out'); await sleep(10);}
}
const button = (index, action) => `[data-deck="${index}"][data-action="${action}"]`;
function click(selector) {assert($(selector), 'Missing ' + selector); $(selector).click();}
function tempo(index, percent) {
  const input = $(`[data-tempo="${index}"]`); input.value = String(percent);
  input.dispatchEvent(new Event('input', {bubbles:true}));
}
function base64(bytes) {
  let result = ''; for (let n = 0; n < bytes.length; n += 16384) result += String.fromCharCode(...bytes.subarray(n, n + 16384));
  return btoa(result);
}
// Fixed analysis declared before the run: first envelope crossing, 100ms refractory,
// nearest counterpart within a half-beat. No waveform shifting or fitted alignment.
function pulses(data, sampleRate) {
  const times = []; let last = -sampleRate;
  for (let n = 0; n < data.length; n++) {
    assert(Number.isFinite(data[n]), 'Non-finite whole recording');
    if (Math.abs(data[n]) > .01 && n - last > sampleRate * .1) {times.push(n / sampleRate); last = n;}
  }
  return times;
}
function phaseErrors(left, right, from, to) {
  return left.filter(t => t >= from && t <= to).map(t => ({left:t, errorSeconds:Math.min(...right.map(r => Math.abs(t-r)))}));
}
let app;
async function run() {
  $('#sync-run').disabled = true;
  const {state, engine} = app;
  const report = {
    startedAt:new Date().toISOString(), completed:false,
    scope:'Actual browser app DOM controls and routed stereo audio; controlled fixtures only. Two active loops; no native/hardware/Smart Sync/music quality acceptance.',
    criteria:{maximumPostSyncPhaseErrorSeconds:.01, minimumPreSyncErrorSeconds:.03, minimumPostSyncPairs:6, postWindowSeconds:4},
    fixture:{sampleRate:48000,durationSeconds:30,bpm:[120,128],offsetSeconds:[.05,.13],pulseSeconds:.012,carrierHz:900,amplitude:.15},
    checks:[], errors:[], events:[]
  };
  const event = name => report.events.push({name,audioTime:engine.ctx.currentTime,utc:new Date().toISOString()});
  try {
    report.sourceBefore = await identities(); await engine.resume();
    engine.audioMonitor.mutePhysical(true);
    await until(() => engine.audioMonitor.snapshot().physicalMuted, 'Physical mute');
    assert(engine.audioMonitor.snapshot().physicalMuted, 'Physical mute not applied'); report.physicalOutputMuted = true;
    state.settings['Sync Mode'] = 'Simple Sync'; state.settings['Snap to Beatgrid'] = false;
    await until(() => !state.analysis, 'Initial analysis');
    for (let index = 0; index < 2; index++) {
      const deck = state.decks[index], buffer = engine.ctx.createBuffer(2,48000*30,48000);
      Object.assign(deck.track,{bpm:report.fixture.bpm[index],duration:30,grid:null,analyzed:true,metadataRevision:(deck.track.metadataRevision||0)+1});
      Object.assign(deck,{rate:1,keylock:false,keyShift:0,reverse:false,loop:true,loopIn:0,loopOut:240/report.fixture.bpm[index],stemSlip:'off',position:0,sync:false});
      const data = buffer.getChannelData(index), beat = 60/deck.track.bpm, offset = report.fixture.offsetSeconds[index];
      for (let at = offset; at < 30; at += beat) {
        const first = Math.round(at*48000);
        for (let n = 0; n < 576 && first+n < data.length; n++) data[first+n] = .15*Math.sin(Math.PI*n/576)*Math.sin(2*Math.PI*900*n/48000);
      }
      engine.clearDeckScratchCache(index); engine.buffers.set(deck.track.id,buffer);
    }
    click(button(0,'play')); await until(() => state.decks[0].playing, 'Primary playback');
    click(button(1,'play')); await until(() => state.decks[1].playing, 'Secondary playback');
    await engine.recordStart(); event('record-start'); await sleep(1300);
    event('sync-request'); click(button(1,'sync'));
    await until(() => state.decks[1].sync && !state.decks[1].processing, 'Sync completion'); event('sync-complete');
    report.synced = state.decks.slice(0,2).map(d => ({rate:d.rate,role:d.syncRole,playing:d.playing}));
    assert(Math.abs(state.decks[1].rate - 120/128) < 1e-9, 'Tempo did not match');
    report.bounds=state.decks.slice(0,2).map(d=>({on:d.loop,start:d.loopIn,end:d.loopOut}));assert(report.bounds.every((l,i)=>l.on&&l.start===0&&l.end===240/report.fixture.bpm[i]),'Sync altered loop bounds');await sleep(4200); const blob = await engine.recordStop(); event('record-stop');
    const bytes = new Uint8Array(await blob.arrayBuffer());
    report.recording = {bytes:bytes.length,format:blob.type,sha256:await hash(bytes),base64:base64(bytes)};
    const decoded = await engine.ctx.decodeAudioData(bytes.buffer.slice(0));
    assert(decoded.numberOfChannels === 2, 'Expected stereo recording');
    report.decoded = {frames:decoded.length,sampleRate:decoded.sampleRate,channels:2,duration:decoded.duration};
    const times = [0,1].map(c => pulses(decoded.getChannelData(c),decoded.sampleRate));
    const pre = phaseErrors(times[0],times[1],.1,1.1), post = phaseErrors(times[0],times[1],decoded.duration-3.8,decoded.duration-.1);
    report.phase = {pulseTimes:times,pre,post};
    assert(pre.some(p => p.errorSeconds >= .03), 'Fixture did not demonstrate initial mismatch');
    assert(post.length >= 6 && post.every(p => p.errorSeconds <= .01), 'Post-Sync audio pulse alignment exceeded 10ms');
    report.checks.push('Actual postmaster audio aligned within 10ms after initially mismatched playback');
    report.loopPositions=state.decks.slice(0,2).map(d=>engine.position(d));assert(report.loopPositions.every((p,i)=>p>=0&&p<report.bounds[i].end),'Playhead escaped preserved loops');report.checks.push('Both different-BPM loops retain bounds and align after multiple audio wraps');
  } catch (error) {report.errors.push({message:error.message,stack:error.stack});}
  finally {
    if (engine.recording) await engine.recordStop();
    for (const deck of state.decks) engine.pause(deck);
    report.sourceAfter = await identities(); report.sourceStable = JSON.stringify(report.sourceBefore) === JSON.stringify(report.sourceAfter);
    report.completed = !report.errors.length && report.checks.length === 2 && report.sourceStable;
    report.finishedAt = new Date().toISOString();
    $('#sync-results').textContent = JSON.stringify({...report,recording:report.recording ? {...report.recording,base64:'Retained in downloadable report'} : null},null,2);
    $('#sync-original').textContent=JSON.stringify(report,null,2);
    const a = $('#sync-download'); a.href = URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'})); a.download = 'simple-sync-browser-results.json'; a.hidden = false;
    $('#sync-status').textContent = report.completed ? 'Scoped workflow passed; all decks paused' : 'Check failed: ' + report.errors.map(e => e.message).join('; ');
  }
}
async function boot() {
  const parsed = new DOMParser().parseFromString(await (await fetch('index.html')).text(),'text/html');
  for (const node of [...parsed.body.children]) if (node.tagName !== 'SCRIPT') document.body.append(node);
  await import('./app.js'); await until(() => window.openPlay?.state.decks[1].track, 'Actual app');
  app = window.openPlay; $('#sync-run').textContent = 'Run looped Simple Sync workflow'; $('#sync-run').disabled = false;
}
$('#sync-run').addEventListener('click',run);
boot().catch(error => {$('#sync-status').textContent = error.message;});
