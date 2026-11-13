const frame=document.querySelector('#study'),status=document.querySelector('#status');
let win,doc,observer,timer,fit=true;
function sizeStudy(){document.body.style.width=fit?'100%':'1440px';const stage=document.querySelector('#stage');stage.style.overflow=fit?'hidden':'visible';const scale=fit?Math.min(1,stage.clientWidth/1440):1;frame.style.transform=`scale(${scale})`;stage.style.height=`${1000*scale}px`;document.querySelector('#fit').textContent=fit?'100% view':'Fit view';}
document.querySelector('#fit').onclick=()=>{fit=!fit;sizeStudy();};window.addEventListener('resize',sizeStudy);sizeStudy();
const wait=async(fn)=>{const end=performance.now()+20000;while(!fn()){if(performance.now()>end)throw Error('Preview did not become ready');await new Promise(r=>setTimeout(r,30));}};
const select=(id,value)=>{const input=doc.querySelector(id);input.value=value;input.dispatchEvent(new win.Event('change',{bubbles:true}));};
function halfOverview(){
 for(const source of doc.querySelectorAll('canvas[id^="wave-"]')){
  if(!source.width||!source.height)continue;
  let overlay=source.parentElement.querySelector('.study-half-wave');
  if(!overlay){overlay=doc.createElement('canvas');overlay.className='study-half-wave';overlay.setAttribute('aria-hidden','true');source.after(overlay);source.style.opacity='0';}
  if(overlay.width!==source.width||overlay.height!==source.height){overlay.width=source.width;overlay.height=source.height;}
  const c=overlay.getContext('2d');c.clearRect(0,0,overlay.width,overlay.height);
  c.drawImage(source,0,0,source.width,source.height/2,0,0,overlay.width,overlay.height);
 }
 for(const image of doc.querySelectorAll('#tracks img:not([data-study-half])')){
  if(!image.complete||!image.naturalWidth)continue;
  const c=doc.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;
  c.getContext('2d').drawImage(image,0,0,c.width,c.height/2,0,0,c.width,c.height);
  image.dataset.studyHalf='true';image.src=c.toDataURL();
 }
}
function prepareFilters(){
 const filters=[...doc.querySelectorAll('#mixer .knob-group:has(input[data-mix$=":filter"])')];
 for(const [index,filter]of filters.entries()){filter.style.setProperty('--study-filter-index',index);if(!filter.querySelector('.study-filter-deck')){const label=doc.createElement('span');label.className='study-filter-deck';label.textContent='DECK '+'ABCD'[index];filter.append(label);}}
 doc.querySelector('#study-color-fx').style.setProperty('--study-filter-count',filters.length);
}
async function setup(){
 try{
  await wait(()=>frame.contentDocument?.body.dataset.ready==='true'&&frame.contentDocument.body.dataset.performanceToolbar==='unified');
  win=frame.contentWindow;doc=win.document;win.openPlay.engine.setMasterVolume(0);
  const css=doc.createElement('link');css.rel='stylesheet';css.href='/prototype/previews/oxide-compact/theme.css';doc.head.append(css);doc.body.dataset.styleStudy='oxide';
  select('#preview-density','compact');select('#preview-orientation','horizontal');select('#deck-count',document.querySelector('#deck-choice').value);
  const trigger=doc.createElement('button');trigger.type='button';trigger.id='study-color-fx-toggle';trigger.textContent='COLOR FX';trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-controls','study-color-fx');trigger.title='Open per-channel filter controls';
  const sheet=doc.createElement('section');sheet.id='study-color-fx';sheet.hidden=true;sheet.className='study-color-fx-sheet';sheet.setAttribute('aria-label','Per-deck Color FX filters');sheet.textContent='COLOR FX / FILTERS';
  trigger.onclick=()=>{sheet.hidden=!sheet.hidden;doc.body.dataset.colorFx=sheet.hidden?'closed':'open';trigger.setAttribute('aria-expanded',String(!sheet.hidden));if(!sheet.hidden)doc.querySelector('#mixer input[data-mix$=":filter"]')?.focus();};
  doc.addEventListener('keydown',event=>{if(event.key==='Escape'&&!sheet.hidden){sheet.hidden=true;doc.body.dataset.colorFx='closed';trigger.setAttribute('aria-expanded','false');trigger.focus();}});
  doc.querySelector('.toolbar').append(trigger);doc.body.append(sheet);
  observer=new MutationObserver(prepareFilters);observer.observe(doc.querySelector('#mixer'),{childList:true});prepareFilters();
  await wait(()=>win.openPlay.state.decks.slice(0,2).every(d=>d.track&&!d.processing));
  await Promise.all(win.openPlay.state.decks.slice(0,2).map(d=>win.openPlay.engine.seek(d,12)));
  timer=setInterval(halfOverview,250);halfOverview();status.textContent='PREVIEW ONLY';
  document.querySelector('#deck-choice').onchange=event=>select('#deck-count',event.target.value);
 }catch(error){status.textContent=error.message;}
}
frame.addEventListener('load',setup,{once:true});
window.addEventListener('beforeunload',()=>{clearInterval(timer);observer?.disconnect();win?.openPlay?.engine.silence();},{once:true});
