// Executes actual controls.bind handlers with a controlled DOM lookup adapter.
// This is source-layer async UI ownership evidence, not a browser navigation run.
import assert from 'node:assert/strict';
import {createVideoControls} from '../prototype/video-controls.js';
function deferred(){let resolve;const promise=new Promise(r=>{resolve=r;});return{promise,resolve};}
async function scenario(started,replace=false){
 const nodes=new Map(),notifications=[],gate=deferred();let recording=started,result=null;
 const populate=()=>{for(const id of ['video-master','video-transition','video-cross','video-auto','video-cross-link','video-opacity-0','video-opacity-1','video-opacity-link-0','video-opacity-link-1','video-fade-left','video-fade-right','video-fade-stop','video-fade-speed','video-fade-speed-note','video-link','video-audio-fx-link','video-treatment','video-resolution','video-record-quality','video-fullscreen','video-reset','video-record','video-download','video-fx','video-overlay','video-karaoke','video-media'])nodes.set('#'+id,{disabled:false,isConnected:true,value:'output',textContent:id==='video-record'?(recording?'Stop video capture':'Record video mix'):''});};populate();
 const root={querySelector:selector=>nodes.get(selector)||null,querySelectorAll:()=>[]};
 const videoMixer={bind(){},get recording(){return recording;},get result(){return result;},record:async()=>{await gate.promise;recording=true;},stop:async()=>{await gate.promise;recording=false;result=new Blob(['actual controlled stop result']);}};
 const controls=createVideoControls({state:{video:{},settings:{},decks:[]},videoMixer,notify:message=>notifications.push(message),dialog(){},download(){}});controls.bind(root);
 const button=nodes.get('#video-record'),pending=button.onclick();assert.equal(button.disabled,true,'Actual handler must be pending');
 const oldControls=['#video-record','#video-record-quality','#video-resolution'].map(id=>nodes.get(id));
 const oldState=oldControls.map(node=>({disabled:node.disabled,textContent:node.textContent}));
 // The app reuses #panel and replaces its children when changing panels.
 for(const node of nodes.values())node.isConnected=false;nodes.clear();
 if(replace){populate();controls.bind(root);assert.notEqual(nodes.get('#video-record'),button);}
 gate.resolve();await pending;
 assert.deepEqual(notifications,[],'Successful background capture completion must not report a detached-control error');
 assert.deepEqual(oldControls.map(node=>({disabled:node.disabled,textContent:node.textContent})),oldState,'Completion must leave detached old controls untouched');
 if(replace){
  assert.equal(nodes.get('#video-record').disabled,false);assert.equal(nodes.get('#video-record').textContent,recording?'Stop video capture':'Record video mix');
  assert.equal(nodes.get('#video-record-quality').disabled,recording);assert.equal(nodes.get('#video-resolution').disabled,recording);
  assert.equal(nodes.get('#video-download').disabled,!result,'Current Download must reflect the completed session result');
 }
 return {recording,notifications,replacedControls:replace,detachedControlsUnchanged:true,...(replace?{currentButton:nodes.get('#video-record').textContent,currentQualityDisabled:nodes.get('#video-record-quality').disabled,currentDownloadDisabled:nodes.get('#video-download').disabled}:{})};
}
const checks=[];for(const [name,started,replace] of [
 ['Leaving Video while Start awaits completion does not report a stale-DOM error',false,false],
 ['Leaving Video while Stop awaits completion does not report a stale-DOM error',true,false],
 ['Leaving and returning during Start updates only replacement controls from session state',false,true],
 ['Leaving and returning during Stop updates replacement controls and Download from session result',true,true],
]){try{checks.push({name,passed:true,evidence:await scenario(started,replace)});}catch(error){checks.push({name,passed:false,error:error.stack});}}
console.log(JSON.stringify({scope:'Executed actual Video controls handlers with controlled DOM replacement and deferred mixer start/stop. No browser navigation/capture proof.',passed:checks.filter(c=>c.passed).length,failed:checks.filter(c=>!c.passed).length,checks},null,2));if(checks.some(c=>!c.passed))process.exitCode=1;
