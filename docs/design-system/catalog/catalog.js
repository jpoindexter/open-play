const $ = selector => document.querySelector(selector);
const node = (tag, text) => Object.assign(document.createElement(tag), {textContent: text});
let data;
try {
  const response = await fetch('catalog.json');
  if (!response.ok) throw Error(`Inventory HTTP ${response.status}`);
  data = await response.json();
} catch (error) {
  $('#scope').textContent = `Catalog unavailable: ${error.message}. Serve this folder through the local review server.`;
  throw error;
}
$('#scope').textContent = `${data.version} · ${data.captured}. ${data.scope}`;
const count = status => data.screens.filter(s => s.status === status).length;
$('#coverage').textContent = `${count('captured')} captured · ${count('private')} captured privately · ${count('observed')} AX-only menus · ${count('unvisited')} unvisited. These counts describe this inventory, not every possible app state.`;
for (const group of new Set(data.screens.map(s => s.group))) $('#group').append(Object.assign(node('option', group), {value: group}));
function table(headings, rows) {
  const table = node('table', ''), head = table.createTHead().insertRow();
  for (const text of headings) head.append(node('th', text));
  for (const cells of rows) {
    const row = table.createTBody().insertRow();
    for (const text of cells) row.append(node('td', text));
  }
  return table;
}
function show(screen) {
  history.replaceState(null, '', '#' + screen.id);
  for (const button of $('#screens').children) button.setAttribute('aria-current', String(button.dataset.id === screen.id));
  const detail = $('#detail');
  detail.replaceChildren(node('h2', screen.title), node('p', `${screen.route} · ${screen.status} · ${screen.provider}`));
  if (screen.image) {
    const figure = node('div', ''); figure.className = 'capture';
    const img = node('img', ''); img.src = screen.image; img.alt = `${screen.title}, captured installed rekordbox interface`; figure.append(img);
    img.addEventListener('error', () => { figure.replaceChildren(node('p', 'Private capture file is not present in this checkout. See catalog README.')); });
    if (screen.measurements.length) {
      const label = node('label', 'Show measured regions'); label.className = 'measure-toggle';
      const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; label.prepend(checkbox); detail.append(label);
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('viewBox', `0 0 ${screen.pixels.join(' ')}`); svg.setAttribute('hidden','');
      for (const m of screen.measurements) {
        const [x,y,width,height] = m.box;
        const rect = document.createElementNS(svg.namespaceURI, 'rect');
        for (const [key,value] of Object.entries({x,y,width,height})) rect.setAttribute(key, value);
        const title = document.createElementNS(svg.namespaceURI, 'title'); title.textContent = `${m.name}: ${width} × ${height} ${m.unit}, ${m.confidence}`; rect.append(title); svg.append(rect);
      }
      checkbox.addEventListener('change', () => {svg.toggleAttribute('hidden', !checkbox.checked);}); figure.append(svg);
    }
    detail.append(figure);
  } else detail.append(Object.assign(node('p', screen.status === 'private' ? 'Captured evidence contains account or local-library information. The image stays private.' : screen.status === 'observed' ? 'Menu commands were captured through native accessibility. A menu screenshot is unavailable.' : 'This route has not been captured. No geometry or contents are claimed.'), {className:'notice'}));
  detail.append(node('h3', 'Open Play mapping'), node('p', screen.mapping));
  if (screen.measurements.length) detail.append(node('h3', 'Measured geometry'), table(['Region','x / y','Width × height','Evidence'], screen.measurements.map(m => [m.name,m.box.slice(0,2).join(' / '),m.box.slice(2).join(' × ')+' '+m.unit,m.confidence])));
  if (screen.components.length) detail.append(node('h3', 'Accessibility component inventory'), table(['Role','Count'],screen.components.map(c=>[c.role,c.count])));
  if (screen.labels.length) {const details=node('details','');details.append(node('summary',`Observed control labels (${screen.labels.length})`));const list=node('ul','');screen.labels.forEach(l=>list.append(node('li',l)));details.append(list);detail.append(details);}
  const list = node('ul',''); [...screen.notes,...data.limitations].forEach(n=>list.append(node('li',n))); detail.append(node('h3','Coverage and limits'),list);
  detail.append(node('p', `Capture pixels: ${screen.pixels?.join(' × ') || 'none'}${screen.pixelScale ? ' · '+screen.pixelScale+'× scale' : ''} · ${screen.nodeCount || '—'} AX nodes`));
  if (screen.evidence) detail.append(node('code', `${screen.evidence}${screen.step == null ? '' : ', settled step ' + screen.step}`));
  if (screen.sha256) detail.append(node('p', 'Screenshot SHA-256: '+screen.sha256));
}
function filter() {
  const query = $('#search').value.toLowerCase(), group = $('#group').value, status = $('#status').value;
  const rows = data.screens.filter(s=>(!group||s.group===group)&&(!status||s.status===status)&&[s.title,s.route,...s.labels].join(' ').toLowerCase().includes(query));
  $('#matches').textContent = `${rows.length} screens`;
  $('#screens').replaceChildren(...rows.map(s=>{const b=node('button',s.title);b.type='button';b.dataset.id=s.id;b.append(node('small',`${s.group} · ${s.status}`));b.addEventListener('click',()=>show(s));return b;}));
}
for (const input of document.querySelectorAll('form input,form select')) input.addEventListener('input',filter);
$('form').addEventListener('submit',event=>event.preventDefault());
filter(); show(data.screens.find(s=>s.id===location.hash.slice(1))||data.screens[0]);
