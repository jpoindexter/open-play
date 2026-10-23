// Test-only event-aligned browser trace. Async elapsed time is not CPU duration.
export function installFourDeckTrace(){
 const report={supported:PerformanceObserver.supportedEntryTypes,frames:[],geometry:[],geometryTotals:{},previewAttributes:{total:0,redundant:0},deckRebuilds:0,removed:{decks:0,detail:0,mixer:0,rows:0,previews:0},timers:[],longFrames:[],tasks:[],operations:[],visibility:[],dropped:0};
 let active=false,lastFrame;
 const retain=(array,value)=>{if(array.length<10000)array.push(value);else report.dropped++;};
 const note=(type,data={})=>{if(active){performance.mark('openplay:'+type,{detail:data});retain(report.operations,{type,at:performance.now(),...data});}};
 for(const type of ['long-animation-frame','longtask'])if(report.supported.includes(type))new PerformanceObserver(list=>{
  if(!active)return;
  for(const e of list.getEntries())retain(type==='longtask'?report.tasks:report.longFrames,e.toJSON());
 }).observe({type});
 const attributes=new MutationObserver(entries=>{if(active)for(const entry of entries){report.previewAttributes.total++;if(entry.oldValue===document.body.dataset.libraryWaveforms)report.previewAttributes.redundant++;}});
 attributes.observe(document.body,{attributes:true,attributeOldValue:true,attributeFilter:['data-library-waveforms']});
 const decks=new MutationObserver(entries=>{if(active)report.deckRebuilds+=entries.filter(e=>e.removedNodes.length).length;});
 const removals=new MutationObserver(entries=>{if(active)for(const e of entries)for(const node of e.removedNodes)if(node.nodeType===1)for(const [key,selector]of Object.entries({decks:'.deck',detail:'#detail-wave',mixer:'.channel-strip',rows:'tr[data-track]',previews:'.library-wave-preview img'}))report.removed[key]+=Number(node.matches(selector))+node.querySelectorAll(selector).length;});
 const rect=Element.prototype.getBoundingClientRect;
 Element.prototype.getBoundingClientRect=function(...args){
  const start=performance.now(),result=rect.apply(this,args),duration=performance.now()-start;
  if(active){const key=this.id||this.tagName,total=report.geometryTotals[key]??={count:0,total:0,max:0};total.count++;total.total+=duration;total.max=Math.max(total.max,duration);
   if(duration>12||(duration>1&&(this.id!=='detail-wave'||total.count%120===0)))retain(report.geometry,{start,duration,tag:this.tagName,id:this.id,stack:new Error().stack});
  }return result;
 };
 const timeout=window.setTimeout.bind(window);
 window.setTimeout=(callback,delay,...args)=>{
  if(typeof callback!=='function')return timeout(callback,delay,...args);
  const scheduled=performance.now(),stack=active?new Error().stack:null;
  return timeout((...values)=>{const start=performance.now();try{return callback(...values);}finally{
   const end=performance.now();if(active&&end-start>8)retain(report.timers,{start,duration:end-start,delay,wait:start-scheduled,stack});
  }},delay,...args);
 };
 document.addEventListener('visibilitychange',()=>{if(active)report.visibility.push({at:performance.now(),state:document.visibilityState});});
 return {report,note,start(){active=true;decks.observe(document.querySelector('#decks'),{childList:true});for(const selector of ['#decks','#mixer','#tracks'])removals.observe(document.querySelector(selector),{childList:true,subtree:true});note('trace-start');},stop(){note('trace-stop');active=false;attributes.disconnect();decks.disconnect();removals.disconnect();window.setTimeout=timeout;Element.prototype.getBoundingClientRect=rect;},
  frame(name,at,start,end){if(!active||name!=='tick')return;if(lastFrame&&(at-lastFrame>20||end-start>12))retain(report.frames,{at,start,duration:end-start,interval:at-lastFrame});lastFrame=at;},
  async wrap(object,name){const original=object[name];object[name]=async function(...args){const at=performance.now();note(name+'-start',{deck:args[0]?.index});try{return await original.apply(this,args);}finally{note(name+'-end',{elapsed:performance.now()-at});}};}
 };
}
