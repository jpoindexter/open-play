// Isolated startup capture-gap probe. Read-only with respect to every existing file.
// Purpose: decide whether the observed 256-frame startup hole in an AudioWorklet capture
// is (H1) the capture processor being skipped while upstream nodes rendered those frames,
// or (H3) the context frame counter advancing while no node rendered them.
// Oracle: a sample-index ramp (AudioBufferSourceNode) feeds the capture input AND the
// zero-gain destination route, so it is pulled every quantum the graph is pulled, whether
// or not the capture node is. Ramp delta across consecutive capture calls = frames rendered
// by the graph between those calls. Frame-label delta = frames the context clock advanced.
// All audible output is forced to zero: capture outputs zeros; the only destination route is a
// gain of 0. No production engine, no scratch, no acceptance claim.

const $ = selector => document.querySelector(selector);
const QUANTUM = 128;
const RAMP_SECONDS = 12; // float32 exact integers to 16,777,216; 12 s at 48 kHz is 576,000.
const STEADY_CALLS = 8;  // processor-side readiness: consecutive calls with exact 128-frame advance
const CLOCK_ADVANCED_SECONDS = 0.05;
const processorSource = `class CaptureGapProbe extends AudioWorkletProcessor {
 constructor(){super();this.rows=[];this.seq=0;this.armRequest=null;this.armed=null;this.finishId=null;this.finished=false;this.steady=0;
  this.port.onmessage=({data})=>{if(data.type==='arm'&&!this.armed&&!this.finished)this.armRequest={id:data.id,policy:data.policy,steadyCalls:data.steadyCalls,requestedAtSeq:this.seq};else if(data.type==='finish'&&!this.finished)this.finishId=data.id;};
  this.port.postMessage({type:'ready'});}
 process(inputs,outputs){
  const size=outputs[0][0].length;outputs[0].forEach(c=>c.fill(0));if(this.finished)return false;
  const input=inputs[0]||[],ramp=input[0],marker=input[1];
  const previous=this.rows.at(-1);
  if(previous&&currentFrame===previous.frame+previous.size)this.steady+=1;else this.steady=0;
  const row={seq:this.seq++,frame:currentFrame,time:currentTime,size,inputChannels:input.length,rampFirst:ramp?ramp[0]:null,rampLast:ramp?ramp[size-1]:null,marker:marker?marker[0]:null,steady:this.steady};
  this.rows.push(row);
  if(this.rows.length===1)this.port.postMessage({type:'first',row});
  if(this.armRequest&&!this.armed){
   const policy=this.armRequest.policy,ready=policy==='steady'?this.steady>=this.armRequest.steadyCalls:true;
   if(ready){this.armed={id:this.armRequest.id,policy,seq:row.seq,frame:row.frame,rampFirst:row.rampFirst,preArmCalls:row.seq,requestedAtSeq:this.armRequest.requestedAtSeq};this.port.postMessage({type:'armed',armed:this.armed});}
  }
  if(this.finishId!==null){this.finished=true;this.port.postMessage({type:'finished',id:this.finishId,lastFrame:currentFrame+size,rows:this.rows,armed:this.armed});return false;}
  return true;}
}registerProcessor('open-play-capture-gap-probe',CaptureGapProbe);`;

function bounded(promise, label, milliseconds = 15000) {
  let timer;
  return Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(Error(label + ' timed out')), milliseconds); })]).finally(() => clearTimeout(timer));
}
const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve));

function rampBuffer(ctx) {
  const length = Math.round(RAMP_SECONDS * ctx.sampleRate), buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  const index = buffer.getChannelData(0), marker = buffer.getChannelData(1);
  for (let i = 0; i < length; i++) { index[i] = i + 1; marker[i] = 1; } // 0 means "ramp not running"
  return buffer;
}

