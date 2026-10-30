// Rehome original utility nodes; delegated player handlers and held inputs survive.
import {uiIcons} from './vendor/astryx/icons.js';
const records=new Map();
const activity={reverse:'REV',repeat:'RPT',censor:'CENSOR',loopRoll:'ROLL'};

function restore(deck,record){
 record.resize.disconnect();record.mutations.disconnect();
 if(deck.isConnected){
  const foot=record.scroll.querySelector('.deck-foot');if(foot)deck.append(foot);
  record.rail.append(...record.scroll.childNodes);
  record.left.remove();record.right.remove();record.summary.remove();record.scroll.remove();
  delete record.rail.dataset.toolRail;deck.classList.remove('has-tool-rail');
 }
 records.delete(deck);
}
function install(deck,index){
 const rail=deck.querySelector('.preview-deck-utilities');if(!rail)return;
 const scroll=document.createElement('div');scroll.className='deck-tool-scroll';
 scroll.id=`deck-tool-scroll-${index}`;
 const summary=document.createElement('span');summary.className='deck-tool-activity';
 const paddle=(direction)=>{
  const button=document.createElement('button');button.type='button';
  button.className='deck-tool-paddle';button.dataset.direction=direction;
  button.setAttribute('aria-label',`Scroll deck ${index+1} tools ${direction<0?'left':'right'}`);
  button.setAttribute('aria-controls',scroll.id);button.innerHTML=uiIcons.right;
  button.onclick=()=>scroll.scrollBy({left:direction*scroll.clientWidth*.7,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  return button;
 };
 const left=paddle(-1),right=paddle(1);
 const update=()=>{
  left.disabled=scroll.scrollLeft<=1;
  right.disabled=scroll.scrollLeft>=scroll.scrollWidth-scroll.clientWidth-1;
  const active=[...scroll.querySelectorAll('button.active,button[aria-pressed=true]')]
   .map(button=>activity[button.dataset.action]).filter(Boolean).join(' · ');
  if(summary.textContent!==active)summary.textContent=active;
 };
 scroll.append(...rail.childNodes);rail.append(left,scroll,summary,right);
 rail.dataset.toolRail='true';deck.classList.add('has-tool-rail');
 scroll.addEventListener('scroll',update,{passive:true});
 scroll.addEventListener('focusin',event=>event.target.scrollIntoView({block:'nearest',inline:'nearest'}));
 const resize=new ResizeObserver(update);resize.observe(scroll);
 const mutations=new MutationObserver(update);
 mutations.observe(scroll,{childList:true,subtree:true,attributes:true,attributeFilter:['class','aria-pressed','disabled']});
 const record={rail,scroll,left,right,summary,resize,mutations};records.set(deck,record);update();
 return record;
}
export function refineDeckToolRails(){
 const enabled=document.body.dataset.workspace==='rekordbox';
 for(const [deck,record]of records)if(!deck.isConnected||!enabled)restore(deck,record);
 if(!enabled)return;
 document.querySelectorAll('.deck').forEach((deck,index)=>{
  const record=records.get(deck)||install(deck,index);if(!record)return;
  // Adapters may append newly-created controls; do not move unchanged children.
  for(const node of [...record.rail.childNodes]){
   if(![record.left,record.right,record.summary,record.scroll].includes(node))record.scroll.append(node);
  }
  const foot=deck.querySelector('.deck-foot');
  if(foot&&foot.parentNode!==record.scroll)record.scroll.append(foot);
 });
}
