import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { videoTransitionCatalog, createVideoTransitions } from "../prototype/video-transitions.js";
import { createTransitionState } from "../prototype/video-transitions-state.js";

const evidence = JSON.parse(await readFile(new URL("../docs/research/video-catalog-evaluation.json", import.meta.url), "utf8"));
const resourceNames = [...evidence.transitions, ...evidence.localizedTransitionCandidates].map((c) => c.name).sort();
assert.deepEqual(videoTransitionCatalog.filter((c) => !c.baseline).map((c) => c.name).sort(), resourceNames);
assert.equal(videoTransitionCatalog.filter((c) => c.provenance === "manifest").length, 7);
assert.equal(videoTransitionCatalog.filter((c) => c.candidate).length, 26);
assert.equal(new Set(videoTransitionCatalog.map((c) => c.name)).size, 34);
assert(videoTransitionCatalog.every((c) => !c.referenceEquivalent && c.referenceRuntimeAvailability === "unverified"));
assert(videoTransitionCatalog.find((c) => c.name === "Upfaders Only").endpointContract.includes("every amount"));
assert.throws(() => createVideoTransitions({ width: 0, height: 3 }), RangeError);
assert.throws(() => createVideoTransitions({ width: 2.5, height: 3 }), RangeError);
assert.throws(() => createVideoTransitions({ width: 4097, height: 3 }), RangeError);

const left = {}, right = {}, checks = [];
const verify = (name, run) => { try { run(); checks.push({name,passed:true}); } catch(error) { checks.push({name,passed:false,error:error.stack}); } };
verify("Center maps exactly the central50% of fader travel using declared linear curve",()=>{
  const state=createTransitionState();
  for(const [amount,expected] of [[0,0],[.125,0],[.25,0],[.375,.25],[.5,.5],[.625,.75],[.75,1],[.875,1],[1,1]]){
    const result=state.advance({name:'Center',amount,time:1,frameId:1,left,right});assert.equal(result.mixAmount,expected);assert.equal(result.captureLatch,false);
  }
});
verify("Latch50 selects live midpoint side with independent right tie and no snapshots",()=>{
  const state=createTransitionState();for(const [amount,side] of [[.49,0],[.5,1],[.51,1],[.9,1],[.2,0]]){
    const result=state.advance({name:'Latch 50',amount,time:1,frameId:1,left,right});assert.equal(result.side,side);assert.equal(result.captureLatch,false);
  }
});
verify("Scratch cuts at independent5%/95% bands and retains live selected side inside",()=>{
  const state=createTransitionState();let frameId=0;
  for(const [amount,side] of [[0,0],[.949999,0],[.95,1],[.8,1],[.050001,1],[.05,0],[.5,0],[1,1],[.4,1]]){
    const result=state.advance({name:'Scratch',amount,time:1,frameId:++frameId,left,right});assert.equal(result.side,side);assert.equal(result.captureLatch,false);
  }
});
verify("Scratch midpoint initialization is declared nearest-side and resets on source identity",()=>{
 const state=createTransitionState();assert.equal(state.advance({name:'Scratch',amount:.7,time:1,frameId:1,left,right}).side,1);
 const next=state.advance({name:'Scratch',amount:.4,time:2,frameId:2,left:{},right});assert.equal(next.side,0);assert(next.resetHistory);assert.equal(next.captureLatch,false);
});
verify("Scratch same-frame end-cut bookkeeping follows controls without snapshot capture",()=>{
 const state=createTransitionState();state.advance({name:'Scratch',amount:0,time:10,frameId:1,left,right});state.advance({name:'Scratch',amount:.95,time:10,frameId:1,left,right});
 const next=state.advance({name:'Scratch',amount:.7,time:10,frameId:1,left,right});assert.equal(next.side,1);assert(!next.freshFrame&&!next.captureLatch);
});
verify("Latch50 same-frame crossing selects new live input without temporal history",()=>{
 const state=createTransitionState();state.advance({name:'Latch 50',amount:.2,time:10,frameId:1,left,right});
 const next=state.advance({name:'Latch 50',amount:.8,time:10,frameId:1,left,right});assert.equal(next.side,1);assert(!next.freshFrame&&!next.captureLatch);
});
verify("ScratchFade retains its explicitly open prior independent snapshot policy",()=>{
 const state=createTransitionState();const first=state.advance({name:'Scratch Fade',amount:0,time:1,frameId:1,left,right});assert(first.captureLatch);
 const next=state.advance({name:'Scratch Fade',amount:.2,time:2,frameId:2,left,right});assert(next.captureLatch&&next.side===0);
 assert(!state.advance({name:'Scratch Fade',amount:.8,time:3,frameId:3,left,right}).captureLatch);
});
verify("Smudge duplicate-frame isolation and source/backward-clock resets remain intact",()=>{
 const state=createTransitionState();state.advance({name:'Smudge Fade',amount:.5,time:10,frameId:1,left,right});
 assert(!state.advance({name:'Smudge Fade',amount:.5,time:12,frameId:1,left,right}).freshFrame);
 const back=state.advance({name:'Smudge Fade',amount:.5,time:11,frameId:1,left,right});assert(back.resetHistory&&back.freshFrame);
 assert(state.advance({name:'Smudge Fade',amount:.5,time:12,frameId:2,left:{},right}).resetHistory);
});
verify("Explicit reset forgets Scratch side and mode switch isolates state",()=>{
 const state=createTransitionState();state.advance({name:'Scratch',amount:1,time:1,frameId:1,left,right});state.reset();assert.equal(state.advance({name:'Scratch',amount:.2,time:2,frameId:2,left,right}).side,0);
 assert(state.advance({name:'Center',amount:.5,time:3,frameId:3,left,right}).resetHistory);
});
console.log(JSON.stringify({passed:checks.filter(c=>c.passed).length,failed:checks.filter(c=>!c.passed).length,checks,scope:'Executed current pure transition lifecycle and catalog validation; no GLSL compilation/pixels/currentSerato equivalence. Prior frozen Latch/Scratch snapshots remain historical independent behavior, superseded for these names.'},null,2));
assert(checks.every(c=>c.passed),'Transition lifecycle regressions failed');

if (process.argv.includes("--serve")) {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const port = Number(process.env.VIDEO_TRANSITIONS_PORT || 8786);
  const server = createServer(async (req, res) => {
    const path = new URL(req.url, "http://127.0.0.1").pathname;
    if (!/^\/prototype\/video-transitions(?:-[a-z]+)*\.(?:html|js)$/.test(path)) { res.writeHead(404); res.end("Not found"); return; }
    try {
      const data = await readFile(root + path.slice(1));
      res.writeHead(200, { "Content-Type": path.endsWith(".html") ? "text/html; charset=utf-8" : "text/javascript; charset=utf-8", "Cache-Control": "no-store" }); res.end(data);
    } catch { res.writeHead(404); res.end("Not found"); }
  });
  server.listen(port, "127.0.0.1", () => console.log(`Browser pixel harness: http://127.0.0.1:${port}/prototype/video-transitions-harness.html`));
}
