// Independent ReplayGain2-style reference mapping. This is not a measured
// reproduction of Serato's proprietary loudness calibration.
export function autoGainData(track,settings={}){
 const parsed=Number.parseFloat(settings['Auto Gain Reference']),reference=Number.isFinite(parsed)?Math.max(89,Math.min(98,parsed)):92,targetLUFS=-18+(reference-89),loudness=track?.analysisResult?.loudness;
 const available=loudness?.version==='bs1770-integrated-v1'&&Number.isFinite(loudness.integratedLUFS),monoCompensationLU=loudness?.channels===1?10*Math.log10(2):0,rawGainDB=available?targetLUFS-loudness.integratedLUFS-monoCompensationLU:null;
 return{enabled:settings['Use Auto Gain']===true,available,reference,targetLUFS,measuredLUFS:available?loudness.integratedLUFS:null,monoCompensationLU,rawGainDB,baseDB:available?Math.max(-24,Math.min(24,rawGainDB)):0,reason:available?null:loudness?.reason||'analysis_required'};
}
export function autoGainMode(track,settings){const data=autoGainData(track,settings);return!data.enabled?'MANUAL':!data.available?data.reason==='analysis_required'?'AUTO · WAIT':'AUTO · NO LEVEL':track?.autoGainDeferred?'AUTO · NEXT LOAD':'AUTO';}
