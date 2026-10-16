const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
// Display returned metadata without retaining/stringifying browser media objects.
function metadata(value,seen=new WeakSet()) {
  if(value===null||typeof value==='string'||typeof value==='boolean')return value;
  if(typeof value==='number')return Number.isFinite(value)?value:String(value);
  if(!value||typeof value!=='object'||ArrayBuffer.isView(value)||value instanceof ArrayBuffer)return undefined;
  if(seen.has(value))return '[circular metadata]';seen.add(value);
  if(Array.isArray(value))return value.map(item=>metadata(item,seen)).filter(item=>item!==undefined);
  const prototype=Object.getPrototypeOf(value);if(prototype!==Object.prototype&&prototype!==null)return undefined;
  const output={};for(const [key,descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if(['data','bytes','buffer','input','image','video','audio','file','url'].includes(key)||!('value'in descriptor))continue;
    const clean=metadata(descriptor.value,seen);if(clean!==undefined)output[key]=clean;
  }return output;
}
/** Local crate/association controls only. The mixer owns selection, generation
 * cancellation, decoded resources and persistence. No audio transport is called. */
export function createVideoMediaControls({state,videoMixer,notify=()=>{},dialog,persist=()=>{}}) {
  let openGeneration=0;
  function open() {
    const generation=++openGeneration,initialIndex=state.focus===1?1:0;
    dialog('Media Crate / transition selection',`<p>Media Crate fallback supplies visuals for audio without associated video. An explicit video association wins even when fallback is off. These selection controls do not start audio playback.</p><label>Target audio deck<select id="video-media-deck"><option value="0" ${initialIndex===0?'selected':''}>Deck 1 · left</option><option value="1" ${initialIndex===1?'selected':''}>Deck 2 · right</option></select></label><fieldset><legend>Local Media Crate</legend><label>Add local videos<input id="video-media-files" type="file" accept="video/*" multiple></label><div class="form-grid"><label><input id="video-media-enabled" type="checkbox"> Enable fallback on audio track load</label><label><input id="video-media-random" type="checkbox"> Random fallback selection</label></div><button id="video-media-next">Next fallback for selected deck</button><div id="video-media-assets" aria-label="Media Crate assets">Reading local assets…</div><p class="muted">Playing fallback loops and follows the audio clock under an independent policy. Clip completion does not advance the crate. A failed replacement keeps the currently decoded source.</p></fieldset><fieldset><legend>Associate with the loaded audio</legend><p id="video-media-loaded-track"></p><button id="video-media-associate">Add current video to crate and associate with loaded audio</button><button id="video-media-unassociate">Remove association from loaded audio</button><pre id="video-media-associations" aria-label="Video association metadata"></pre></fieldset><fieldset><legend>Automatic transition selection</legend><p>This selects the transition on track loads. It is separate from the main panel's Automatic mix fader movement.</p><label><input id="video-transition-enabled" type="checkbox"> Select a transition automatically on track load</label><label><input id="video-transition-random" type="checkbox"> Random transition selection</label><button id="video-transition-next">Select next transition now</button><p id="video-transition-selection" role="status"></p></fieldset><button id="video-media-refresh">Refresh status</button><p id="video-media-message" role="status">Reading mixer state…</p><pre id="video-media-diagnostics" aria-label="Media workflow diagnostics"></pre><p class="muted">Only metadata can survive reload; local media bytes require reimport. Native Syphon and exact reference processing order remain open. Current-version reference selection/clip-end parity is unverified.</p>`,providedRoot=>{
      const root=providedRoot||document,$=selector=>root.querySelector(selector),deck=$('#video-media-deck'),message=$('#video-media-message');
      let busy=false,statusGeneration=0,assets=[];
      const current=()=>generation===openGeneration,index=()=>Number(deck.value);
      const methods={'video-media-files':'addMedia','video-media-enabled':'configureMedia','video-media-random':'configureMedia','video-media-next':'nextMedia','video-media-associate':'associateVideo','video-media-unassociate':'removeVideoAssociation','video-transition-enabled':'configureTransitions','video-transition-random':'configureTransitions','video-transition-next':'nextTransition','video-media-refresh':'mediaDiagnostics'};
      function availability() {
        deck.disabled=busy;
        for(const [id,method] of Object.entries(methods))$('#'+id).disabled=busy||typeof videoMixer[method]!=='function';
        root.querySelectorAll('[data-video-media-remove]').forEach(button=>{button.disabled=busy||typeof videoMixer.removeMedia!=='function'||!assets.some(asset=>asset.id!=null&&String(asset.id)===button.dataset.videoMediaRemove);});
      }
      function syncMainTransition() {
        const select=document.querySelector('#video-transition');
        if(select&&typeof state.video?.transition==='string')select.value=state.video.transition;
      }
      async function status() {
        const request=++statusGeneration,selected=index();
        if(typeof videoMixer.mediaDiagnostics!=='function'){message.textContent='Media workflow integration is not available yet.';return;}
        const info=metadata(await videoMixer.mediaDiagnostics());
        if(!current()||request!==statusGeneration||selected!==index())return;
        $('#video-media-diagnostics').textContent=JSON.stringify(info??null,null,2);
        const media=info?.media??info??state.video?.media??{},transitions=info?.transitions??info?.transitionSelection??state.video?.transitions??state.video?.transitionSelection??{};
        $('#video-media-enabled').checked=media.enabled===true;$('#video-media-random').checked=media.random===true;
        $('#video-transition-enabled').checked=transitions.enabled===true;$('#video-transition-random').checked=transitions.random===true;
        $('#video-transition-selection').textContent='Selected transition: '+(transitions.selected??transitions.name??state.video?.transition??'not reported');
        assets=Array.isArray(info?.assets)?info.assets:Array.isArray(media.assets)?media.assets:Array.isArray(media.entries)?media.entries:[];
        $('#video-media-assets').innerHTML=assets.length?`<ul>${assets.map(asset=>{const warning=asset.warning??asset.error??(Array.isArray(asset.warnings)?asset.warnings.join('; '):'');return `<li><span>${esc(asset.name??asset.id??'Unnamed local video')}${warning?` · ${esc(warning)}`:''}</span> <button type="button" data-video-media-remove="${esc(asset.id)}" aria-label="Remove ${esc(asset.name??'video')} from Media Crate" ${asset.id==null?'disabled':''}>Remove from crate</button></li>`;}).join('')}</ul>`:'<p class="muted">No local videos are registered in this crate.</p>';
        const track=state.decks?.[selected]?.track;
        $('#video-media-loaded-track').textContent=track?`Loaded audio: ${track.title??track.name??track.id} · track ${track.id}`:'No loaded audio track reported on this deck.';
        $('#video-media-associations').textContent=JSON.stringify(info?.associations??media.associations??state.video?.associations??{},null,2);
        message.textContent='Current Media Crate and association metadata.';syncMainTransition();availability();
      }
      const action=(operation,save=false)=>async event=>{
        if(busy)return;busy=true;availability();
        try{await operation(event);if(save)persist();if(current())await status();}
        catch(error){if(current())message.textContent=error.message||String(error);notify(error.message||String(error));}
        finally{busy=false;if(current())availability();}
      };
      deck.onchange=()=>{statusGeneration++;status().catch(error=>{if(current())message.textContent=error.message;notify(error.message);});};
      $('#video-media-files').onchange=action(async event=>{
        const input=event.target,files=Array.from(input.files||[]);if(!files.length)return;
        message.textContent='Adding selected local videos…';
        try{await videoMixer.addMedia(files);}finally{input.value='';}
      });
      const configureMedia=action(()=>videoMixer.configureMedia({enabled:$('#video-media-enabled').checked,random:$('#video-media-random').checked}),true);
      $('#video-media-enabled').onchange=$('#video-media-random').onchange=configureMedia;
      const configureTransitions=action(()=>videoMixer.configureTransitions({enabled:$('#video-transition-enabled').checked,random:$('#video-transition-random').checked}),true);
      $('#video-transition-enabled').onchange=$('#video-transition-random').onchange=configureTransitions;
      $('#video-media-next').onclick=action(()=>videoMixer.nextMedia(index()));
      $('#video-media-associate').onclick=action(()=>videoMixer.associateVideo(index()));
      $('#video-media-unassociate').onclick=action(()=>videoMixer.removeVideoAssociation(index()));
      $('#video-transition-next').onclick=action(()=>videoMixer.nextTransition(),true);
      $('#video-media-refresh').onclick=action(async()=>{});
      const removeAsset=action(async event=>{
        const button=event.target.closest('[data-video-media-remove]');if(!button)return;
        const asset=assets.find(item=>String(item.id)===button.dataset.videoMediaRemove);
        if(asset?.id==null)return;await videoMixer.removeMedia(asset.id);$('#video-media-files').focus?.();
      });
      $('#video-media-assets').onclick=event=>{if(event.target.closest('[data-video-media-remove]'))return removeAsset(event);};
      availability();status().catch(error=>{if(current())message.textContent=error.message;notify(error.message);});
    });
  }
  return {open};
}
