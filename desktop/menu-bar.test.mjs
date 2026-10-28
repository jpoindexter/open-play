import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import vm from 'node:vm';
import {createMenuBar} from './menu-bar.cjs';

test('menu bar opens existing safe panels, restores the window and preserves Quit',async()=>{
 const origin='http://127.0.0.1:18775',calls=[],scripts=[],errors=[];
 let window,loading=false,destroyed=false,rejectScript=false,rendererOrigin=origin,url=origin+'/prototype/',target={disabled:false,closest:()=>null,click:()=>calls.push('panel')};
 const contents=Object.assign(new EventEmitter(),{isDestroyed:()=>destroyed,isLoading:()=>loading,getURL:()=>url,
  executeJavaScript:async script=>{scripts.push(script);if(rejectScript)throw Error('controlled renderer failure');vm.runInNewContext(script,{location:{origin:rendererOrigin},document:{querySelector:selector=>{calls.push(selector);return target;}}});}});
 window={webContents:contents,isDestroyed:()=>destroyed,isMinimized:()=>true,restore:()=>calls.push('restore'),show:()=>calls.push('show'),focus:()=>calls.push('focus')};
 const main=window,icon={isEmpty:()=>false,setTemplateImage:value=>calls.push(['template',value])};let menu,quit=0;
 class Tray{constructor(image){assert.equal(image,icon);}setToolTip(value){this.tooltip=value;}setContextMenu(value){menu=value;}destroy(){calls.push('destroy');}}
 const oldError=console.error;console.error=(...args)=>errors.push(args);
 try{
  const tray=createMenuBar({Tray,Menu:{buildFromTemplate:value=>value},nativeImage:{createFromPath:value=>{assert.equal(value,'/assets/menuTemplate.png');return icon;}},getWindow:()=>window,origin,iconPath:'/assets/menuTemplate.png',quit:()=>quit++});
  assert.equal(tray.tooltip,'Open Play');assert.deepEqual(calls.shift(),['template',true]);
  assert.deepEqual(menu.map(item=>item.label||item.type),['Show Open Play','Settings…','Audio Devices…','Help','separator','Quit']);
  menu[0].click();assert.deepEqual(calls.splice(0),['restore','show','focus']);
  for(const [index,panel]of [[1,'settings'],[2,'hardware'],[3,'help']]){menu[index].click();await Promise.resolve();assert.deepEqual(calls.splice(0),['restore','show','focus',`[data-panel="${panel}"]`,'panel']);}
  loading=true;const count=scripts.length;menu[1].click();assert.equal(scripts.length,count);loading=false;contents.emit('did-finish-load');await Promise.resolve();assert.equal(scripts.length,count+1);calls.length=0;
  loading=true;menu[1].click();window=null;loading=false;contents.emit('did-finish-load');assert.equal(scripts.length,count+1);menu[0].click();menu[2].click();assert.deepEqual(calls.splice(0),['restore','show','focus']);window=main;
  url='https://foreign.invalid/';menu[1].click();assert.equal(scripts.length,count+1);url=origin+'/prototype/';calls.length=0;
  rendererOrigin='https://foreign.invalid';menu[1].click();assert.deepEqual(calls.splice(0),['restore','show','focus']);rendererOrigin=origin;
  target=null;menu[1].click();await Promise.resolve();assert(!calls.includes('panel'));calls.length=0;
  target={disabled:true,closest:()=>null,click:()=>calls.push('panel')};menu[1].click();await Promise.resolve();assert(!calls.includes('panel'));calls.length=0;
  target={disabled:false,closest:()=>({}),click:()=>calls.push('panel')};menu[1].click();await Promise.resolve();assert(!calls.includes('panel'));calls.length=0;
  rejectScript=true;menu[1].click();await Promise.resolve();assert.equal(errors.length,1);rejectScript=false;
  contents.getURL=()=>{throw Error('controlled destroyed contents');};menu[1].click();assert.equal(errors.length,2);
  destroyed=true;const before=scripts.length;menu[0].click();menu[1].click();assert.equal(scripts.length,before);
  menu[5].click();assert.equal(quit,1);tray.destroy();assert.equal(calls.at(-1),'destroy');
  assert.equal(createMenuBar({nativeImage:{createFromPath:()=>({isEmpty:()=>true})},iconPath:'/missing.png'}),null);assert.equal(errors.length,3);
 }finally{console.error=oldError;}
});
