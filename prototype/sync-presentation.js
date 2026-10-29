import {beatPosition} from './smart-sync.js';
export const syncButtonLabel=(smart,status)=>!smart?'SIMPLE SYNC':status==='tempo'?'TEMPO SYNC':status==='armed'?'SYNC ARMED':'BEAT SYNC';
const attribute=(node,name,value)=>{if(node.getAttribute(name)!==value)node.setAttribute(name,value);};

// Frame refreshes preserve controls and avoid notifying observers for unchanged state.
export function refreshSyncPresentation(d,{smart,hasGrid,position,pending,master,manual},root=document){
 const indicator=root.querySelector(`[data-beat-position="${d.index}"]`);
 if(indicator){
  const status=hasGrid?d.syncState||'off':'No beatgrid',phase=beatPosition(d.track,position),beat=phase===null?-1:Math.floor(phase),label=indicator.querySelector('[data-smart-status]');
  if(label.textContent!==status)label.textContent=status;
  attribute(indicator,'data-state',status);
  attribute(indicator,'aria-label',`Deck ${d.index+1}: ${status}${beat>=0?', beat '+(beat+1)+' of 4':''}`);
  indicator.querySelectorAll('[data-beat]').forEach(dot=>dot.classList.toggle('lit',Number(dot.dataset.beat)===beat));
 }
 const status=smart?d.syncState||'off':d.sync?'beat':'off',sync=root.querySelector(`[data-action="sync"][data-deck="${d.index}"]`);
 if(sync){
  const text=syncButtonLabel(smart,status);if(sync.textContent!==text)sync.textContent=text;
  attribute(sync,'data-sync-state',status);attribute(sync,'aria-busy',String(!!pending));
  sync.classList.toggle('active',!!d.sync);attribute(sync,'aria-pressed',String(!!d.sync));
  const disabled=smart&&!hasGrid;if(sync.disabled!==disabled)sync.disabled=disabled;
  attribute(sync,'title',disabled?'Add or analyze a beatgrid first':sync.dataset.syncHint+' '+(d.sync?d.syncRole==='primary'?'Primary':'Secondary':'Not synced')+'; press again to re-sync');
 }
 const off=root.querySelector(`[data-action="syncOff"][data-deck="${d.index}"]`),disabled=!(d.sync||status==='relative'||pending);
 if(off&&off.disabled!==disabled)off.disabled=disabled;
 const primary=root.querySelector(`[data-action="syncMaster"][data-deck="${d.index}"]`);
 if(primary){
  primary.classList.toggle('master-active',master);attribute(primary,'aria-pressed',String(master));
  attribute(primary,'title',`${master?(manual?'Selected master':'Automatic master: first playing deck'):'Match incoming tracks to this deck'} · Shift-click: automatic master`);
 }
}
