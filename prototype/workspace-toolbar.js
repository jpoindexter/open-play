// Rehome the existing controls; the player keeps their handlers and state.
import {uiIcons} from './vendor/astryx/icons.js';
export function installWorkspaceToolbar(){
 const $=selector=>document.querySelector(selector),toolbar=$('.toolbar'),modal=$('#modal');
 const display=$('.hybrid-controls'),parking=document.createElement('div');
 parking.id='workspace-settings-parking';document.body.append(parking);
 const outer=node=>node?.closest('.astryx-host')||node;
 const move=(node,parent)=>{if(node)parent.append(outer(node));};
 const icon=(node,name,label,only=true)=>{
  node.dataset.icon=name;node.dataset.iconOnly=String(only);
  node.setAttribute('aria-label',label);node.title=label;return node;
 };
 const settings=$('.toolbar [data-panel="settings"]');
 const view=icon(document.createElement('button'),'layout','Layout and display settings');
 view.type='button';view.dataset.panel='layouts';view.textContent='View';
 const mixer=$('#preview-mixer-toggle'),library=$('#preview-library-focus'),zoom=$('.preview-zoom');
 icon(mixer,'mixer','Show or hide mixer');icon(library,'library','Focus music library');
 const decks=$('#deck-count');
 outer(decks).after(view,outer(mixer),outer(library));
 // Keep one shared zoom control instead of a separate waveform toolbar row.
 toolbar.append(zoom);
 icon($('.toolbar [data-panel="recording"]'),'record','Recording',false);
 icon($('.toolbar [data-panel="fx"]'),'effects','Effects',false);
 icon($('.toolbar [data-panel="hardware"]'),'audio','Audio devices and routing');
 icon($('.toolbar [data-panel="help"]'),'help','Help');
 icon(settings,'settings','Settings');
 const more=$('.preview-more'),summary=more.querySelector('summary');
 summary.innerHTML=uiIcons.more;summary.title='Performance panels';summary.setAttribute('aria-label','Performance panels');
 for(const [selector,name,label,only]of [
  ['#new-crate','folder','New crate',false],['#new-smart','smart','New smart crate',false],
  ['#import','import','Import audio from disk',false],['#art-grid','grid','Artwork grid',true],
  ['.library-tools [data-panel=analysis]','settings','Analysis settings',true],['#modal-close','close','Close dialog',true],
  ['#preview-zoom-in','plus','Zoom detailed waveforms in',true],['#preview-zoom-out','minus','Zoom detailed waveforms out',true]
 ]){const node=$(selector);icon(node,name,label,only);if(!only)node.textContent=node.textContent.replace(/^[＋+]\s*/,'');}
 more.addEventListener('toggle',()=>summary.setAttribute('aria-expanded',String(more.open)));
 const day=$('#day');day.textContent='Day / night';day.setAttribute('aria-label','Switch day or night theme');
 const reset=$('#preview-reset');reset.textContent='Reset display';
 move(day,display);display.querySelector('.display-hint')?.remove();
 const link=$('.toolbar [data-panel="link"]'),midi=$('.toolbar [data-panel="midi"]');
 link.textContent='Link session';midi.textContent='Mapping editor';
 const diagnostics=document.createElement('div');diagnostics.className='workspace-diagnostics';
 const coverage=$('[data-panel="coverage"]');coverage.textContent='Feature status';
 move(coverage,diagnostics);move($('#audio-status'),diagnostics);
 const system=document.createElement('button');system.dataset.panel='system';system.textContent='Diagnostics and storage';
 diagnostics.prepend(system);
 const groups={Layouts:[display],Audio:[link],MIDI:[midi],Advanced:[diagnostics]};
 const focus=node=>(outer(node)?.querySelector('.astryx-mount button')||node)?.focus({preventScroll:true});
 const park=()=>{for(const nodes of Object.values(groups))for(const node of nodes)move(node,parking);};
 park();
 $('.review-bar')?.remove();
 toolbar.classList.add('performance-toolbar');
 document.body.dataset.performanceToolbar='unified';
 let returnToSettings=false,opener=null;
 const back=document.createElement('button');back.id='settings-back';back.type='button';back.hidden=true;
 back.textContent='Back';icon(back,'back','Back to Settings',false);$('.dialog-title').prepend(back);
 back.onclick=()=>settings.click();
 window.openPlay.workspaceSettings={
  beforeDialog(title){
   if(!modal.open){returnToSettings=false;opener=document.activeElement;}
   else if($('#modal-title').textContent==='Setup'&&title!=='Setup')returnToSettings=true;
   if(title==='Setup')returnToSettings=false;
   park();back.hidden=!returnToSettings;
  },
  mount(body,tab){
   const destination=tab==='Layouts'?body.querySelector('[data-workspace-display]'):
    tab==='Advanced'?body.querySelector('[data-workspace-diagnostics]'):body.querySelector('.form-actions');
   for(const node of groups[tab]||[])move(node,destination);
   if(tab==='MIDI')body.querySelector('#open-mapping')?.remove();
   if(tab==='Layouts')body.querySelector('#reset-settings').textContent='Reset workspace style';
   body.querySelectorAll('[data-settings-tab]').forEach(button=>{
    if(button.dataset.settingsTab===tab)button.setAttribute('aria-current','page');
    else button.removeAttribute('aria-current');
   });
  }
 };
 modal.addEventListener('close',()=>{park();back.hidden=true;focus(opener?.isConnected?opener:settings);});
}
