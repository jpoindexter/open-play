// Fixed graduations surround existing rotary faces; the original pointers move.
const NS='http://www.w3.org/2000/svg';
export function refineXoneScales(){
 for(const input of document.querySelectorAll('[data-preview-rotary],[data-rb-monitor]')){
  const label=input.parentElement;if(label.querySelector('.xone-scale'))continue;
  const svg=document.createElementNS(NS,'svg');svg.classList.add('xone-scale');svg.setAttribute('viewBox','0 0 40 40');svg.setAttribute('aria-hidden','true');
  for(let i=0;i<=12;i++){
   const angle=(-135+i*22.5)*Math.PI/180,inner=i%3===0?14.5:16.5;
   const line=document.createElementNS(NS,'line');
   for(const [key,value]of Object.entries({x1:20+Math.sin(angle)*inner,y1:20-Math.cos(angle)*inner,x2:20+Math.sin(angle)*19,y2:20-Math.cos(angle)*19}))line.setAttribute(key,String(value));
   if(i===6)line.classList.add('zero');svg.append(line);
  }
  label.append(svg);
 }
}
