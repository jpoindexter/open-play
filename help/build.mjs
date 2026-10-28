import {readFile, writeFile, mkdir, rm, copyFile, cp} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {Marked} from 'marked';
import {pages, href} from './pages.mjs';
import {template, escape} from './template.mjs';
const root = fileURLToPath(new URL('.', import.meta.url));
const out = `${root}dist`;
await rm(out, {recursive:true, force:true});
await mkdir(`${out}/assets`, {recursive:true});
const index = [];
const captures = JSON.parse(await readFile(`${root}screenshots.json`, 'utf8'));
await cp(`${root}assets/screenshots`, `${out}/assets/screenshots`, {recursive:true});
for (const page of pages) {
  const headings = [], used = new Map();
  const parser = new Marked({renderer:{
    paragraph({tokens}) {
      const imageOnly = tokens.length === 1 && tokens[0].type === 'image';
      const tag = imageOnly ? 'figure' : 'p';
      return `<${tag}>${this.parser.parseInline(tokens)}</${tag}>\n`;
    },
    image({href, text, title}) {
      const capture = captures.images[href.replace('/assets/screenshots/', '')];
      if (!href.startsWith('/assets/screenshots/') || !capture || !text || !title) throw new Error(`${page.slug}: undocumented screenshot`);
      return `<a class="screenshot" href="${escape(href)}" target="_blank" rel="noopener"><img src="${escape(href)}" alt="${escape(text)}" width="${capture.width}" height="${capture.height}" decoding="async"></a><figcaption>${escape(title)} <a href="${escape(href)}" target="_blank" rel="noopener">Open full size<span class="visually-hidden">: ${escape(text)}</span></a>.</figcaption>`;
    },
    heading({tokens, depth}) {
      if (depth === 1) throw new Error(`${page.slug}: H1 belongs to the page template`);
      const text = this.parser.parseInline(tokens).replace(/<[^>]+>/g, '');
      const base = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const n = used.get(base) || 0; used.set(base, n + 1);
      const id = n ? `${base}-${n}` : base;
      if (depth === 2) headings.push({text, id});
      return `<h${depth} id="${id}">${this.parser.parseInline(tokens)}</h${depth}>\n`;
    }
  }});
  let source = await readFile(`${root}content/${page.slug}.md`, 'utf8');
  if (page.slug === 'keyboard') {
    const {helpKeys} = await import('../prototype/fixtures.js');
    source = source.replace('<!-- CURRENT_BINDINGS -->', '| Action | Keys |\n|---|---|\n' + helpKeys.map(([name, key]) => `| ${name} | ${key} |`).join('\n'));
  }
  const body = parser.parse(source);
  const destination = page.slug === 'index' ? out : `${out}/${page.slug}`;
  await mkdir(destination, {recursive:true});
  await writeFile(`${destination}/index.html`, template(page, body, headings));
  index.push({...page, href:href(page.slug), text:body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()});
}
await writeFile(`${out}/search.json`, JSON.stringify(index));
for (const file of ['site.css', 'site.js']) await copyFile(`${root}assets/${file}`, `${out}/assets/${file}`);
const tokens = JSON.parse(await readFile(`${root}../prototype/design-tokens/serato-core.tokens.json`, 'utf8'));
function value(path) {
  const entry = path.split('.').reduce((node, key) => node?.[key], tokens);
  if (!entry || !('$value' in entry)) throw new Error(`Missing design token ${path}`);
  return /^\{.*\}$/.test(entry.$value) ? value(entry.$value.slice(1, -1)) : entry.$value;
}
const roles = {background:'background', surface:'panel', hover:'raised', border:'border', text:'text', muted:'textMuted', accent:'focus', selected:'selected', font:'font'};
await writeFile(`${out}/assets/tokens.css`, `/* Generated from the app's canonical design tokens. */\n:root {\n${Object.entries(roles).map(([name, token]) => `  --${name}: ${value(`semantic.${token}`)};`).join('\n')}\n  --print-background: ${value('primitive.white')};\n  --print-text: ${value('primitive.black')};\n}\n`);
await writeFile(`${out}/assets/favicon.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${value('semantic.background')}"/><circle cx="32" cy="32" r="23" fill="none" stroke="${value('semantic.text')}" stroke-width="5"/><path d="m27 22 16 10-16 10z" fill="${value('semantic.focus')}"/></svg>`);
await writeFile(`${out}/404.html`, template({slug:'404', title:'Page not found', group:'Help', description:'This address does not match an article.'}, '<p><a href="/">Return to the manual</a> or use the search above to find a control or topic.</p>', []));
await writeFile(`${out}/robots.txt`, 'User-agent: *\nAllow: /\n');
const prebuilt = `${root}.vercel/output`;
const config = JSON.parse(await readFile(`${root}vercel.json`, 'utf8'));
await rm(prebuilt, {recursive:true, force:true});
await cp(out, `${prebuilt}/static`, {recursive:true});
await writeFile(`${prebuilt}/config.json`, JSON.stringify({version:3, routes:[
  {src:'/(.*)', headers:Object.fromEntries(config.headers[0].headers.map(h => [h.key, h.value])), continue:true},
  ...pages.map(page => ({src:page.slug === 'index' ? '^/$' : `^/${page.slug}/?$`, dest:page.slug === 'index' ? '/index.html' : `/${page.slug}/index.html`})),
  {handle:'filesystem'}, {src:'/(.*)', status:404, dest:'/404.html'}
]}, null, 2));
console.log(`Built ${pages.length} articles; keyboard bindings and palette read from app source. Static output: help/dist.`);
