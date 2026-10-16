const basename=name=>String(name||'').replace(/\.[^/.]+$/,'').normalize('NFC').toLowerCase();
// Diagnostics are scalar/plain metadata only. Never stringify pixel buffers,
// decoded objects, file contents or getters supplied by a runtime adapter.
function diagnosticMetadata(value,seen=new WeakSet()) {
  if(value===null||typeof value==='string'||typeof value==='boolean')return value;
  if(typeof value==='number')return Number.isFinite(value)?value:String(value);
  if(!value||typeof value!=='object'||Array.isArray(value)||ArrayBuffer.isView(value)||value instanceof ArrayBuffer)return undefined;
  if(seen.has(value))return '[circular metadata]';
  const prototype=Object.getPrototypeOf(value);if(prototype!==Object.prototype&&prototype!==null)return undefined;
  seen.add(value);const result={};
  for(const [key,descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if(['data','bytes','buffer','input','image','audio','graphics','file','url'].includes(key)||!('value'in descriptor))continue;
    const clean=diagnosticMetadata(descriptor.value,seen);if(clean!==undefined)result[key]=clean;
  }
  return result;
}

/** Explicit local pair import. The application owns audio decode/deck loading,
 * cancellation and track ownership; the mixer owns decoder assets and pixels.
 * No transport start/play call is made by this controller. */
export function createVideoKaraokeControls({state,videoMixer,notify=()=>{},dialog,importKaraoke}) {
  let openGeneration=0;
  function open() {
    const generation=++openGeneration,initialIndex=state.focus===1?1:0;
    dialog('Audio + CDG karaoke pair',`<p>Choose an audio file and its CDG graphics explicitly. MP3 + CDG is the documented target; WAV + CDG is also allowed for original test fixtures. Unzip files before choosing them. Import does not request playback.</p><label>Target audio deck<select id="video-karaoke-deck"><option value="0" ${initialIndex===0?'selected':''}>Deck 1 · left</option><option value="1" ${initialIndex===1?'selected':''}>Deck 2 · right</option></select></label><fieldset><legend>Import a local pair</legend><div class="form-grid"><label>Audio file<input id="video-karaoke-audio" type="file" accept="audio/*"></label><label>CDG graphics file<input id="video-karaoke-graphics" type="file" accept=".cdg,application/octet-stream"></label><label>Pair transparency profile<select id="video-karaoke-profile"><option value="index">Index · one transparent palette color</option><option value="alpha-table">Alpha table · explicit compatibility profile</option></select></label><label><input id="video-karaoke-crop" type="checkbox"> Crop pair display to 288 × 192</label></div><p id="video-karaoke-pair-warning" class="muted" role="status">Select both local files.</p><button id="video-karaoke-import" disabled>Import pair to selected deck</button></fieldset><fieldset><legend>Current track graphics</legend><p id="video-karaoke-message" role="status">Reading selected deck…</p><pre id="video-karaoke-diagnostics" aria-label="Current karaoke diagnostics">No diagnostics read yet.</pre><button id="video-karaoke-refresh">Refresh status</button><div class="form-grid"><label>Current graphics transparency<select id="video-karaoke-current-profile"><option value="index">Index</option><option value="alpha-table">Alpha table</option></select></label><label><input id="video-karaoke-current-crop" type="checkbox"> Crop current graphics to 288 × 192</label></div><div class="form-actions"><button id="video-karaoke-configure">Apply profile / crop to current graphics</button><button id="video-karaoke-clear">Clear current track graphics</button></div></fieldset><p class="muted">Full graphics storage is 300 × 216. Crop, transparency compatibility and pairing rules are independent policies; Serato visual equivalence is unverified. Audio and CDG bytes are session assets: reload requires reimport. No bytes are saved by this dialog.</p>`,providedRoot=>{
      const root=providedRoot||document,$=selector=>root.querySelector(selector),deck=$('#video-karaoke-deck'),audio=$('#video-karaoke-audio'),graphics=$('#video-karaoke-graphics'),message=$('#video-karaoke-message');
      let busy=false,statusGeneration=0;
      const current=()=>generation===openGeneration;
      const index=()=>Number(deck.value);
      function availability() {
        for(const id of ['deck','audio','graphics','profile','crop','current-profile','current-crop'])$('#video-karaoke-'+id).disabled=busy;
        $('#video-karaoke-import').disabled=busy||!audio.files?.[0]||!graphics.files?.[0]||typeof importKaraoke!=='function';
        $('#video-karaoke-configure').disabled=busy||typeof videoMixer.configureKaraoke!=='function';
        $('#video-karaoke-clear').disabled=busy||typeof videoMixer.clearKaraoke!=='function';
        $('#video-karaoke-refresh').disabled=busy||typeof videoMixer.karaokeDiagnostics!=='function';
      }
      function pairWarning() {
        const a=audio.files?.[0],g=graphics.files?.[0];
        $('#video-karaoke-pair-warning').textContent=!a||!g?'Select both local files.':basename(a.name)!==basename(g.name)?`Names differ: “${a.name}” and “${g.name}”. This explicit pair is allowed; verify the files belong together.`:`Explicit pair: “${a.name}” + “${g.name}”.`;
        availability();
      }
      async function status() {
        const request=++statusGeneration,selected=index();
        if(typeof videoMixer.karaokeDiagnostics!=='function'){message.textContent='Karaoke diagnostics are awaiting application integration.';return;}
        const info=await videoMixer.karaokeDiagnostics(selected);
        if(!current()||request!==statusGeneration||selected!==index())return;
        const metadata=diagnosticMetadata(info);
        $('#video-karaoke-diagnostics').textContent=metadata===undefined?'No scalar diagnostics were returned.':JSON.stringify(metadata,null,2);
        message.textContent=info?'Current selected-track diagnostics. A zero packet cursor means no packets have been processed yet.':'No CDG graphics are registered for the selected track.';
        const profile=metadata?.transparencyProfile??metadata?.decoder?.transparencyProfile;
        if(profile==='index'||profile==='alpha-table')$('#video-karaoke-current-profile').value=profile;
        const crop=metadata?.crop??metadata?.frame?.crop;
        if(typeof crop==='boolean')$('#video-karaoke-current-crop').checked=crop;
      }
      const action=operation=>async()=>{
        if(busy)return;busy=true;availability();
        try{await operation();}
        catch(error){if(current())message.textContent=error.message||String(error);notify(error.message||String(error));}
        finally{busy=false;if(current())availability();}
      };
      deck.onchange=()=>{statusGeneration++;status().catch(error=>{if(current())message.textContent=error.message;notify(error.message);});};
      audio.onchange=graphics.onchange=pairWarning;
      $('#video-karaoke-refresh').onclick=action(status);
      $('#video-karaoke-import').onclick=action(async()=>{
        const audioFile=audio.files?.[0],graphicsFile=graphics.files?.[0],selected=index();
        if(!audioFile||!graphicsFile)throw new Error('Choose both an audio file and a CDG graphics file.');
        if(typeof importKaraoke!=='function')throw new Error('Pair import is awaiting application integration.');
        message.textContent='Importing the selected local pair…';
        const track=await importKaraoke({index:selected,audio:audioFile,graphics:graphicsFile,transparency:$('#video-karaoke-profile').value,crop:$('#video-karaoke-crop').checked});
        if(!current())return;
        await status();
        message.textContent=track?'Pair imported. Playback remains controlled from the audio deck.':'The pair import did not commit. Refresh status to inspect the current track.';
      });
      $('#video-karaoke-configure').onclick=action(async()=>{
        await videoMixer.configureKaraoke(index(),{transparency:$('#video-karaoke-current-profile').value,crop:$('#video-karaoke-current-crop').checked});
        if(!current())return;await status();message.textContent='Current track graphics configuration applied.';
      });
      $('#video-karaoke-clear').onclick=action(async()=>{
        await videoMixer.clearKaraoke(index());if(!current())return;await status();message.textContent='Current track graphics cleared.';
      });
      availability();
      if(typeof importKaraoke!=='function')$('#video-karaoke-pair-warning').textContent='Pair import is awaiting application integration.';
      status().catch(error=>{if(current())message.textContent=error.message;notify(error.message);});
    });
  }
  return {open};
}
