// Progressive React islands over the existing shell/library control handlers.
// Backing controls retain IDs/state because the player owns their references.
import React from 'react';
import {createRoot} from 'react-dom/client';
import {createPortal} from 'react-dom';
import {Button} from '@astryxdesign/core/Button';
import {ToggleButton} from '@astryxdesign/core/ToggleButton';
import {Selector} from '@astryxdesign/core/Selector';
import {TextInput} from '@astryxdesign/core/TextInput';
import {Theme} from '@astryxdesign/core/theme';
import {neutralTheme} from '@astryxdesign/theme-neutral/built';
import '@astryxdesign/core/astryx.css';
import '@astryxdesign/theme-neutral/theme.css';

const scope='.workspace-bar,.hybrid-controls,.toolbar,.review-bar,.library-tools,.crate-tools,.library-footer';
const records=new Map();let root,changes,scheduled=false,signature='';
function nameOf(node){
 const label=node.id&&document.querySelector(`label[for="${node.id}"]`);
 return node.getAttribute('aria-label')||label?.firstChild?.textContent.trim()||node.placeholder||node.textContent.trim();
}
function activate(node,event){
 event?.stopPropagation();
 if(node.disabled||node.hidden)return;
 node.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,shiftKey:event?.shiftKey,ctrlKey:event?.ctrlKey,metaKey:event?.metaKey,altKey:event?.altKey,detail:event?.detail||1}));
 schedule();
}
function component({node,name}){
 const common={label:name,size:'sm',isDisabled:node.disabled};
 if(node.tagName==='SELECT')return <Selector {...common} isLabelHidden variant="secondary" presentation="popover" value={node.value} options={[...node.options].map(o=>({value:o.value,label:o.textContent,disabled:o.disabled}))} width="auto" className="op-standard-field" onChange={value=>{node.value=value;node.dispatchEvent(new Event('change',{bubbles:true}));schedule();}}/>;
 if(node.tagName==='INPUT')return <TextInput {...common} isLabelHidden type={node.type==='search'?'search':'text'} value={node.value} placeholder={node.placeholder} hasClear containerClassName="op-standard-field" controlClassName="op-standard-text" onChange={value=>{node.value=value;node.dispatchEvent(new Event('input',{bubbles:true}));schedule();}}/>;
 const props={...common,className:'op-standard '+node.className,title:node.title,'aria-pressed':node.getAttribute('aria-pressed')||undefined,children:node.textContent.trim()};
 return node.hasAttribute('aria-pressed')?<ToggleButton {...props} isPressed={node.getAttribute('aria-pressed')==='true'} onPressedChange={(_,event)=>activate(node,event)}/>:<Button {...props} variant="secondary" onClick={event=>activate(node,event)}/>;
}
function refresh(){
 scheduled=false;
 for(const [node,record]of records)if(!record.host.isConnected){records.delete(node);}
 const candidates=[...document.querySelectorAll(scope)].flatMap(region=>[...region.querySelectorAll('button,select')]);
 candidates.push(...document.querySelectorAll('#search,#crate-search'));
 for(const node of candidates){
  if(records.has(node)||node.hidden||node.closest('.astryx-host')||node.closest('#decks,#mixer,.rb-mixer-band,.detail-waves'))continue;
  const host=document.createElement('span'),mount=document.createElement('span');
  host.className='astryx-host';host.dataset.astryxFor=node.id||node.dataset.workspaceChoice||node.dataset.panel||node.textContent.trim();
  host.dataset.controlType=node.tagName.toLowerCase();mount.className='astryx-mount';
  const name=nameOf(node);node.before(host);host.append(node,mount);
  node.dataset.astryxBacking='true';node.setAttribute('aria-hidden','true');node.tabIndex=-1;
  records.set(node,{node,host,mount,name});
  changes.observe(node,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-pressed','disabled','hidden','title','class','value','selected']});
 }
 const next=JSON.stringify([...records].map(([node])=>[node.textContent,node.value,node.disabled,node.hidden,node.title,node.className,node.getAttribute('aria-pressed')]))+document.body.classList.contains('day');
 if(next===signature)return;signature=next;
 for(const {node,host}of records.values())host.hidden=node.hidden;
 root.render(<Theme theme={neutralTheme} mode={document.body.classList.contains('day')?'light':'dark'}><div onKeyDown={event=>event.stopPropagation()}>{[...records.values()].map(record=>createPortal(component(record),record.mount,record.host.dataset.astryxFor))}</div></Theme>);
 document.body.dataset.astryxControls=String(records.size);
}
function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(refresh);}}
export function installAstryxControls(){
 const container=document.createElement('div');container.id='astryx-react-root';document.body.append(container);root=createRoot(container);
 // Do not subscribe React to the player's 60Hz timer/meter/waveform mutations.
 changes=new MutationObserver(schedule);changes.observe(document.body,{attributes:true,attributeFilter:['class']});
 for(const type of ['click','input','change'])document.addEventListener(type,schedule);
 document.addEventListener('keydown',event=>{if((event.metaKey||event.ctrlKey)&&!event.shiftKey&&event.key.toLowerCase()==='f'&&!document.querySelector('#modal').open){const field=document.querySelector('[data-astryx-for="search"] input:not([data-astryx-backing])');if(field){event.preventDefault();event.stopImmediatePropagation();field.focus();}}},true);
 refresh();
}
