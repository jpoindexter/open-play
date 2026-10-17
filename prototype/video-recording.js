// Independent browser recording surface. Historical manual resolution labels
// are facts; width rounding, resampling and retained30fps cadence are Open Play.
export const recordingQualityOptions=Object.freeze([
  Object.freeze({value:'output',label:'Match live output · existing default'}),
  ...[360,480,720,1080].map(height=>Object.freeze({value:`${height}p`,label:`${height}p`})),
]);
const qualities=new Set(recordingQualityOptions.map(option=>option.value));
export const videoRecordingPolicy=Object.freeze({
  source:'https://serato.com/downloads/files/141226/Serato+Video+Software+Manual+for+Serato+DJ.pdf',
  sourceSHA256:'85c57756dc96587b7b4822e2911decb4b9202f5a1d6b1cba047e1159236ae66c',
  sourceBoundary:'Currently linked official27-page manual with2015-04-09 metadata, not installed4.0.10 behavior proof.',
  documented:'Page22 offers360p/480p/720p/1080p recording; page16 states default480p at24fps and respect for output aspect ratio.',
  independent:'Missing/invalid saved choice keeps existing output-size capture. Selected height preserves live aspect as closely as nearest even positive width allows;16:9 480p is854×480. Exact vendor480p width/encoder/response is unknown.',
  cadence:'Current mixer requests30fps; requested cadence is neither measured encoded fps nor the historical24fps default.',
  lifecycle:'Dedicated capture canvas snapshots dimensions per lease. Draw resamples processed live output without resizing it. Only the exact current lease can release the surface. Mixer owns pending-start/recording/stop quality guards and MediaRecorder/audio tracks.',
  referenceEquivalent:false,
});
export function normalizeRecordingQuality(value){return typeof value==='string'&&qualities.has(value)?value:'output';}
function dimension(value,name){if(!Number.isSafeInteger(value)||value<1)throw new RangeError(`${name} must be a positive safe integer.`);return value;}
export function recordingDimensions(quality,{width,height}={}){
  dimension(width,'Live width');dimension(height,'Live height');quality=normalizeRecordingQuality(quality);
  if(quality==='output')return Object.freeze({quality,width,height});
  const captureHeight=Number(quality.slice(0,-1));
  const captureWidth=Math.max(2,2*Math.round(captureHeight*width/height/2));
  dimension(captureWidth,'Recording width');
  return Object.freeze({quality,width:captureWidth,height:captureHeight});
}
export function createVideoRecordingSurface({createCanvas=()=>document.createElement('canvas')}={}){
  if(typeof createCanvas!=='function')throw new TypeError('Recording surface needs a canvas factory.');
  let active=null,serial=0,disposed=false,last=null,draws=0;
  const live=()=>{if(disposed)throw new Error('Video recording surface was disposed.');};
  function begin(options={}){
    live();if(active)throw new Error('A recording surface is already active.');
    const dimensions=recordingDimensions(options.quality,options),canvas=createCanvas();
    if(!canvas||typeof canvas.getContext!=='function')throw new TypeError('Recording surface factory must return a canvas.');
    canvas.width=dimensions.width;canvas.height=dimensions.height;
    const context=canvas.getContext('2d');
    if(!context){canvas.width=canvas.height=0;throw new Error('Video recording needs Canvas2D.');}
    const lease=Object.freeze({id:++serial,canvas,...dimensions});
    active={lease,context};draws=0;last=dimensions;return lease;
  }
  function draw(source,lease=active?.lease){
    live();if(!active||lease!==active.lease)return false;
    const width=source?.width,height=source?.height;dimension(width,'Processed output width');dimension(height,'Processed output height');
    const {context}=active,{canvas}=active.lease;
    context.save();
    try {context.setTransform(1,0,0,1,0,0);context.globalAlpha=1;context.globalCompositeOperation='source-over';
      context.clearRect(0,0,canvas.width,canvas.height);context.drawImage(source,0,0,canvas.width,canvas.height);
    }finally{context.restore();}
    draws++;return true;
  }
  function release(lease){
    if(!active||lease!==active.lease)return false;
    active.lease.canvas.width=active.lease.canvas.height=0;active=null;return true;
  }
  function dispose(){if(disposed)return;if(active)release(active.lease);disposed=true;}
  return {begin,draw,release,dispose,diagnostics:()=>({disposed,active:!!active,...last,draws,policy:videoRecordingPolicy})};
}
