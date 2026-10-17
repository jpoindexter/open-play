const $ = s => document.querySelector(s), assert = (x, m) => {if (!x) throw new Error(m);};
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const digest = async bytes => [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(v => v.toString(16).padStart(2, '0')).join('');
function bounded(promise, label, ms = 10000) {
  let timer;
  return Promise.race([promise, new Promise((_, reject) => {timer = setTimeout(() => reject(new Error(label + ' timed out')), ms);})]).finally(() => clearTimeout(timer));
}
async function post(path, body, type) {
  const response = await fetch(path, {method: 'POST', headers: {'Content-Type': type, 'X-Open-Play-Test': 'soundtouch-transport'}, body});
  assert(response.ok, 'Exclusive evidence write failed: ' + path + ' ' + response.status);
  return response.json();
}
function rpc(node, onEvent) {
  let sequence = 0; const pending = new Map();
  node.port.onmessage = ({data}) => {
    const handler = pending.get(data.requestId);
    if (handler) {pending.delete(data.requestId); data.error ? handler.reject(Object.assign(new Error(data.error.message), {name: data.error.name})) : handler.resolve(data.value);}
    else onEvent(data);
  };
  return (type, values = {}, transfer = []) => {
    const requestId = ++sequence;
    return bounded(new Promise((resolve, reject) => {pending.set(requestId, {resolve, reject}); node.port.postMessage({type, requestId, ...values}, transfer);}), type).finally(() => pending.delete(requestId));
  };
}
function stats(data, first, last, channel, channels, sr) {
  let mean = 0, power = 0, peak = 0;
  for (let i = first; i < last; i++) {const v = data[i * channels + channel]; mean += v; power += v * v; peak = Math.max(peak, Math.abs(v));}
  mean /= last - first; const crossings = [];
  for (let i = first + 1; i < last; i++) {const a = data[(i - 1) * channels + channel] - mean, b = data[i * channels + channel] - mean; if (a < 0 && b >= 0) crossings.push(i - 1 - a / (b - a));}
  return {frames: last - first, rms: Math.sqrt(power / (last - first)), peak,
    hz: crossings.length > 1 ? (crossings.length - 1) * sr / (crossings.at(-1) - crossings[0]) : null};
}
function summary(report) {
  $('#result').textContent = JSON.stringify({completed: report.completed, fatalErrors: report.fatalErrors,
    cases: report.cases.map(c => ({id: c.id, errors: c.errors, frames: c.capture?.frames, captureValid: c.capture?.valid,
      tonePasses: c.measurements?.filter(m => m.passed).length, toneChecks: c.measurements?.length,
      exactPauseSilence: c.silence?.every(s => s.passed), criteriaPassed: c.criteriaPassed}))}, null, 2);
}
$('#run').onclick = async () => {
  $('#run').disabled = true;
  const report = {startedAt: new Date().toISOString(), cases: [], fatalErrors: [], completed: false, full_parity_verified: false};
  try {
    const plan = await (await fetch('/plan.json')).json(); report.plan = plan;
    report.servedSources = await (await fetch('/sources.json')).json();
    for (const spec of plan.cases) {
      $('#status').textContent = 'Capturing ' + spec.id + '; physical output muted.';
      const row = {...spec, events: [], errors: [], criteriaPassed: false}; report.cases.push(row);
      let ctx, transport, collector, request, captureRequest, osc, gain, safe; const blocks = []; let receivedFrames = 0;
      try {
        ctx = new AudioContext({sampleRate: spec.sampleRate}); await bounded(ctx.resume(), 'resume');
        assert(ctx.sampleRate === spec.sampleRate, 'Requested/actual sample rate mismatch');
        row.environment = {sampleRate: ctx.sampleRate, baseLatency: ctx.baseLatency, outputLatency: ctx.outputLatency, userAgent: navigator.userAgent};
        await bounded(ctx.audioWorklet.addModule('/experiments/keylock-soundtouch/pull-worklet.mjs'), 'transport module');
        await bounded(ctx.audioWorklet.addModule('/experiments/keylock-soundtouch/transport-capture.mjs'), 'capture module');
        transport = new AudioWorkletNode(ctx, 'open-play-soundtouch-pull-experiment', {numberOfInputs: 0, numberOfOutputs: spec.sources,
          outputChannelCount: Array(spec.sources).fill(2)});
        request = rpc(transport, data => {row.events.push(data); if (data.type === 'fatal') row.errors.push(data.error);});
        collector = new AudioWorkletNode(ctx, 'open-play-soundtouch-transport-capture', {numberOfInputs: spec.sources + 1, numberOfOutputs: 1,
          outputChannelCount: [2], channelCount: 2, channelCountMode: 'explicit', channelInterpretation: 'discrete', processorOptions: {sources: spec.sources}});
        captureRequest = rpc(collector, data => {
          if (data.type === 'pcm') {if (receivedFrames < spec.sampleRate * 25) {blocks.push(data); receivedFrames += data.frames;} else row.errors.push({message: 'Capture exceeded25second bound'});}
        });
        safe = ctx.createGain(); safe.gain.value = 0; safe.connect(ctx.destination); collector.connect(safe);
        for (let source = 0; source < spec.sources; source++) transport.connect(collector, source, source);
        osc = ctx.createOscillator(); osc.frequency.value = 307; gain = ctx.createGain(); gain.gain.value = .04;
        osc.connect(gain); gain.connect(collector, 0, spec.sources); osc.start();
        const buffers = Array.from({length: spec.sources}, () => Array.from({length: 2}, (_, c) => Float32Array.from({length: ctx.sampleRate * 32}, (_, i) =>
          .14 * Math.sin(2 * Math.PI * (i < ctx.sampleRate * 16 ? [330, 550][c] : [660, 880][c]) * i / ctx.sampleRate + [.17, .53][c]))));
        row.inputHashes = await Promise.all(buffers.map(async channels => Promise.all(channels.map(channel => digest(channel.buffer)))));
        row.load = await request('load', {sampleRate: ctx.sampleRate, buffers}, buffers.flat().map(c => c.buffer));
        const tagPlan = plan.frame_tag_schedule;
        assert(tagPlan, 'Explicit future frame-tag plan required');
        const tagStart = Math.ceil((ctx.currentTime + tagPlan.lead_seconds) * ctx.sampleRate / 128) * 128;
        const tagEnd = tagStart + Math.round(tagPlan.ramp_seconds * ctx.sampleRate);
        row.frameTagSchedule = {startFrame: tagStart, endFrame: tagEnd, issuedAtContextFrame: ctx.currentTime * ctx.sampleRate};
        collector.parameters.get('frameTag').setValueAtTime(tagStart, tagStart / ctx.sampleRate);
        collector.parameters.get('frameTag').linearRampToValueAtTime(tagEnd, tagEnd / ctx.sampleRate);
        const tagDeadline = performance.now() + 5000;
        while (ctx.currentTime * ctx.sampleRate < tagStart + tagPlan.arm_after_anchor_frames) {
          await wait(10); assert(performance.now() < tagDeadline, 'Frame-tag anchor was not reached');
        }
        row.frameTagSchedule.armObservedContextFrame = ctx.currentTime * ctx.sampleRate;
        row.arm = await captureRequest('arm');
        row.startFrame = Math.ceil((ctx.currentTime + plan.start_lead_seconds) * ctx.sampleRate / 128) * 128;
        row.commands = plan.timeline.map(({offset, ...command}) => ({...command, frame: row.startFrame + Math.round(offset * ctx.sampleRate)}));
        row.accepted = await request('commands', {commands: row.commands});
        row.commandAckContextFrame = ctx.currentTime * ctx.sampleRate;
        assert(row.accepted.acks.length === 7 && row.accepted.acks.every(a => a.ready), 'Missing prepared command acknowledgement');
        assert(row.commandAckContextFrame < row.startFrame, 'Preparation missed the first output deadline');
        const endFrame = row.startFrame + Math.ceil(plan.capture_until_offset_seconds * ctx.sampleRate), deadline = performance.now() + 45000;
        while (!blocks.length || blocks.at(-1).frame + blocks.at(-1).frames < endFrame) {
          await wait(20); assert(performance.now() < deadline, 'Whole capture timeout'); assert(!row.errors.length, 'Processor reported an error');
        }
        row.finalSnapshot = await request('snapshot');
      } catch (error) {row.errors.push({name: error.name, message: error.message, stack: error.stack});}
      finally {
        if (captureRequest) try {row.stop = await captureRequest('stop');} catch (error) {row.errors.push({message: error.message});}
        // Retain every complete received block before disposal can fail.
        if (blocks.length) {
          const sr = ctx.sampleRate, channels = spec.sources * 2 + 2, frames = blocks.reduce((n, b) => n + b.frames, 0);
          const data = new Float32Array(frames * channels); let offset = 0, nonfinite = 0, contiguous = true, maxFrameTagError = 0;
          row.blocks = [];
          blocks.forEach((b, n) => {
            assert(b.channels.length === channels && b.channels.every(c => c.length === b.frames), 'Raw channel geometry mismatch');
            if (b.sequence !== n || b.frames !== 128 || n && b.frame !== blocks[n - 1].frame + blocks[n - 1].frames) contiguous = false;
            row.blocks.push({sequence: b.sequence, frame: b.frame, frames: b.frames});
            for (let i = 0; i < b.frames; i++) {
              maxFrameTagError = Math.max(maxFrameTagError, Math.abs(b.channels[channels - 1][i] - (b.frame + i)));
              for (let c = 0; c < channels; c++) {const v = b.channels[c][i]; if (!Number.isFinite(v)) nonfinite++; data[(offset + i) * channels + c] = v;}
            }
            offset += b.frames;
          });
          row.capture = {frames, channels, sampleRate: sr, firstFrame: blocks[0].frame, nonfinite, contiguous, maxFrameTagError,
            valid: nonfinite === 0 && contiguous && maxFrameTagError <= .25, sha256: await digest(data.buffer)};
          row.capture.retained = await post('/raw/' + spec.id, data.buffer, 'application/octet-stream');
          const range = window => window.map(seconds => Math.round(row.startFrame + seconds * sr) - row.capture.firstFrame);
          row.measurements = []; row.silence = [];
          if (row.startFrame && range([0, 16.5])[1] <= frames) {
            for (const test of report.plan.measurements) {
              const [first, last] = range(test.window); assert(first >= 0 && last <= frames, 'Measurement outside original capture');
              for (let c = 0; c < spec.sources * 2; c++) {
                const m = stats(data, first, last, c, channels, sr), expected = test.expectedHz[c % 2];
                row.measurements.push({label: test.label, channel: c, window: test.window, ...m, expectedHz: expected,
                  errorHz: m.hz === null ? null : Math.abs(m.hz - expected), passed: m.hz !== null && Math.abs(m.hz - expected) <= 1 && m.rms > .001});
              }
            }
            for (const window of report.plan.silence_windows) {
              const [first, last] = range(window); let peak = 0;
              for (let i = first; i < last; i++) for (let c = 0; c < spec.sources * 2; c++) peak = Math.max(peak, Math.abs(data[i * channels + c]));
              row.silence.push({window, peak, passed: peak === 0});
            }
            const [first, last] = range([.5, 2.5]); row.control = stats(data, first, last, spec.sources * 2, channels, sr);
            row.control.passed = Math.abs(row.control.hz - 307) <= .01 && row.control.rms > .001;
            row.identicalSources = true;
            for (let i = 0; i < frames; i++) for (let source = 1; source < spec.sources; source++) for (let c = 0; c < 2; c++)
              if (data[i * channels + source * 2 + c] !== data[i * channels + c]) row.identicalSources = false;
            row.criteriaPassed = !row.errors.length && row.capture.valid && row.measurements.every(m => m.passed) && row.silence.every(s => s.passed) && row.control.passed && row.identicalSources;
          }
        }
        if (request) try {row.disposed = await request('dispose');} catch (error) {row.errors.push({message: error.message}); row.criteriaPassed = false;}
        try {osc?.stop();} catch {} transport?.disconnect(); collector?.disconnect(); gain?.disconnect(); safe?.disconnect();
        if (ctx) await ctx.close(); summary(report);
      }
    }
    report.completed = true;
  } catch (error) {report.fatalErrors.push({name: error.name, message: error.message, stack: error.stack});}
  report.finishedAt = new Date().toISOString(); summary(report);
  try {await post('/report', JSON.stringify(report, null, 2), 'application/json'); $('#status').textContent = `${report.cases.filter(c => c.criteriaPassed).length}/${report.cases.length} cases meet individual criteria. App unchanged.`;}
  catch (error) {$('#status').textContent = 'Evidence write failed: ' + error.message;}
};
