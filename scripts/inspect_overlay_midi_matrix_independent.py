#!/usr/bin/env python3
"""Original artifact inspection only; never runs UI or changes parent evidence."""
import sys,json,base64,hashlib,io
from pathlib import Path
from PIL import Image,ImageChops
src,out=map(Path,sys.argv[1:3])
if out.exists():raise SystemExit('Choose a new immutable output path')
r=json.loads(src.read_text());findings=[];frames={};rows=[]
def digest(b):return hashlib.sha256(b).hexdigest()
def mask(im,color):
 channels=im.convert('RGB').split();index={'red':0,'green':1,'blue':2}[color]
 pieces=[channel.point(lambda n,active=i==index:255 if (n>220 if active else n<40) else 0) for i,channel in enumerate(channels)]
 m=ImageChops.multiply(ImageChops.multiply(pieces[0],pieces[1]),pieces[2]);count=m.histogram()[255]
 if not count:return {'count':0}
 x0,y0,x1,y1=m.getbbox();return {'count':count,'minX':x0,'minY':y0,'maxX':x1-1,'maxY':y1-1,'width':x1-x0,'height':y1-y0,'cx':(x0+x1-1)/2,'cy':(y0+y1-1)/2}
for f in r['frames']:
 try:
  b=base64.b64decode(f['dataURL'].split(',',1)[1],validate=True);im=Image.open(io.BytesIO(b));im.load();rgba=im.convert('RGBA');stats={color:mask(rgba,color) for color in ['red','green','blue']}
  row={'label':f['label'],'bytes':len(b),'sha256':digest(b),'hashMatches':digest(b)==f['sha256'],'size':list(im.size),'sizeMatches':list(im.size)==[f['width'],f['height']],'allMaskStatsMatch':all(stats[k]==f[k] for k in stats),'mask':stats,'alphaExtrema':rgba.getchannel('A').getextrema(),'wholeRGBABytes':len(rgba.tobytes())}
  rows.append(row);frames[f['label']]=row
 except Exception as e:findings.append({'label':f.get('label'),'error':repr(e)})
fixtures=[]
for f in r['fixtures']:
 b=base64.b64decode(f['base64'],validate=True);im=Image.open(io.BytesIO(b));im.load();rgba=im.convert('RGBA');colors=set(rgba.getdata());expected=(0,0,255,255) if '-B' in f['name'] else (255,0,0,255)
 fixtures.append({'name':f['name'],'bytes':len(b),'sha256':digest(b),'hashMatches':digest(b)==f['sha256'],'size':list(im.size),'sizeMatches':list(im.size)==[f['width'],f['height']],'distinctRGBA':sorted(colors),'allPixelsExpected':colors=={expected},'wholeRGBABytes':len(rgba.tobytes())})
oracles=[]
def witness(name,test,**evidence):oracles.append({'name':name,'passed':bool(test),'evidence':evidence})
def measured(summary,color):return frames[summary['label']]['mask'][color]
if r['phase']=='initial':
 for kind,color in [('text','green'),('image','red')]:
  checks={c['name'].split(': ',1)[1]:c['evidence'] for c in r['checks'] if c['name'].startswith(kind+': ')}
  e=checks['selection and On target the intended layer, suppress repeats and preserve the other layer'];witness(kind+' selection pixel witnesses',measured(e['first'],color)['count']>20 and measured(e['both'],color)['count']>20 and measured(e['both'],'blue')['count']>20)
  e=checks['MIDI opacity removes and restores actual pixels'];witness(kind+' opacity',measured(e['zero'],color)['count']==0 and measured(e['full'],color)['count']>20)
  e=checks['MIDI scale changes measured rendered bounds'];small,large=[measured(e[k],color)['count'] for k in ['small','large']];witness(kind+' scale',small>5 and large>small*6,small=small,large=large,ratio=large/small if small else None)
  e=checks['MIDI x moves the visible layer horizontally'];dx=measured(e['right'],color)['cx']-measured(e['left'],color)['cx'];witness(kind+' x movement',dx>280,delta=dx)
  e=checks['MIDI y moves the visible layer vertically'];dy=measured(e['bottom'],color)['cy']-measured(e['top'],color)['cy'];witness(kind+' y movement',dy>150,delta=dy)
  e=checks['left, right and master MIDI routes each show the actual layer at their visible endpoint'];counts={k:measured(e[k],color)['count'] for k in ['left','right','master']};witness(kind+' all three visible routes',all(n>20 for n in counts.values()),counts=counts)
  e=checks['every animation and named option updates the editor and real motion/zoom']
  for a in e['animations']:
   name=a['animation'];stats=[measured(f,color) for f in a['frames']]
   if name=='none':witness(kind+' animation none',stats[0]==stats[1],masks=stats)
   elif name.startswith('scroll-'):
    axis='cx' if 'left' in name else 'cy';sign=-1 if name in ['scroll-right-left','scroll-bottom-top'] else 1;deltas=[b[axis]-a[axis] for a,b in zip(stats,stats[1:]) if a['count'] and b['count']];witness(kind+' '+name,any(d*sign>2 and abs(d)<180 for d in deltas),deltas=deltas)
   elif name=='bpm-zoom':
    counts=[s['count'] for s in stats];witness(kind+' BPM zoom',max(counts)>min(counts)*1.2,min=min(counts),max=max(counts),ratio=max(counts)/min(counts) if min(counts) else None)
   else:
    neutral=measured(a['neutral'],color)['count'];maximum=max(s['count'] for s in stats);bassObserved=any(f['bass']>.001 and f['audioAvailable'] for f in a['frames']);witness(kind+' bass zoom pixels and recorded analysis',bassObserved and maximum>neutral*1.05,neutral=neutral,max=maximum,ratio=maximum/neutral if neutral else None,recordedBassRange=[min(f['bass'] for f in a['frames']),max(f['bass'] for f in a['frames'])],analysisIsParentRuntimeMetadata=True)
   if a['options']:
    expected=[('Slow',.5),('Medium',1),('Fast',2)] if name.startswith('scroll-') else [('Subtle',.35),('Noticeable',1),('Over the Top',2)];witness(kind+' '+name+' option metadata',[(x['label'],x['speed']) for x in a['options']]==expected,options=a['options'])
  e=checks['MIDI save/select/load use the visible name and restore the original layer metadata'];before,after=[frames[e[k]['label']]['sha256'] for k in ['before','after']];witness(kind+' entire static preset output',before==after and measured(e['after'],color)['count']>20,sha256=before)
  if kind=='image':witness('image absent before reimport',measured(e['missing'],color)['count']==0)
 for c in r['checks']:
  if c['name'].startswith('Reopening the image editor'):
   e=c['evidence']
   if 'visible' in e and 'hidden' in e:
    expectedOwner=e.get('expectedOwner',r['owners']['text'][1]);expectedColor=e.get('expectedColor','blue');order=e.get('textOrder',[])
    witness('Reopen fixture selects a non-first text owner',len(order)>1 and expectedOwner in order and expectedOwner!=order[0],expectedOwner=expectedOwner,textOrder=order)
    layer=next((layer for layers in r.get('savedLayers',{}).values() for layer in layers if layer['id']==expectedOwner),{})
    expectedHex={'green':'#00ff00','blue':'#0000ff','red':'#ff0000'}.get(expectedColor)
    witness('Reopen witness color matches the recorded intended text layer',layer.get('kind')=='text' and expectedHex is not None and layer.get('color','').lower()==expectedHex,expectedOwner=expectedOwner,expectedColor=expectedColor,layerColor=layer.get('color'))
    witness('Reopen-selected text actual color On then opacity zero',measured(e['visible'],expectedColor)['count']>20 and measured(e['hidden'],expectedColor)['count']==0,expectedColor=expectedColor,visible=measured(e['visible'],expectedColor)['count'],hidden=measured(e['hidden'],expectedColor)['count'])
    witness('Reopen preserves both recorded owners and intended selection',e['before']==e['reopened'] and e['before']['text']['id']==expectedOwner and e['before']['image']['id']==r['owners']['image'][0],before=e['before'],after=e['reopened'])
