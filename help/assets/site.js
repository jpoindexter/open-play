const form = document.querySelector('.search');
const input = document.querySelector('#search');
const results = document.querySelector('#search-results');
const matches = document.querySelector('#matches');
const status = document.querySelector('#search-status');
const article = document.querySelector('#article');
const toc = document.querySelector('.on-page');
const menu = document.querySelector('.nav-toggle');
const nav = document.querySelector('#manual-nav');
let index, timer, generation = 0;
menu.addEventListener('click', () => {
  const expanded = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(expanded));
  nav.classList.toggle('open', expanded);
});
const normalize = text => text.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
const aliases = {bpm:'tempo', headphones:'cue', lag:'stalls', clicking:'pops', clickingnoise:'pops', restore:'backup', keyboard:'shortcuts'};
function showArticle() {
  generation++;
  input.value = '';
  results.hidden = true;
  article.hidden = false;
  toc.hidden = false;
  const url = new URL(location.href); url.searchParams.delete('q');
  history.replaceState(null, '', url);
}
async function search(focus = false) {
  const request = ++generation;
  const query = input.value.trim();
  if (!query) return showArticle();
  results.hidden = false; article.hidden = true; toc.hidden = true;
  status.textContent = 'Searching…'; matches.replaceChildren();
  const url = new URL(location.href); url.searchParams.set('q', query);
  history.replaceState(null, '', url);
  if (focus) { results.querySelector('h1').tabIndex = -1; results.querySelector('h1').focus(); }
  try {
    index ||= fetch('/search.json').then(response => {
      if (!response.ok) throw new Error('Search index unavailable');
      return response.json();
    });
    const pages = await index;
    if (request !== generation) return;
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    const hits = pages.map(page => {
      const text = normalize(`${page.title} ${page.description} ${page.text}`);
      const title = normalize(`${page.title} ${page.description}`);
      const score = terms.every(term => text.includes(term) || (aliases[term] && text.includes(aliases[term])))
        ? terms.reduce((n, term) => n + (title.includes(term) ? 5 : 1), 0) : 0;
      return {page, score};
    }).filter(hit => hit.score).sort((a, b) => b.score - a.score);
    status.textContent = `${hits.length} ${hits.length === 1 ? 'article' : 'articles'} for “${query}”`;
    for (const {page} of hits) {
      const link = document.createElement('a'); link.className = 'result'; link.href = page.href;
      for (const [tag, text] of [['small', page.group], ['h2', page.title], ['p', page.description]]) {
        const node = document.createElement(tag); node.textContent = text; link.append(node);
      }
      matches.append(link);
    }
    if (!hits.length) {
      const message = document.createElement('p');
      message.textContent = 'Try a shorter control name, such as Cue, tempo, Sync, backup or recording. You can also browse Contents or return to this article.';
      matches.append(message);
    }
  } catch {
    if (request !== generation) return;
    index = null;
    status.textContent = 'Search could not load. Browse Contents, or submit your search again to retry.';
  }
}
form.addEventListener('submit', event => { event.preventDefault(); clearTimeout(timer); void search(true); });
input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => void search(), 160); });
input.addEventListener('keydown', event => { if (event.key === 'Escape') { clearTimeout(timer); showArticle(); } });
document.querySelector('#close-search').addEventListener('click', () => { showArticle(); article.querySelector('h1').tabIndex = -1; article.querySelector('h1').focus(); });
const query = new URL(location.href).searchParams.get('q');
if (query) { input.value = query; void search(); }
