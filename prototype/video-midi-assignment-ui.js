/** Native controls remain native. Capture only during explicit Video assignment;
 * normal pointer/key/input actions never reach their handlers in that mode. */
export function createVideoMIDIAssignmentUI({assignment,notify=()=>{},onExit=()=>{},document=globalThis.document,window=globalThis.window}) {
  let lastPointer=null,trigger=null,owner=null;
  const mode=()=>assignment.snapshot();
  const isToolbar=node=>node.closest?.('[data-video-midi-mode],[data-video-midi-encoding]');
  const scope=node=>!!(node.closest?.('#panel')&&document.querySelector('#panel [data-video-midi-mode]')||node.closest?.('#modal-body')&&document.querySelector('#modal')?.open&&document.querySelector('#modal-body [data-video-midi-mode]'));
  const target=node=>node.closest?.('[data-video-midi-target]');
  const suppress=event=>{event.preventDefault();event.stopImmediatePropagation();};
  const safe=fn=>{try{fn();}catch(error){notify(error.message);sync();}};
  function sync() {
    const s=mode();document.body.classList.toggle('video-midi-assigning',s.active);
    for(const button of document.querySelectorAll('[data-video-midi-mode]')){button.textContent=s.active?'Exit MIDI assign':'Assign MIDI';button.setAttribute('aria-pressed',String(s.active));}
    for(const status of document.querySelectorAll('[data-video-midi-status]'))status.textContent=s.reason;
    for(const select of document.querySelectorAll('[data-video-midi-encoding]'))select.value=s.encoding;
    for(const label of document.querySelectorAll('[data-video-midi-encoding-label]'))label.hidden=!s.active;
    for(const node of document.querySelectorAll('[data-video-midi-target]'))node.classList.toggle('video-midi-selected',s.active&&node.dataset.videoMidiTarget===s.target);
  }
  function cancel(reason,restore=false){if(mode().active){assignment.cancel(reason);lastPointer=null;owner=null;onExit();if(restore&&trigger?.isConnected)trigger.focus();}}
  function choose(node){const control=target(node);if(control){assignment.choose(control.dataset.videoMidiTarget);control.focus?.();}else notify('Exit MIDI assignment to edit this control.');}
  document.addEventListener('pointerdown',event=>{
    if(!mode().active||isToolbar(event.target)||event.target.closest?.('#modal-close,#close-panel'))return;
    if(scope(event.target)){suppress(event);lastPointer=target(event.target);safe(()=>choose(event.target));}
  },true);
  document.addEventListener('click',event=>{
    const node=event.target,button=node.closest?.('[data-video-midi-mode]');
    if(button){suppress(event);trigger=button;safe(()=>{if(mode().active)cancel('MIDI assignment exited.');else{owner=button.closest('#modal-body')?'modal':'panel';assignment.start();}});return;}
    if(node.closest?.('#modal-close,#close-panel')){cancel('MIDI assignment cancelled when the view closed.');return;}
    if(!mode().active||isToolbar(node))return;
    if(scope(node)){suppress(event);const control=target(node);if(!lastPointer||lastPointer!==control)safe(()=>choose(node));lastPointer=null;}
  },true);
  for(const type of ['input','change'])document.addEventListener(type,event=>{
    if(event.target.matches?.('[data-video-midi-encoding]')){safe(()=>assignment.setEncoding(event.target.value));return;}
    if(mode().active&&scope(event.target)){suppress(event);}
  },true);
  document.addEventListener('keydown',event=>{
    if(!mode().active)return;
    if(event.key==='Escape'){suppress(event);cancel('MIDI assignment cancelled with Escape.',true);return;}
    if(isToolbar(event.target)||event.key==='Tab')return;
    if(scope(event.target)&&['Enter',' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown'].includes(event.key)){
      suppress(event);if(event.repeat)return;
      safe(()=>{const control=target(event.target);if(event.key==='Enter'&&mode().target&&(!control||control.dataset.videoMidiTarget===mode().target))assignment.unassign();else choose(event.target);});
    }
  },true);
  // HTMLDialogElement.close queues this event. A later panel assignment or a
  // newly opened dialog must not be cancelled by the previous dialog's event.
  document.querySelector('#modal')?.addEventListener('close',()=>{
    if(owner==='modal'&&!document.querySelector('#modal')?.open)
      cancel('MIDI assignment cancelled when the dialog closed.');
  });
  window.addEventListener('blur',()=>cancel('MIDI assignment cancelled after focus loss.'));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel('MIDI assignment cancelled when hidden.');});
  function markup(){return '<div class="panel-controls video-midi-assignment"><button type="button" data-video-midi-mode aria-pressed="false">Assign MIDI</button><label data-video-midi-encoding-label hidden>Assignment encoding<select data-video-midi-encoding><option>7-bit absolute</option><option>14-bit absolute</option><option>Relative two’s complement</option><option>Relative offset</option></select></label><p data-video-midi-status role="status" aria-live="polite">Assignment is off.</p></div>';}
  return {markup,sync,cancel};
}
