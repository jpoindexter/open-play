// Keep preview cells and focused rows attached during routine metadata refreshes.
const views=new WeakMap();
const artworkViews=new WeakMap();
export function renderArtworkCards(root,rows){
 let view=artworkViews.get(root);
 if(!view||view.grid.parentElement!==root){
  root.innerHTML='<div class="art-grid"></div>';
  view={grid:root.firstElementChild,rows:new Map(),markup:new Map()};artworkViews.set(root,view);
 }
 const focused=root.contains(document.activeElement)?document.activeElement:null,keep=new Set();
 for(const [index,html]of rows.entries()){
  let entry=view.markup.get(html);
  if(!entry){
   const template=document.createElement('template');template.innerHTML=html;
   const next=template.content.firstElementChild,id=next.dataset.track,children=[...next.children],parts=children.map(node=>node.outerHTML);
   entry=view.rows.get(id);
   if(entry){
    view.markup.delete(entry.html);
    children.forEach((child,i)=>{if(entry.parts[i]!==parts[i]){const old=entry.node.children[i];if(old)old.replaceWith(child);else entry.node.append(child);}});
    while(entry.node.children.length>children.length)entry.node.lastElementChild.remove();
    Object.assign(entry,{html,parts,selected:next.classList.contains('active')});
   }else entry={node:next,html,parts,selected:next.classList.contains('active')};
   view.rows.set(id,entry);view.markup.set(html,entry);
  }
  for(const name of ['active','selected'])entry.node.classList.toggle(name,entry.selected);
  entry.node.setAttribute('aria-selected',String(entry.selected));
  keep.add(entry.node.dataset.track);
  if(view.grid.children[index]!==entry.node)view.grid.insertBefore(entry.node,view.grid.children[index]||null);
 }
 for(const [id,entry]of view.rows)if(!keep.has(id)){entry.node.remove();view.rows.delete(id);view.markup.delete(entry.html);}
 if(focused?.isConnected&&document.activeElement!==focused)focused.focus({preventScroll:true});
}
export function renderLibraryRows(root, header, columns, rows) {
 let view=views.get(root);
 if(!view||view.table.parentElement!==root||view.columns!==columns||view.header!==header){
  root.innerHTML=`<table><thead><tr>${header}</tr></thead><tbody>${rows.join('')}</tbody></table>`;
  const table=root.querySelector('table'),body=table.tBodies[0];
  const entries=[...body.rows].map((node,i)=>({node,html:rows[i]}));
  view={table,body,columns,header,rows:new Map(entries.map(entry=>[entry.node.dataset.track,entry])),markup:new Map(entries.map(entry=>[entry.html,entry]))};views.set(root,view);return;
 }
 const keep=new Set();
 for(const [index,html]of rows.entries()){
  // Parse only changed metadata; adapter-owned preview cells never enter this markup.
  let entry=view.markup.get(html);
  if(!entry){
   const template=document.createElement('tbody');template.innerHTML=html;const next=template.firstElementChild,id=next.dataset.track;
   entry=view.rows.get(id);
   if(entry){
    view.markup.delete(entry.html);
    for(const name of ['class','aria-selected'])if(entry.node.getAttribute(name)!==next.getAttribute(name))entry.node.setAttribute(name,next.getAttribute(name));
    const cells=[...entry.node.cells].filter(cell=>!cell.classList.contains('library-wave-preview'));
    [...next.cells].forEach((cell,i)=>{if(cells[i].outerHTML!==cell.outerHTML)cells[i].replaceWith(cell);});entry.html=html;
   }else entry={node:next,html};
   view.rows.set(id,entry);
   view.markup.set(html,entry);
  }
  keep.add(entry.node.dataset.track);
  if(view.body.children[index]!==entry.node)view.body.insertBefore(entry.node,view.body.children[index]||null);
 }
 for(const [id,entry]of view.rows)if(!keep.has(id)){entry.node.remove();view.rows.delete(id);view.markup.delete(entry.html);}
}
