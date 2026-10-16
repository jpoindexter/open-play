// Original ordinary-video presentation geometry. Names mirror observed labels;
// equations, matte/alpha and lifecycle are independent Open Play policies.
export const videoTreatmentModes=Object.freeze([
  Object.freeze({value:'preserve',label:'Preserve'}),
  Object.freeze({value:'stretch',label:'Stretch'}),
  Object.freeze({value:'center-cut',label:'Center-Cut'}),
  Object.freeze({value:'letterbox',label:'Letterbox'}),
]);
const modes=new Set(videoTreatmentModes.map(mode=>mode.value));
export const videoTreatmentPolicy=Object.freeze({
  referenceEquivalent:false,
  default:'stretch',
  scope:'Ordinary decoded video; caller owns CDG presentation separately.',
  matte:'Opaque black only outside the content rectangle; decoded source alpha inside is preserved.',
  scheduling:'Caller draws only valid decoded frames, retaining the prior raw frame while seeking/unavailable. Caller commits presentation generation/history reset with effective geometry.',
});
export function normalizeVideoTreatment(value){return typeof value==='string'&&modes.has(value)?value:'stretch';}
function positive(value,name){if(typeof value!=='number'||!Number.isFinite(value)||value<=0)throw new RangeError(name+' must be a finite positive number.');return value;}
export function videoTreatmentGeometry(sw,sh,W,H,value='stretch'){
  positive(sw,'Source width');positive(sh,'Source height');positive(W,'Target width');positive(H,'Target height');const mode=normalizeVideoTreatment(value);
  let width=W,height=H;
  if(mode!=='stretch'){
    const scale=mode==='preserve'?Math.min(W/sw,H/sh):mode==='center-cut'?Math.max(W/sw,H/sh):W/sw;
    width=sw*scale;height=sh*scale;
  }
  if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)throw new RangeError('Presentation geometry is not representable.');
  const x=(W-width)/2,y=(H-height)/2,padding=[];
  // Outside-content strips only. These remain disjoint even for a small source.
  const top=Math.max(0,Math.min(H,y)),bottom=Math.max(0,Math.min(H,H-y-height));
  if(top>0)padding.push({x:0,y:0,width:W,height:top});
  if(bottom>0)padding.push({x:0,y:H-bottom,width:W,height:bottom});
  const middleY=Math.max(0,y),middleBottom=Math.min(H,y+height),middleHeight=Math.max(0,middleBottom-middleY);
  const left=Math.max(0,Math.min(W,x)),right=Math.max(0,Math.min(W,W-x-width));
  if(left>0&&middleHeight>0)padding.push({x:0,y:middleY,width:left,height:middleHeight});
  if(right>0&&middleHeight>0)padding.push({x:W-right,y:middleY,width:right,height:middleHeight});
  return{mode,source:{width:sw,height:sh},target:{width:W,height:H},destination:{x,y,width,height},padding};
}
/** Owns the complete target raw surface; returns the effective geometry.
 * Validation occurs before touching pixels. Only decoded video or Canvas-like
 * sources are supported. No audio/transport/selection/token state is modified.
 */
export function drawVideoTreatment(ctx,source,value='stretch'){
  if(!ctx?.canvas||typeof ctx.drawImage!=='function'||!source)throw new TypeError('Treatment needs a Canvas2D context and a decoded video/canvas source.');
  if(typeof source.readyState==='number'&&(source.readyState<2||source.seeking===true))throw new Error('Treatment requires a decoded frame that is not seeking.');
  // Zero decoded dimensions must never fall back to CSS/layout dimensions.
  const sw=typeof source.videoWidth==='number'?source.videoWidth:source.width,sh=typeof source.videoHeight==='number'?source.videoHeight:source.height;
  const geometry=videoTreatmentGeometry(sw,sh,ctx.canvas.width,ctx.canvas.height,value),d=geometry.destination;
  ctx.save();
  try{
    ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.imageSmoothingEnabled=true;
    ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);ctx.fillStyle='#000000';
    for(const p of geometry.padding)ctx.fillRect(p.x,p.y,p.width,p.height);
    ctx.drawImage(source,d.x,d.y,d.width,d.height);
  }finally{ctx.restore();}
  return geometry;
}
