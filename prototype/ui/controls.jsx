// Progressive React islands over the existing shell/library control handlers.
// Backing controls retain IDs/state because the player owns their references.
import React, {useLayoutEffect, useRef} from 'react';
import {createRoot} from 'react-dom/client';
import {createPortal} from 'react-dom';
import {Button} from '@astryxdesign/core/Button';
import {ToggleButton} from '@astryxdesign/core/ToggleButton';
import {Selector} from '@astryxdesign/core/Selector';
import {TextInput} from '@astryxdesign/core/TextInput';
import {CheckboxInput} from '@astryxdesign/core/CheckboxInput';
import {NumberInput} from '@astryxdesign/core/NumberInput';
import {Slider} from '@astryxdesign/core/Slider';
import {TextArea} from '@astryxdesign/core/TextArea';
import {Dialog} from '@astryxdesign/core/Dialog';
import {Theme} from '@astryxdesign/core/theme';
import {neutralTheme} from '@astryxdesign/theme-neutral/built';
import '@astryxdesign/core/astryx.css';
import '@astryxdesign/theme-neutral/theme.css';

const scope='.workspace-bar,.hybrid-controls,.toolbar,.review-bar,.library-tools,.crate-tools,.library-footer';
const records=new Map();let root,changes,scheduled=false,signature='',serial=0,invalidFocus=false;
let modal,dialogContent;
function DialogSurface(){
 const slot=useRef(null);
 useLayoutEffect(()=>{for(const child of dialogContent)slot.current.append(child);},[]);
 return <Dialog isOpen isInline onOpenChange={()=>{}} className="op-dialog-surface" padding={0}><div ref={slot}/></Dialog>;
}
function update(node,value){
 if(node.type==='checkbox')node.checked=value;else node.value=value??'';
 for(const type of ['input','change'])node.dispatchEvent(new Event(type,{bubbles:true}));
 const record=records.get(node);if(record?.error&&node.validity.valid)record.error='';
 schedule();
}
function nameOf(node){
 const label=(node.id&&document.querySelector(`label[for="${node.id}"]`))||node.closest('label');
 const copy=label?.cloneNode(true);copy?.querySelectorAll('input,select,textarea,button,output').forEach(child=>child.remove());
 return node.getAttribute('aria-label')||copy?.textContent.trim()||node.placeholder||node.textContent.trim()||node.name||node.id||'Setting';
}
function activate(node,event){
 event?.stopPropagation();
 if(node.disabled||node.hidden)return;
 node.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,shiftKey:event?.shiftKey,ctrlKey:event?.ctrlKey,metaKey:event?.metaKey,altKey:event?.altKey,detail:event?.detail||1}));
 schedule();
}
function component({node,name,form,error}){
 const common={label:name,size:'sm',isDisabled:node.disabled,status:error?{type:'error',message:error}:undefined,'aria-describedby':node.getAttribute('aria-describedby')||undefined};
 const field={...common,isLabelHidden:!form,isReadOnly:node.readOnly,isRequired:node.required};
 if(node.type==='checkbox')return <CheckboxInput {...common} value={node.indeterminate?'indeterminate':node.checked} className="op-dialog-check" onChange={value=>update(node,value)}/>;
 if(node.type==='number')return <NumberInput {...field} value={node.value===''?null:Number(node.value)} min={node.min===''?undefined:Number(node.min)} max={node.max===''?undefined:Number(node.max)} step={node.step==='any'?null:node.step===''?1:Number(node.step)} hasNumberSteppers containerClassName="op-dialog-field" onChange={value=>update(node,value)}/>;
 if(node.type==='range')return <Slider {...common} value={Number(node.value)} min={Number(node.min)||0} max={node.max===''?100:Number(node.max)} step={node.step==='any'?.01:Number(node.step)||1} valueDisplay="text" className="op-dialog-field" onChange={value=>update(node,value)}/>;
 if(node.tagName==='TEXTAREA')return <TextArea {...field} value={node.value} containerClassName="op-dialog-field" onChange={value=>update(node,value)}/>;
 if(node.tagName==='SELECT')return <Selector {...common} isLabelHidden={!form} variant="secondary" presentation="popover" value={node.value} options={[...node.options].map(o=>({value:o.value,label:o.textContent,disabled:o.disabled}))} width="auto" className={form?"op-standard-field op-dialog-field":"op-standard-field"} onChange={value=>update(node,value)}/>;
 if(node.tagName==='INPUT')return <TextInput {...field} type={node.type} autoComplete={node.autocomplete} maxLength={node.maxLength>0?node.maxLength:undefined} minLength={node.minLength>0?node.minLength:undefined} pattern={node.pattern||undefined} value={node.value} placeholder={node.placeholder} hasClear containerClassName={form?"op-standard-field op-dialog-field":"op-standard-field"} controlClassName="op-standard-text" onChange={value=>update(node,value)}/>;
 const props={...common,className:'op-standard '+node.className,title:node.title,'aria-pressed':node.getAttribute('aria-pressed')||undefined,children:node.textContent.trim()};
 return node.hasAttribute('aria-pressed')?<ToggleButton {...props} isPressed={node.getAttribute('aria-pressed')==='true'} onPressedChange={(_,event)=>activate(node,event)}/>:<Button {...props} variant="secondary" onClick={event=>activate(node,event)}/>;
}
function refresh(){
 scheduled=false;
 for(const [node,record]of records)if(!record.host.isConnected){records.delete(node);}
 const candidates=[...document.querySelectorAll(scope)].flatMap(region=>[...region.querySelectorAll('button,select')]);
 candidates.push(...document.querySelectorAll('#search,#crate-search,#modal button,#modal select,#modal textarea,#modal input:not([type=file]):not([type=color]):not([type=radio]):not([type=hidden])'));
 for(const node of candidates){
  if(records.has(node)||node.hidden||node.closest('.astryx-host')||node.closest('#decks,#mixer,.rb-mixer-band,.detail-waves'))continue;
  const host=document.createElement('span'),mount=document.createElement('span');
  host.className='astryx-host';host.dataset.astryxFor=node.id||node.dataset.workspaceChoice||node.dataset.panel||node.textContent.trim();
  host.dataset.controlType=node.tagName.toLowerCase();mount.className='astryx-mount';
  const name=nameOf(node),form=!!node.closest('#modal'),label=form?node.closest('label'):null;
  // Preserve original form nodes/listeners and hide their entire label; the
  // Astryx field supplies one visible, programmatically associated label.
  const backing=label&&label.querySelectorAll('input,select,textarea').length===1?label:node;
  backing.before(host);host.append(backing,mount);
  if(backing!==node)backing.dataset.astryxBacking='true';
  if(form)host.classList.add('astryx-form-host');
  node.dataset.astryxBacking='true';node.setAttribute('aria-hidden','true');node.tabIndex=-1;
  records.set(node,{node,host,mount,name,form,key:++serial});
  if(form)node.addEventListener('invalid',event=>{
   event.preventDefault();records.get(node).error=node.validationMessage;schedule();
   if(!invalidFocus){invalidFocus=true;requestAnimationFrame(()=>{invalidFocus=false;mount.querySelector('input,textarea,button,[role=slider]')?.focus();});}
  });
  changes.observe(node,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-pressed','disabled','hidden','title','class','value','selected']});
 }
 const next=JSON.stringify([...records].map(([node,record])=>[record.error,node.textContent,node.value,node.checked,node.indeterminate,node.disabled,node.hidden,node.title,node.className,node.getAttribute('aria-pressed')]))+document.body.classList.contains('day');
 if(next===signature)return;signature=next;
 for(const {node,host}of records.values())host.hidden=node.hidden;
 root.render(<Theme theme={neutralTheme} mode={document.body.classList.contains('day')?'light':'dark'}><div onKeyDown={event=>event.stopPropagation()}>{[...records.values()].map(record=>createPortal(component(record),record.mount,record.key))}{createPortal(<DialogSurface/>,modal,'dialog-surface')}</div></Theme>);
 document.body.dataset.astryxControls=String(records.size);
}
function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(refresh);}}
export function installAstryxControls(){
 modal=document.querySelector('#modal');dialogContent=[...modal.childNodes];
 modal.setAttribute('aria-labelledby','modal-title');
 const container=document.createElement('div');container.id='astryx-react-root';document.body.append(container);root=createRoot(container);
 // Do not subscribe React to the player's 60Hz timer/meter/waveform mutations.
 changes=new MutationObserver(schedule);changes.observe(document.body,{attributes:true,attributeFilter:['class']});
 const forms=new MutationObserver(schedule);forms.observe(modal,{subtree:true,childList:true,attributes:true,attributeFilter:['open','disabled','hidden','checked','value']});
 for(const type of ['click','input','change'])document.addEventListener(type,schedule);
 document.addEventListener('keydown',event=>{if((event.metaKey||event.ctrlKey)&&!event.shiftKey&&event.key.toLowerCase()==='f'&&!document.querySelector('#modal').open){const field=document.querySelector('[data-astryx-for="search"] input:not([data-astryx-backing])');if(field){event.preventDefault();event.stopImmediatePropagation();field.focus();}}},true);
 refresh();
}
