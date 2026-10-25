export function createSessionPanels({state:s,$,$$,esc,head,badge,trackById,load,download,dialog,refresh,persist,renderTracks}) {
  s.historySessions??=[];
  let selectedSession='';
  const changed=crate=>{persist();refresh();if(s.crate===crate)renderTracks();};
  const displayTime=value=>Number.isNaN(new Date(value).getTime())?value:new Date(value).toLocaleString();
  function prepare() {
    $('#panel').innerHTML=head('Prepare','REAL SESSION LIST',true)+
      `<div class="panel-controls"><button id="prepare-add">Add selected</button><button id="prepare-clear">Clear Prepare</button></div><div class="log">${s.prepare.map(id=>`<button data-prepare-load="${esc(id)}">${esc(trackById(id)?.title||id)}</button>`).join(' ')||'Prepare is empty. Add a library track before auditioning.'}</div>`;
    $('#prepare-add').onclick=()=>{
      if(!trackById(s.selected)||s.prepare.includes(s.selected))return;
      s.prepare.push(s.selected);changed('prepare');
    };
    $('#prepare-clear').onclick=()=>{s.prepare=[];changed('prepare');};
    $$('[data-prepare-load]').forEach(button=>button.onclick=()=>load(s.focus,button.dataset.prepareLoad));
  }
  function history() {
    const past=selectedSession===''?null:s.historySessions[Number(selectedSession)];
    const entries=past?.entries||s.history;
    $('#panel').innerHTML=head('History','REAL SAVED PLAY HISTORY',true)+
      `<div class="panel-controls"><label>Session <select id="history-session" aria-label="History session"><option value="">Current session</option>${s.historySessions.map((session,index)=>`<option value="${index}" ${selectedSession===String(index)?'selected':''}>Session ${index+1} · ${esc(displayTime(session.time))}</option>`).join('')}</select></label><button id="history-export">Export CSV</button><button id="history-insert" ${past?'disabled':''}>Insert selected track</button><button id="history-clear" ${past||!s.history.length?'disabled':''}>New session</button><button id="history-share">Live playlist</button></div><div class="log">${entries.map((event,index)=>`${index+1}. ${esc(event.title)} · deck ${event.deck} · ${esc(displayTime(event.time))} ${event.inserted?'(inserted)':''}`).join('<br>')||'No tracks played in this session.'}</div>`;
    $('#history-session').onchange=()=>{selectedSession=$('#history-session').value;refresh();};
    $('#history-export').onclick=()=>{
      const cell=value=>'"'+String(value).replaceAll('"','""')+'"';
      download('open-play-history.csv','title,deck,time\n'+entries.map(event=>[event.title,event.deck,event.time].map(cell).join(',')).join('\n'),'text/csv');
    };
    $('#history-insert').onclick=()=>{
      const track=trackById(s.selected);if(past||!track)return;
      s.history.push({id:track.id,title:track.title,deck:s.focus+1,time:new Date().toISOString(),inserted:true});
      changed('history');
    };
    $('#history-clear').onclick=()=>{
      if(past||!s.history.length)return;
      s.historySessions.push({time:new Date().toISOString(),entries:s.history});
      s.history=[];selectedSession='';changed('history');
    };
    $('#history-share').onclick=()=>dialog('Live playlist',`${badge('SHARING SIMULATION')}<p>Publishing requires an optional service and an explicit user action. This prototype has no backend and publishes nothing.</p><label>Session title <input value="Open Play session"></label><p class="muted">Native/service acceptance: explicit opt-in, connection recovery, correct currently playing metadata, privacy and export.</p>`);
  }
  return {prepare,history};
}
