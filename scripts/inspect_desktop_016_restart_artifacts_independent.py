#!/usr/bin/env python3
"""Postrestart artifact comparison; no GUI/process interaction or source edits."""
from pathlib import Path
import hashlib,json,re
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/prototype/desktop-0.1.6-restart-independent-results.json'
def H(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def J(p):return json.loads(Path(p).read_text())
def bbox(m,off):
 y,x=np.where(m);return None if not len(x) else [int(x.min()+off[0]),int(y.min()+off[1]),int(x.max()+1+off[0]),int(y.max()+1+off[1])]
def main():
 assert not OUT.exists(),'Refusing to overwrite a previous review result'
 plan_path=ROOT/'docs/prototype/desktop-0.1.6-video-pixel-plan.json';plan=J(plan_path);roi=plan['pixel_ROI_xyxy'];assert roi==[2100,1370,2750,1510];assert plan['bright_pixel_predicate']=='Each R,G,B >180'
 names=['desktop-0.1.6-video-output-baseline.png','desktop-0.1.6-video-output-reopened.png','desktop-0.1.6-video-output-reopened-off.png'];frames=[];arrays=[];masks=[]
 for name in names:
  p=ROOT/'docs/prototype/screenshots'/name
  with Image.open(p) as im:fmt=im.format;im.verify()
  with Image.open(p) as im:im.load();a=np.asarray(im.convert('RGBA')).copy();size=list(im.size)
  assert size==[2880,1898];x0,y0,x1,y1=roi;region=a[y0:y1,x0:x1];mask=np.all(region[:,:,:3]>180,axis=2);arrays.append(region);masks.append(mask);frames.append({'path':str(p.relative_to(ROOT)),'bytes':p.stat().st_size,'originalSHA256':H(p),'actualEncodedFormat':fmt,'dimensions':size,'wholeImageDecoded':True,'wholeDecodedRGBASHA256':hashlib.sha256(a.tobytes()).hexdigest(),'ROI':roi,'brightPixels':int(mask.sum()),'brightMaskSHA256':hashlib.sha256(mask.astype(np.uint8).tobytes()).hexdigest(),'decodedROISHA256':hashlib.sha256(region.tobytes()).hexdigest(),'brightBoundingBoxImageExclusive':bbox(mask,(x0,y0))})
 pixel_checks={'originalBaselineAtLeast100':masks[0].sum()>=100,'reopenedBrightMaskExactlyEqualsOriginalBaseline':np.array_equal(masks[0],masks[1]),'reopenedOffBrightPixelsExactlyZero':masks[2].sum()==0};pixel_checks={k:bool(v) for k,v in pixel_checks.items()}
 initial=ROOT/'docs/prototype/desktop-0.1.6-midi-initial-export.json';restored=ROOT/'docs/prototype/desktop-0.1.6-midi-restored-export.json';original=Path('/Users/jasonpoindexter/Downloads/open-play-native-016-midi-restored.json');assert initial.read_bytes()==restored.read_bytes()==original.read_bytes();assert H(restored)=='2b3935a876e55db3a0c0cce2b01f0b3c18e93cbf795b6446bc7ae1a4566ff117';mapping=J(restored);assert len(mapping['mappings'])==3;assert mapping['physicalCompatibilityVerified'] is False
 stop_path=ROOT/'docs/prototype/desktop-0.1.6-restart-stop-observation.json';new_path=ROOT/'docs/prototype/desktop-0.1.6-restart-new-process.json';stop=J(stop_path);new=J(new_path);assert stop['prior_pid']==93085;assert stop['old_native_process_absent'] is True;assert stop['listener18768_absent'] is True;assert new['previous_pid']==93085;assert new['new_pid']==94208;assert new['new_pid']!=new['previous_pid'];assert new['new_process_confirmed'] is True;assert new['listener']=='127.0.0.1:18768';assert '/0.1.6/' in new['executable']
 ui_path=ROOT/'docs/prototype/desktop-0.1.6-ui-restored-actions.json';ui=J(ui_path);steps={a['step']:a for a in ui['actions']};assert sorted(steps)==list(range(94,117));initial_ui=ROOT/'docs/prototype/desktop-0.1.6-ui-initial-actions.json';assert [e['step'] for e in J(initial_ui)['actions']]==list(range(1,94))
 evidence={
 'noAutoAudioState94':'0 decks playing' in steps[94]['state'],
 'failedNumeric646Retained':'Synthetic test value, Value: 646' in steps[99]['state'],
 'failedNumeric6Retained':'Synthetic test value, Value: 6\n' in steps[100]['state'],
 'correct66VisibleBeforeInject':'Synthetic test value, Value: 66' in steps[101]['state'],
 'actualSynthetic119Equals66Log':'CC ch16 119=66' in steps[102]['state'],
 'GlassTransitAndPlus2InSubsequentState':'text Glass Transit' in steps[103]['state'] and 'text F#m (+2)' in steps[103]['state'],
 'restoredDeck2TempoZero':'Deck 2 tempo, Value: 0,' in steps[103]['state'],
 'actualSynthetic118Equals0Log':'CC ch16 118=0' in steps[109]['state'],
 'FilesStatusThreeLocallyZeroSession':'3 imported tracks saved locally; 0 session-only.' in steps[114]['state'],
 'finalNoPlaying116':'0 decks playing' in steps[116]['state'],
 'keyResetByFinalState':'text F#m (+2)' not in steps[116]['state'],
 }
 assert all(evidence.values()),evidence
 frozen={
 'docs/research/DESKTOP_016_HOST_INDEPENDENT_REVIEW_20261017.md':'7384e2fd099086e3deacad4d6500149b750d408f5ca6b60c9ed920731a65a0be',
 'docs/research/DESKTOP_016_MIDI_AUDIO_INDEPENDENT_REVIEW_20261017.md':'648fa38686e108adc99f86c58e737c0420782f28dbfc76bb412431f3e810700b',
 'docs/research/DESKTOP_016_VIDEO_ARTIFACT_INDEPENDENT_REVIEW_20261017.md':'547a720c477a46a1f6154b7d66b07958912de72dc141872798294a544282acde',
 'docs/prototype/desktop-0.1.6-midi-audio-independent-results.json':'3424c69811687797546f42b560f83060f816eb50a6733666be9a81a21819de4a',
 'docs/prototype/desktop-0.1.6-video-artifact-independent-results.json':'c18499650fe47dd4349c7d653d13197e01be75e7c6eb654fce0302d8aa6ec974',
 }
 for p,expected in frozen.items():assert H(ROOT/p)==expected,p
 asars=[]
 for version,expected in [('0.1.5','251bcc16caf9cfb42a3967db058717373a8c6fcb9ff97d56c330058ec8301b03'),('0.1.6','f9e85d9ef3150fd37c15f5b3d72a4e3f6a06a42a59bf29617a43bdf566cdba6e')]:
  p=ROOT/f'local-evidence/desktop-builds/{version}/Open Play Test-darwin-arm64/Open Play Test.app/Contents/Resources/app.asar';assert H(p)==expected;asars.append({'version':version,'path':str(p.relative_to(ROOT)),'SHA256':expected})
 output={'scope':'Independent offline original-image/export byte/pixel comparison and consistency review of parent saved OS/UI observations. No reviewer UI/process/device operations, native audio afterrestart, storagebyte-decode/crash-recovery or allVideo/reference/fullparity execution.','pixelPlan':{'path':str(plan_path.relative_to(ROOT)),'SHA256':H(plan_path),'fixedROI':roi,'predicate':plan['bright_pixel_predicate']},'frames':frames,'pixelChecks':pixel_checks,'pixelCriterionPassed':all(pixel_checks.values()),'reopenedROIChangedPixelsVsOriginalBaseline':int(np.any(arrays[0]!=arrays[1],axis=2).sum()),'MIDIExport':{'restoredPath':str(restored.relative_to(ROOT)),'originalDownloads':str(original),'SHA256':H(restored),'bytes':restored.stat().st_size,'originalInitialRestoredBytesIdentical':True,'value':mapping},'parentObservations':{'stop':{'path':str(stop_path.relative_to(ROOT)),'SHA256':H(stop_path),'value':stop},'newProcess':{'path':str(new_path.relative_to(ROOT)),'SHA256':H(new_path),'value':new},'initialUI':{'path':str(initial_ui.relative_to(ROOT)),'SHA256':H(initial_ui),'actions':93},'restoredUI':{'path':str(ui_path.relative_to(ROOT)),'SHA256':H(ui_path),'actions':23,'firstStep':94,'lastStep':116},'savedStatePredicates':evidence,'independentlyObservedNativeRuntime':False},'preservedFrozenArtifacts':frozen,'preservedASARs':asars,'priorAudioDeclaredCriterionStillFailed':J(ROOT/'docs/prototype/desktop-0.1.6-midi-audio-independent-results.json')['declaredCriteriaPassed'] is False,'fullParityVerified':False,'physicalMIDICompatibilityVerified':False}
 with OUT.open('x') as f:json.dump(output,f,indent=2,allow_nan=False);f.write('\n')
 print(json.dumps({'output':str(OUT.relative_to(ROOT)),'SHA256':H(OUT),'pixelChecks':pixel_checks,'frames':frames,'savedStatePredicates':evidence},indent=2))
 if not output['pixelCriterionPassed']:raise SystemExit(1)
if __name__=='__main__':main()