else:
 for c in r['checks']:
  e=c['evidence']
  if 'Restored text On' in c['name']:
   center=measured(e['center'],'green');left=measured(e['left'],'green');witness('Restored text On and x pixels',center['count']>20 and center['cx']-left['cx']>120,delta=center['cx']-left['cx'])
  if 'reimport restores' in c['name'] or 'crossfader mappings display' in c['name']:witness(c['name'],measured(e['output'],'red')['count']>20,count=measured(e['output'],'red')['count'])
source=[]
for name,h in r['sourceBefore'].items():
 actual=digest((Path('prototype')/name).read_bytes());source.append({'path':'prototype/'+name,'runtimeSHA256':h,'actualSHA256':actual,'matches':actual==h})
referenceErrors=[]
def refs(obj):
 if isinstance(obj,dict):
  if 'label' in obj and 'sha256' in obj and 'red' in obj:
   f=frames.get(obj['label']);
   if not f or obj['sha256']!=f['sha256'] or any(obj[k]!=f['mask'][k] for k in ['red','green','blue']):referenceErrors.append(obj.get('label'))
  for value in obj.values():refs(value)
 elif isinstance(obj,list):
  for value in obj:refs(value)
refs(r['checks'])
result={'scope':'Independent whole original PNG/fixture decoding, all exact declared RGB threshold masks/bounds and numerical pixel-oracle recomputation. Browser UI, analysis metadata and behavior were parent-executed; no native/physical/reference acceptance.','input':str(src),'inputSHA256':digest(src.read_bytes()),'phase':r['phase'],'parentCompleted':r['completed'],'parentCheckCount':len(r['checks']),'parentPassedCount':sum(c['passed'] for c in r['checks']),'fatalErrors':r['fatalErrors'],'sourceBeforeAfterEqual':r['sourceBefore']==r['sourceAfter'],'sources':source,'frames':rows,'fixtures':fixtures,'pixelOracleChecks':oracles,'frameReferenceErrors':referenceErrors,'decodeErrors':findings,'executedTargets':r['executedTargets'],'savedMappings':r['savedMappings'],'savedSelection':r['savedSelection'],'allArtifactChecksPass':not findings and not referenceErrors and all(f['hashMatches'] and f['sizeMatches'] and f['allMaskStatsMatch'] for f in rows) and all(f['hashMatches'] and f['sizeMatches'] and f['allPixelsExpected'] for f in fixtures) and all(o['passed'] for o in oracles)}
out.open('x').write(json.dumps(result,indent=2)+'\n');print(json.dumps({'output':str(out),'phase':r['phase'],'frames':len(rows),'fixtures':len(fixtures),'sourceCount':len(source),'allCurrent':all(s['matches'] for s in source),'opaqueEveryPixel':all(f['alphaExtrema']==(255,255) for f in rows),'pixelOracles':len(oracles),'failedOracles':[o for o in oracles if not o['passed']],'allArtifactChecksPass':result['allArtifactChecksPass'],'inputSHA256':result['inputSHA256']},indent=2))
