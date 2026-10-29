import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const toolbar=readFileSync(new URL('./workspace-toolbar.js',import.meta.url),'utf8');
const layout=readFileSync(new URL('./layout-preview.js',import.meta.url),'utf8');
test('header orientation shortcut uses the existing owner and stays synced through Settings and reset',()=>{
 const select=Object.assign(new EventTarget(),{value:'horizontal'}),body={dataset:{workspace:'rekordbox',previewShell:'flat',orientation:'horizontal'}},display={orientation:'horizontal'},attributes=new Map(),siblings=[];
 const button={dataset:{},setAttribute:(name,value)=>attributes.set(name,value)},view={},mixer={},library={},decks={after:(...nodes)=>siblings.push(...nodes)};
 let sync,changes=0;
 const document={body,createElement:()=>button},$=selector=>selector==='#preview-orientation'?select:null;
 const applyDisplay=()=>{body.dataset.orientation=(body.dataset.previewShell==='flat'||body.dataset.workspace==='hybrid')&&display.orientation==='vertical'?'vertical':'horizontal';select.value=display.orientation;sync?.();};
 new Function('$','display','applyDisplay',layout.match(/^\$\('#preview-orientation'\)\.onchange=.*$/m)[0])($,display,applyDisplay);
 select.addEventListener('change',event=>{changes++;select.onchange(event);});
 class MutationObserver{constructor(callback){sync=callback;}observe(target,options){assert.equal(target,body);assert.deepEqual(options.attributeFilter,['data-orientation','data-workspace','data-preview-shell']);}}
 const icon=(node,name,label)=>{node.dataset.icon=name;node.setAttribute('aria-label',label);return node;};
 const block=toolbar.slice(toolbar.indexOf(" const orientation=$('#preview-orientation')"),toolbar.indexOf(' // Keep one shared zoom'));
 new Function('$','document','icon','MutationObserver','Event','outer','decks','view','mixer','library',block)($,document,icon,MutationObserver,Event,node=>node,decks,view,mixer,library);
 assert.deepEqual(siblings,[button,view,mixer,library]);assert.equal(attributes.get('aria-label'),'Vertical waveforms');assert.equal(attributes.get('aria-pressed'),'false');
 button.onclick();assert.equal(changes,1);assert.equal(display.orientation,'vertical');assert.equal(attributes.get('aria-pressed'),'true');assert.match(button.title,/Vertical waveforms; switch to horizontal/);
 select.value='horizontal';select.dispatchEvent(new Event('change'));assert.equal(changes,2);assert.equal(attributes.get('aria-pressed'),'false');
 display.orientation='vertical';applyDisplay();assert.equal(changes,2);assert.equal(attributes.get('aria-pressed'),'true');assert.equal(attributes.get('aria-label'),'Vertical waveforms');
 body.dataset.workspace='serato';body.dataset.previewShell='legacy';applyDisplay();
 assert.equal(select.value,'vertical');assert.equal(body.dataset.orientation,'horizontal');assert.equal(attributes.get('aria-pressed'),'false');assert.equal(button.disabled,true);assert.match(button.title,/fixed in this workspace/);
 button.onclick();assert.equal(changes,2);assert.equal(select.value,'vertical');
 body.dataset.workspace='hybrid';applyDisplay();assert.equal(button.disabled,false);assert.equal(attributes.get('aria-pressed'),'true');
 button.onclick();assert.equal(changes,3);assert.equal(body.dataset.orientation,'horizontal');assert.equal(attributes.get('aria-pressed'),'false');
});
