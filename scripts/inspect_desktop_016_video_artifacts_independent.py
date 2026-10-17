#!/usr/bin/env python3
"""Inspect full saved native screenshots against a fixed, predeclared ROI."""
from pathlib import Path
import hashlib,json
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
PLAN=ROOT/'docs/prototype/desktop-0.1.6-video-pixel-plan.json'
OUT=ROOT/'docs/prototype/desktop-0.1.6-video-artifact-independent-results.json'
def sha(b):return hashlib.sha256(b).hexdigest()
def bbox(mask,offset=(0,0)):
 y,x=np.where(mask)
 return None if not len(x) else [int(x.min())+offset[0],int(y.min())+offset[1],int(x.max())+1+offset[0],int(y.max())+1+offset[1]]
def main():
 assert not OUT.exists(),'Refusing to replace prior inspection'
 raw_plan=PLAN.read_bytes();plan=json.loads(raw_plan);roi=plan['pixel_ROI_xyxy'];assert roi==[2100,1370,2750,1510];assert plan['bright_pixel_predicate']=='Each R,G,B >180';assert plan['criteria']=={'baseline_bright_pixels_min':100,'opacity0_bright_pixels_max':0,'restore_bright_mask_equals_baseline':True}
 frames=[];arrays=[];masks=[]
 for name in plan['files']:
  p=ROOT/'docs/prototype/screenshots'/name;original=p.read_bytes()
  with Image.open(p) as verify:actual_format=verify.format;verify.verify()
  with Image.open(p) as image:
   image.load();mode=image.mode;size=list(image.size);array=np.asarray(image.convert('RGBA')).copy()
  assert size==[2880,1898];x0,y0,x1,y1=roi;assert 0<=x0<x1<=size[0] and 0<=y0<y1<=size[1];region=array[y0:y1,x0:x1];mask=np.all(region[:,:,:3]>180,axis=2);arrays.append(array);masks.append(mask)
  frames.append({'file':str(p.relative_to(ROOT)),'encodedBytes':len(original),'originalSHA256':sha(original),'actualEncodedFormat':actual_format,'wholeImageDecoderVerified':True,'originalMode':mode,'width':size[0],'height':size[1],'completeDecodedPixels':int(size[0]*size[1]),'wholeDecodedRGBASHA256':sha(array.tobytes()),'nonopaquePixels':int(np.count_nonzero(array[:,:,3]!=255)),'ROI':{'xyxy':roi,'pixels':int(mask.size),'decodedRGBASHA256':sha(region.tobytes()),'brightPixelCount':int(mask.sum()),'brightMaskUint8SHA256':sha(mask.astype(np.uint8).tobytes()),'brightBoundingBoxImageCoordinatesExclusive':bbox(mask,(x0,y0))}})
 assert len(frames)==3
 checks={'baselineAtLeast100':int(masks[0].sum())>=100,'offExactlyZeroBrightPixels':int(masks[1].sum())==0,'restoredBrightMaskExactlyEqualsBaseline':bool(np.array_equal(masks[0],masks[2]))}
 differences=[]
 for i in [1,2]:
  diff=np.any(arrays[i]!=arrays[0],axis=2);x0,y0,x1,y1=roi;rd=diff[y0:y1,x0:x1];differences.append({'baselineTo':frames[i]['file'],'wholeImageChangedPixels':int(diff.sum()),'ROIChangedPixels':int(rd.sum()),'wholeChangedBoundingBoxExclusive':bbox(diff),'ROIBrightMaskXorPixels':int(np.logical_xor(masks[0],masks[i]).sum())})
 original_export=Path('/Users/jasonpoindexter/Downloads/open-play-native-016-midi-initial.json');retained=ROOT/'docs/prototype/desktop-0.1.6-midi-initial-export.json';export_bytes=original_export.read_bytes();assert export_bytes==retained.read_bytes();export=json.loads(export_bytes);assert export['format']=='open-play-midi-v1';assert export['physicalCompatibilityVerified'] is False;assert len(export['mappings'])==3
 expected=[{'target':'Library browse','encoding':'Relative two’s complement','type':'CC','channel':1,'number':1},{'target':'Deck 2 key shift','encoding':'Relative offset','type':'CC','channel':16,'number':119},{'target':'Video text overlay opacity','encoding':'7-bit absolute','type':'CC','channel':16,'number':118}];assert export['mappings']==expected
 report={'scope':'Offline original whole native screenshots (actual JPEG bytes despite.png filenames), full image decode and fixed predeclared canvasROI threshold/mask checks, plus actual original exportedmapping bytes. Parent performed native UI/MIDI injection; inspector did not observe/control UI, physical input or process restart. This does not establish allVideo/72target/REQ516/reference/device/nativeaudioaccuracy acceptance.','plan':{'path':str(PLAN.relative_to(ROOT)),'SHA256':sha(raw_plan),'value':plan},'frames':frames,'differencesFromBaseline':differences,'declaredPixelChecks':checks,'declaredPixelCriterionPassed':all(checks.values()),'MIDIExport':{'original':str(original_export),'retainedCopy':str(retained.relative_to(ROOT)),'bytes':len(export_bytes),'SHA256':sha(export_bytes),'originalEqualsRetainedCopy':True,'value':export,'expectedMappingMetadataExact':True,'actualDispatchOrRestoreIndependentlyExecuted':False},'incorrectScrollPositionScreenshotUsed':False,'fullVideoParityVerified':False,'physicalMIDICompatibilityVerified':False}
 with OUT.open('x') as f:json.dump(report,f,indent=2,allow_nan=False);f.write('\n')
 print(json.dumps({'result':str(OUT.relative_to(ROOT)),'SHA256':sha(OUT.read_bytes()),'frames':frames,'differences':differences,'checks':checks,'mappingSHA256':sha(export_bytes)},indent=2))
 if not report['declaredPixelCriterionPassed']:raise SystemExit(1)
if __name__=='__main__':main()
