// Keep preview cells and focused rows attached during routine metadata refreshes.
const views=new WeakMap();
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
