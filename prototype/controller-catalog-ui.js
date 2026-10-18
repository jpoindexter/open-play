import {controllerSourceLabel,bindControllerProfile,controllerCatalogMaxBytes} from './controller-catalog.js';
export const controllerCatalogMarkup=`<section id="controller-catalog" aria-labelledby="controller-catalog-title">
  <h3 id="controller-catalog-title">Controller mapping catalog</h3>
  <p>Import a batch catalog made with the Serato XML adapter. Profiles stay local until you select an input and apply one. Factory-map recovery is still in progress.</p>
  <div class="form-grid">
    <label>Mapping source<select id="catalog-source-kind"><option value="user">User mapping</option><option value="alternative">Alternative mapping</option></select></label>
    <label>Alternative source name<input id="catalog-source-name" maxlength="160" placeholder="Author or project name"></label>
    <label>Catalog JSON<input id="catalog-file" type="file" accept=".json,application/json"></label>
    <label>Saved profile<select id="catalog-profile"><option value="">Loading saved profiles…</option></select></label>
    <label>Apply to MIDI input<select id="catalog-device"><option value="">Select a connected input</option></select></label>
  </div>
  <p id="catalog-status" role="status" aria-live="polite">Reading local catalogs…</p>
  <div id="catalog-profile-detail"></div>
  <div class="panel-controls"><button id="catalog-apply" disabled>Apply translated controls</button><button id="catalog-export" disabled>Export retained profile</button></div>
  <p class="muted">Existing assignments take priority. Unsupported controls, conditions and lighting remain in the retained profile; they are not activated. Source labels do not establish physical compatibility. Imported claims alone cannot earn the Official Serato label.</p>
</section>`;
export function mountControllerCatalog({root,store,state,persist,inputs,esc,download,onApplied,notify}){
  let profiles=[],busy=false;const $=id=>root.querySelector('#'+id),status=text=>{$('catalog-status').textContent=text;};
  const selected=()=>profiles.find(p=>p.id===$('catalog-profile').value);
  const device=()=>inputs().find(d=>d.id===$('catalog-device').value&&d.state==='connected');
  function details(){
    const p=selected();$('catalog-apply').disabled=busy||!p?.mappings.length||!device();$('catalog-export').disabled=busy||!p;
    $('catalog-profile-detail').innerHTML=p?`<p><strong>${esc(controllerSourceLabel(p))}</strong> · ${p.controls.length} source controls · ${p.mappings.length} translated assignments · ${p.issues.length} unresolved items · physical compatibility unverified</p><details><summary>Unresolved controls and output behavior</summary><pre>${esc(JSON.stringify(p.issues.slice(0,100),null,2))}</pre>${p.issues.length>100?'<p>Showing the first100items. Export the retained profile for the complete list.</p>':''}</details>`:'';
  }
  function devices(){const previous=$('catalog-device').value;$('catalog-device').innerHTML='<option value="">Select a connected input</option>'+inputs().filter(d=>d.state==='connected').map(d=>`<option value="${esc(d.id)}">${esc(d.name)}</option>`).join('');$('catalog-device').value=previous;}
  async function refresh(preferred){profiles=await store.profiles();if(!root.isConnected)return;const old=preferred||$('catalog-profile').value;$('catalog-profile').innerHTML='<option value="">Select a saved profile</option>'+profiles.map(p=>`<option value="${p.id}">${esc(p.name)} · ${esc(controllerSourceLabel(p))}</option>`).join('');$('catalog-profile').value=old;devices();details();}
  $('catalog-profile').onchange=details;$('catalog-device').onchange=details;
  $('catalog-source-kind').onchange=()=>{$('catalog-source-name').disabled=$('catalog-source-kind').value!=='alternative';};$('catalog-source-kind').onchange();
  $('catalog-file').onchange=async()=>{
    if(busy)return;const file=$('catalog-file').files[0];if(!file)return;busy=true;status('Importing catalog…');details();
    try{
      if(file.size>controllerCatalogMaxBytes)throw Error('Catalog exceeds32MiB. Split it into smaller batches.');
      const result=await store.importText(await file.text(),{kind:$('catalog-source-kind').value,name:$('catalog-source-name').value});
      await refresh(result.record.catalog.profiles[0]?.id);status(`${result.duplicate?'Already retained':'Imported'} ${result.record.catalog.profiles.length} profile(s). No controls applied yet.`);
    }catch(error){status(`Catalog not imported: ${error.message}`);}finally{busy=false;$('catalog-file').value='';details();}
  };
  $('catalog-apply').onclick=()=>{
    try{
      const p=selected();if(!p)throw Error('Select a retained profile.');
      const result=bindControllerProfile(p,device(),state.mappings),previous=state.mappings;
      state.mappings=result.mappings;
      try{if(persist()===false)throw Error('Mapping storage failed; earlier assignments were restored.');}catch(error){state.mappings=previous;throw error;}
      const message=`Added ${result.added.length} controls; kept ${result.conflicts.length} conflicting assignments unchanged. ${p.issues.length} unresolved items retained. Physical response unverified.`;
      notify(message);onApplied();
    }catch(error){status(error.message);}
  };
  $('catalog-export').onclick=()=>{const p=selected();if(p)download('open-play-controller-profile.json',JSON.stringify({format:'open-play-controller-catalog-v1',profiles:[p]},null,2));};
  refresh().then(()=>{if(root.isConnected)status(`${profiles.length} saved profile(s). Choose a profile and connected input.`);}).catch(error=>{if(root.isConnected)status(error.message);});
  return {updateInputs(){if(root.isConnected){devices();details();}}};
}
