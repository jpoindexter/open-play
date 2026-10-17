// Reporting only: all frame rows, PCM and failures stay in the full report.
// The live DOM receives bounded counters/status, never complete capture logs.
export function summarizeDeckScratchReport(report,{activeCase='',stage='',elapsedMs=0,maxCharacters=8192}={}){
 const checks=Array.isArray(report.checks)?report.checks:[],captures=Array.isArray(report.captures)?report.captures:[];
 const summary={status:report.status||'running',activeCase,stage,elapsedMs:Math.round(elapsedMs),passed:checks.filter(c=>c.passed).length,failed:checks.filter(c=>!c.passed).length,
  checks:checks.map((c,index)=>({index:index+1,name:String(c.name).slice(0,180),passed:c.passed,error:c.error?String(c.error).slice(0,300):undefined})),
  captureCount:captures.length,captures:captures.map(c=>({label:c.label,frames:c.frames,preflightRows:c.preflight?.rows?.length||0,preflightGaps:c.preflight?.gaps?.length||0,armedRows:c.armed?.rows?.length||0,armedGaps:c.armed?.gaps?.length||0})),
  stateSnapshotCount:report.stateSnapshots?.length||0,abortReason:report.abortReason,cleanupErrors:report.cleanupErrors||[],fullEvidence:'Download full report JSON and raw PCM. No armed rows were removed from full evidence.'};
 let text=JSON.stringify(summary,null,2);
 if(text.length>maxCharacters){
  // Unexpected report growth remains explicit: count every failure, identify its
  // index, and direct to the unabridged JSON. Normal seven-case reports fit.
  summary.checks=checks.map((c,index)=>({index:index+1,passed:c.passed,error:c.error?String(c.error).slice(0,100):undefined}));
  summary.captures=[];summary.summaryTruncated=true;text=JSON.stringify(summary,null,2);
 }
 if(text.length>maxCharacters){const failures=checks.flatMap((c,i)=>c.passed?[]:[i+1]);text=JSON.stringify({status:summary.status,passed:summary.passed,failed:summary.failed,failedCaseIndices:failures.slice(0,128),totalFailureCount:failures.length,summaryTruncated:true,abortReason:String(report.abortReason||'').slice(0,400),fullEvidence:summary.fullEvidence},null,2);}
 return {summary,text};
}
export function createDeckScratchReporter({report,results,status,download,onSummary=()=>{},now=()=>performance.now(),started=now(),maxCharacters=8192}){
 let reportURL=null;const timings=[];
 return {timings,
  update({activeCase='',stage='',checkpoint=false}={}){
   const began=now(),{summary,text}=summarizeDeckScratchReport(report,{activeCase,stage,elapsedMs:began-started,maxCharacters});results.textContent=text;
   status.textContent=report.status==='running'?`${activeCase||'Preparing'} · ${stage}`:`${summary.passed} passed / ${summary.failed} failed · ${report.status}`;
   onSummary(summary);
   if(checkpoint){const beforeJSON=now(),json=JSON.stringify(report);const next=URL.createObjectURL(new Blob([json],{type:'application/json'}));if(reportURL)URL.revokeObjectURL(reportURL);reportURL=next;download.href=next;download.download='deck-scratch-full-report.json';download.textContent='Download full report JSON (latest checkpoint)';timings.push({stage,characters:json.length,stringifyAndBlobMs:now()-beforeJSON});}
   return {summary,renderMs:now()-began};
  },dispose(){if(reportURL)URL.revokeObjectURL(reportURL);reportURL=null;}
 };
}