// Each consecutive pair of processor calls is classified by two independent deltas.
function classifyPairs(rows) {
  const pairs = [];
  for (let i = 1; i < rows.length; i++) {
    const a = rows[i - 1], b = rows[i], frameDelta = b.frame - a.frame, rampRunning = a.marker === 1 && b.marker === 1;
    const rampDelta = rampRunning ? b.rampFirst - a.rampFirst : null;
    if (frameDelta === a.size && (rampDelta === null || rampDelta === a.size)) continue;
    let verdict;
    if (!rampRunning) verdict = 'indeterminate: ramp not running across this pair';
    else if (rampDelta === frameDelta) verdict = 'H1: graph rendered the missing frames; capture processor was not called for them';
    else if (rampDelta === a.size) verdict = 'H3: frame counter advanced without any graph render of the missing frames';
    else verdict = 'unclassified: ramp and frame deltas disagree in an unexpected way';
    pairs.push({ previousSeq: a.seq, nextSeq: b.seq, previousFrame: a.frame, nextFrame: b.frame, missingFrames: frameDelta - a.size, rampDelta, verdict });
  }
  return pairs;
}

function spanReport(rows) {
  const anomalies = classifyPairs(rows);
  return { calls: rows.length, firstFrame: rows[0]?.frame ?? null, lastFrameEnd: rows.length ? rows.at(-1).frame + rows.at(-1).size : null, anomalies, contiguous: anomalies.length === 0 };
}

async function runContext({ index, mode, armPolicy }) {
  const wall0 = performance.now();
  const ctx = new AudioContext();
  const milestones = [];
  const mark = label => milestones.push({ label, wallMs: +(performance.now() - wall0).toFixed(2), ctxTime: ctx.currentTime, state: ctx.state });
  mark('context created');
  const resumed = ctx.resume();
  const waiters = new Map(), event = type => bounded(new Promise(resolve => waiters.set(type, resolve)), type);
  const result = { index, mode, armPolicy, sampleRate: ctx.sampleRate, baseLatency: ctx.baseLatency ?? null, milestones, fatalErrors: [] };
  let capture, silentGain, ramp, stretch, url;
  try {
    url = URL.createObjectURL(new Blob([processorSource], { type: 'text/javascript' }));
    await ctx.audioWorklet.addModule(url); URL.revokeObjectURL(url); url = null; mark('capture module added');
    silentGain = ctx.createGain(); silentGain.gain.value = 0; silentGain.connect(ctx.destination); mark('zero-gain route connected');
    capture = new AudioWorkletNode(ctx, 'open-play-capture-gap-probe', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2] });
    const ready = event('ready'), first = event('first'), armedAck = event('armed'), finished = event('finished');
    for (const p of [first, armedAck, finished]) p.catch(() => {});
    capture.port.onmessage = ({ data }) => { const resolve = waiters.get(data.type); if (resolve) { waiters.delete(data.type); resolve(data); } };
    capture.connect(silentGain); mark('capture node constructed and connected');
    ramp = ctx.createBufferSource(); ramp.buffer = rampBuffer(ctx); ramp.connect(capture); ramp.connect(silentGain); ramp.start(); mark('ramp source started (connected to capture input and zero-gain route)');
    if (mode === 'vendor') {
      const { default: factory } = await import('../../../prototype/vendor/signalsmith-stretch/SignalsmithStretch-open-play.mjs');
      stretch = await bounded(factory(ctx, { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2] }), 'vendor factory');
      stretch.connect(capture); mark('vendor two-fix node created and connected (inactive, never scheduled)');
      result.vendorLatencySeconds = await bounded(stretch.latency(), 'vendor latency'); mark('vendor latency acknowledged');
    }
    await bounded(resumed, 'resume'); mark('resume() resolved');
    await ready; mark('capture processor constructed (ready)');
    if (armPolicy === 'clock-advanced') { while (ctx.currentTime < CLOCK_ADVANCED_SECONDS) await nextFrame(); mark('main-thread clock advanced past threshold'); }
    capture.port.postMessage({ type: 'arm', id: 'ctx' + index, policy: armPolicy === 'steady' ? 'steady' : 'immediate', steadyCalls: STEADY_CALLS }); mark('arm requested');
    result.firstCall = (await first).row; mark('first processor call reported');
    result.armed = (await armedAck).armed; mark('arm acknowledged by processor');
    while (ctx.currentTime < result.armed.frame / ctx.sampleRate + 3) await nextFrame();
    mark('3 s of armed span elapsed on main-thread clock');
    capture.port.postMessage({ type: 'finish', id: 'fence' + index });
    const fence = await finished; mark('fence acknowledged');
    result.fence = { lastFrame: fence.lastFrame, rows: fence.rows.length };
    result.all = spanReport(fence.rows);
    result.preArm = spanReport(fence.rows.filter(row => row.seq < result.armed.seq));
    const armedRows = fence.rows.filter(row => row.seq >= result.armed.seq);
    result.armedSpan = spanReport(armedRows);
    result.firstRows = fence.rows.slice(0, 12);
    result.outputLatency = ctx.outputLatency ?? null;
    if (armedRows[0]?.frame !== result.armed.frame) result.fatalErrors.push('armed span first row does not match acknowledged arm frame');
    if (result.armedSpan.lastFrameEnd !== fence.lastFrame) result.fatalErrors.push('armed span end does not match acknowledged fence');
    if (!result.armedSpan.contiguous) result.fatalErrors.push('armed span has a frame or ramp discontinuity');
  } catch (error) {
    result.fatalErrors.push(error.message);
  } finally {
    try { if (url) URL.revokeObjectURL(url); ramp?.stop(); ramp?.disconnect(); stretch?.disconnect(); stretch?.port?.close(); capture?.disconnect(); capture?.port.close(); silentGain?.disconnect(); await ctx.close(); } catch (error) { result.cleanupError = error.message; }
  }
  result.completed = result.fatalErrors.length === 0 && !result.cleanupError;
  result.wallMs = +(performance.now() - wall0).toFixed(1);
  return result;
}

