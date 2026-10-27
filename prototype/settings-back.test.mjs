import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('./workspace-toolbar.js',import.meta.url),'utf8');
const assignment=source.slice(source.indexOf('const restoreSettings='),source.indexOf('window.openPlay.workspaceSettings='));
function fixture(){
 const tab={isConnected:true},body={scrollTop:0,querySelector:()=>tab},document={body:{},activeElement:null},modal={open:true},frames=[],back={contains:node=>node===back};
 document.activeElement=document.body;let clicked=0,focused=null;
 new Function('back','settings','$','requestAnimationFrame','returnScroll','focus','modal','document','outer',assignment)(back,{click(){clicked++;}},()=>body,cb=>frames.push(cb),137,node=>{focused=node;},modal,document,node=>node);
 return{back,tab,body,document,modal,drain(){while(frames.length)frames.shift()();},result:()=>({clicked,focused})};
}
test('Settings Back restores selected-tab focus/scroll after mount without overriding a newer focus or view',()=>{
 const normal=fixture();normal.back.onclick();assert.equal(normal.result().focused,null);normal.drain();assert.equal(normal.result().clicked,1);assert.equal(normal.result().focused,normal.tab);assert.equal(normal.body.scrollTop,137);
 const priorBack=fixture();priorBack.back.onclick();priorBack.document.activeElement=priorBack.back;priorBack.drain();assert.equal(priorBack.result().focused,priorBack.tab);
 for(const change of [f=>f.document.activeElement={},f=>f.tab.isConnected=false,f=>f.modal.open=false]){
  const f=fixture();f.back.onclick();change(f);f.drain();assert.equal(f.result().focused,null);assert.equal(f.body.scrollTop,0);
 }
});
