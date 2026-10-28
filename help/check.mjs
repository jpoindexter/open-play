import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, stat, readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {pages} from './pages.mjs';
const root = fileURLToPath(new URL('.', import.meta.url));
const out = `${root}dist`;
const coverage = JSON.parse(await readFile(`${root}coverage.json`, 'utf8'));
const pagesByURL = new Map();
for (const page of pages) {
  const path = page.slug === 'index' ? '/' : `/${page.slug}/`;
  const html = await readFile(`${out}${path}index.html`, 'utf8');
  pagesByURL.set(path, html);
  assert.equal((html.match(/<h1>/g) || []).length, 2, `${page.slug}: article and search headings`);
  assert.ok(html.includes('aria-current="page"'), `${page.slug}: current navigation`);
  assert.ok(!/\/Users\/|local-evidence|file:\/\/|ari:cloud:|BEGIN .*PRIVATE KEY|localhost|127\.0\.0\.1/.test(html), `${page.slug}: private content`);
  assert.ok(!/<script(?![^>]*src=)/.test(html), `${page.slug}: inline script`);
  assert.ok(coverage.sources[page.slug]?.length, `${page.slug}: source coverage`);
  for (const source of coverage.sources[page.slug]) await stat(`${root}../${source}`);
}
for (const [path, html] of pagesByURL) {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length, `${path}: duplicate IDs`);
  for (const [, raw] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (/^https:/.test(raw)) continue;
    const url = new URL(raw.replaceAll('&amp;', '&'), `https://help.invalid${path}`);
    if (url.pathname.startsWith('/assets/')) { await stat(`${out}${url.pathname}`); continue; }
    const target = pagesByURL.get(url.pathname);
    assert.ok(target, `${path}: missing article ${raw}`);
    if (url.hash) assert.ok(target.includes(`id="${url.hash.slice(1)}"`), `${path}: missing heading ${raw}`);
  }
}
const captures = JSON.parse(await readFile(`${root}screenshots.json`, 'utf8'));
const illustrated = [...pagesByURL.values()].filter(html => html.includes('<figure>'));
for (const [name, capture] of Object.entries(captures.images)) {
  const bytes = await readFile(`${out}/assets/screenshots/${name}`);
  assert.equal(bytes.subarray(0, 3).toString('hex'), 'ffd8ff');
  assert.equal(bytes.length, capture.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), capture.sha256);
  assert.ok(illustrated.some(html => html.includes(`/assets/screenshots/${name}`)), `${name}: unused capture`);
}
for (const html of illustrated) for (const [, image] of html.matchAll(/<img ([^>]+)>/g)) {
  assert.match(image, /alt="[^"]{20,}"/);
  assert.match(image, /width="1280" height="720"/);
  assert.ok(html.includes('<figcaption>') && html.includes('Open full size'));
}
const search = JSON.parse(await readFile(`${out}/search.json`, 'utf8'));
assert.equal(search.length, pages.length);
assert.equal(new Set(search.map(p => p.href)).size, pages.length);
assert.ok(search.every(p => p.text.length > 200));
const routes = JSON.parse(await readFile(`${root}.vercel/output/config.json`, 'utf8'));
assert.equal(routes.version, 3);
assert.equal(routes.routes.at(-1).status, 404);
async function size(path) {
  const value = await stat(path);
  if (!value.isDirectory()) return value.size;
  return (await Promise.all((await readdir(path)).map(name => size(`${path}/${name}`)))).reduce((a,b) => a+b, 0);
}
console.log(`Checked ${pages.length} articles, ${Object.keys(captures.images).length} screenshot hashes/dimensions and ${illustrated.length} illustrated articles: internal links/fragments, assets, source coverage, generated search, private-content guard and 404 route. Static bytes: ${await size(out)}.`);