let lastReport = null;
$('#run').onclick = async () => {
  const button = $('#run'); button.disabled = true; $('#download').disabled = true;
  const mode = $('#mode').value, armPolicy = $('#arm').value, contexts = Math.max(1, Math.min(8, Number($('#contexts').value) || 1));
  const report = {
    scope: 'Startup capture-gap diagnostic: per-call frame labels plus an independent sample-index ramp oracle; silent; no keylock acceptance, no production integration.',
    startedAt: new Date().toISOString(), userAgent: navigator.userAgent, mode, armPolicy, steadyCalls: STEADY_CALLS, clockAdvancedSeconds: CLOCK_ADVANCED_SECONDS, contexts: [],
  };
  try {
    for (let index = 0; index < contexts; index++) {
      $('#status').textContent = `Running context ${index + 1}/${contexts} (${mode}, arm ${armPolicy})`;
      report.contexts.push(await runContext({ index, mode, armPolicy }));
      $('#results').textContent = JSON.stringify(report, null, 2);
    }
    const anomalies = report.contexts.flatMap(c => (c.all?.anomalies || []).map(a => ({ context: c.index, ...a })));
    report.summary = {
      contextsRun: report.contexts.length,
      contextsCompleted: report.contexts.filter(c => c.completed).length,
      contextsWithAnyAnomaly: report.contexts.filter(c => c.all && !c.all.contiguous).length,
      contextsWithArmedAnomaly: report.contexts.filter(c => c.armedSpan && !c.armedSpan.contiguous).length,
      verdictCounts: anomalies.reduce((acc, a) => { const key = a.verdict.split(':')[0]; acc[key] = (acc[key] || 0) + 1; return acc; }, {}),
      anomalies,
    };
    $('#status').textContent = `${report.summary.contextsCompleted}/${report.summary.contextsRun} contexts completed; ${anomalies.length} anomaly pair(s); see summary.verdictCounts`;
  } catch (error) {
    report.error = error.message; $('#status').textContent = 'Probe failed';
  } finally {
    lastReport = report; $('#results').textContent = JSON.stringify(report, null, 2); $('#download').disabled = !lastReport; button.disabled = false;
  }
};
$('#download').onclick = () => {
  if (!lastReport) return;
  const blob = new Blob([JSON.stringify(lastReport, null, 2)], { type: 'application/json' }), url = URL.createObjectURL(blob), anchor = document.createElement('a');
  anchor.href = url; anchor.download = `capture-gap-probe-${lastReport.mode}-${lastReport.armPolicy}.json`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
};
