import {createCDGDecoder,CDG_FORMAT} from './cdg.js';

export const videoKaraokePolicy = Object.freeze({
  evidence:'docs/research/VIDEO_REMAINING_WORKFLOWS.md',referenceEquivalent:false,
  ownership:'Copied session-only CDG bytes/configuration belong to a track ID; every deck owns a private decoder/canvas. Track/profile versions and load generations prevent stale attachment. No bytes, URLs or graphics are persisted.',
  clock:'Original engine.position(deck) seconds, clamped below at zero; pause/seek/reverse/loop are handled by the actual decoder replay. Graphics EOF holds the last decoded frame.',
  presentation:'Full300x216 by default; optional288x192 crop. Explicit index or alpha-table transparency. All tile channels; no parity repair. No audio start/play command.',
  validation:'Real named Blob/File and at least one complete24-byte packet. Unknown/non-graphics/timing packets remain valid timeline data and are diagnosed, not filtered out.',
});
const validId=id=>(typeof id==='string'&&id.length>0)||(typeof id==='number'&&Number.isFinite(id));
function options(input={},defaults={transparency:'index',crop:false}) {
  if(!input||typeof input!=='object'||Array.isArray(input))throw new TypeError('CDG configuration must be an object.');
  const transparency=input.transparency===undefined?defaults.transparency:input.transparency,crop=input.crop===undefined?defaults.crop:input.crop;
  if(!['index','alpha-table'].includes(transparency))throw new RangeError('CDG transparency must explicitly be index or alpha-table.');
  if(typeof crop!=='boolean')throw new TypeError('CDG crop must be boolean.');
  return {transparency,crop};
}
export function createVideoKaraoke({state,engine}={}) {
  if(!state||!Array.isArray(state.decks)||typeof engine?.position!=='function')throw new TypeError('Karaoke needs deck state and the engine original-track position API.');
  const associations=new Map(),views=new Map(),observed=new Map(),tokens=new Map(),revisions=new Map(),pending=new Map();
  let disposed=false,version=0;
  const live=()=>{if(disposed)throw new Error('Video karaoke was disposed.');};
  const indexValid=index=>{if(!Number.isInteger(index)||index<0||!state.decks[index])throw new RangeError('Choose an existing audio deck for karaoke.');};
  const invalidate=index=>{const token=(tokens.get(index)||0)+1;tokens.set(index,token);return token;};
  function release(index){const view=views.get(index);if(view){view.decoder.dispose();view.canvas.width=0;view.canvas.height=0;views.delete(index);}}
  function identity(index) {
    indexValid(index);const deck=state.decks[index],track=deck.track??null;
    let seen=observed.get(index);
    if(!seen||seen.deck!==deck||seen.track!==track||seen.trackId!==track?.id||seen.generation!==(deck.videoLoadGeneration||0)){
      invalidate(index);release(index);seen={deck,track,trackId:track?.id,generation:deck.videoLoadGeneration||0,epoch:(seen?.epoch||0)+1};observed.set(index,seen);
    }
    return seen;
  }
  function makeView(index,association,identity) {
    const decoder=createCDGDecoder(association.bytes,{transparency:association.transparency});
    try {
      if(typeof document==='undefined')throw new Error('Karaoke pixels require a browser Canvas2D surface.');
      const canvas=document.createElement('canvas');canvas.width=association.crop?CDG_FORMAT.cropWidth:CDG_FORMAT.width;canvas.height=association.crop?CDG_FORMAT.cropHeight:CDG_FORMAT.height;
      const context=canvas.getContext('2d');if(!context)throw new Error('Karaoke requires Canvas2D.');
      return {decoder,canvas,context,version:association.version,trackId:identity.trackId,epoch:identity.epoch,
        assetId:`karaoke:${index}:${association.version}:${identity.epoch}`,position:null};
    } catch(error){decoder.dispose();throw error;}
  }
  function diagnostics(index) {
    indexValid(index);
    if(disposed)return {source:'karaoke',disposed:true,available:false,reason:'disposed',retainedAssociationBytes:0,policy:videoKaraokePolicy};
    const seen=identity(index),association=associations.get(seen.trackId),view=views.get(index),decoder=view&&association&&view.version===association.version?view.decoder.diagnostics():null;
    return {source:'karaoke',disposed:false,available:!!association,reason:association?'ready':validId(seen.trackId)?'missing-pair':'missing-track',
      trackId:validId(seen.trackId)?seen.trackId:null,name:association?.name??null,assetId:view?.version===association?.version?view?.assetId??null:null,
      version:association?.version??null,loading:!!(pending.get(index)?.trackId===seen.trackId&&pending.get(index)?.token===tokens.get(index)&&pending.get(index)?.revision===revisions.get(seen.trackId)),
      transparencyProfile:association?.transparency??'index',crop:association?.crop??false,
      width:association?(association.crop?288:300):null,height:association?(association.crop?192:216):null,
      position:view?.version===association?.version?view?.position??null:null,retainedAssociationBytes:association?.bytes.length??0,
      graphicsStatus:decoder?(decoder.graphicsPackets?'graphics-packets-in-current-prefix':'no-graphics-packets-in-current-prefix'):'not-rendered',
      decoder,policy:videoKaraokePolicy};
  }
  async function load(index,file,trackId,input={}) {
    live();indexValid(index);const configuration=options(input);
    if(!validId(trackId))throw new TypeError('Karaoke track ID must be a nonempty string or finite number.');
    const seen=identity(index);if(seen.trackId!==trackId)throw new Error('Karaoke track ownership changed before load.');
    try{Blob.prototype.slice.call(file,0,0);}catch{throw new TypeError('Choose a real named CDG Blob/File.');}
    if(typeof file.name!=='string'||!file.name.trim())throw new TypeError('CDG file needs a name.');
    if(file.size<CDG_FORMAT.packetBytes)throw new RangeError('CDG pair needs at least one complete24-byte packet.');
    const token=invalidate(index),revision=(revisions.get(trackId)||0)+1;revisions.set(trackId,revision);pending.set(index,{token,trackId,revision});
    const current=()=>!disposed&&tokens.get(index)===token&&revisions.get(trackId)===revision&&state.decks[index]===seen.deck&&seen.deck.track===seen.track&&seen.track.id===trackId&&(seen.deck.videoLoadGeneration||0)===seen.generation;
    let candidate;
    try {
      const buffer=await file.arrayBuffer();
      if(!current())return null;
      if(!(buffer instanceof ArrayBuffer))throw new TypeError('CDG file read must return an ArrayBuffer.');
      const bytes=new Uint8Array(buffer).slice();if(bytes.length<24)throw new RangeError('CDG pair needs at least one complete24-byte packet.');
      const association={bytes,name:file.name,...configuration,version:++version};
      candidate=makeView(index,association,seen);
      if(!current()){candidate.decoder.dispose();candidate.canvas.width=candidate.canvas.height=0;return null;}
      associations.set(trackId,association);release(index);views.set(index,candidate);candidate=null;
      if(pending.get(index)?.token===token)pending.delete(index);
      return diagnostics(index);
    } catch(error){if(!current())return null;throw error;}
    finally{if(candidate){candidate.decoder.dispose();candidate.canvas.width=candidate.canvas.height=0;}if(pending.get(index)?.token===token)pending.delete(index);}
  }
  function frame(index) {
    live();const seen=identity(index),association=associations.get(seen.trackId);
    if(!association){release(index);return null;}
    let view=views.get(index);
    if(!view||view.version!==association.version){const replacement=makeView(index,association,seen);release(index);views.set(index,replacement);view=replacement;}
    const position=engine.position(seen.deck);
    if(typeof position!=='number'||!Number.isFinite(position))throw new RangeError('Karaoke needs finite original-track seconds from the audio engine.');
    view.position=Math.max(0,position);const rendered=view.decoder.renderAt(view.position,{crop:association.crop});
    const image=view.context.createImageData(rendered.width,rendered.height);image.data.set(rendered.data);view.context.putImageData(image,0,0);
    return {canvas:view.canvas,assetId:view.assetId,position:view.position,diagnostics:diagnostics(index)};
  }
  function configure(index,input={}) {
    live();const seen=identity(index),previous=associations.get(seen.trackId);
    if(!previous)throw new Error('No CDG graphics are associated with the current audio track.');
    const configuration=options(input,previous),association={...previous,...configuration,version:++version},replacement=makeView(index,association,seen);
    revisions.set(seen.trackId,(revisions.get(seen.trackId)||0)+1);invalidate(index);
    associations.set(seen.trackId,association);release(index);views.set(index,replacement);return diagnostics(index);
  }
  function clear(index) {
    live();const seen=identity(index);invalidate(index);pending.delete(index);
    if(validId(seen.trackId))revisions.set(seen.trackId,(revisions.get(seen.trackId)||0)+1);
    const removed=associations.delete(seen.trackId);release(index);return removed;
  }
  function dispose() {
    if(disposed)return;disposed=true;
    for(const index of views.keys())release(index);
    associations.clear();pending.clear();tokens.clear();revisions.clear();observed.clear();
  }
  return {load,frame,configure,clear,diagnostics,dispose};
}
