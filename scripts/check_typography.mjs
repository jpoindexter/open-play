import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {dirname,resolve,basename} from 'node:path';
import {fileURLToPath} from 'node:url';

const entry=fileURLToPath(new URL('../prototype/design-system.css',import.meta.url));
const files=new Set();
async function inspect(path){
 if(files.has(path)||path.includes('/vendor/'))return;
 files.add(path);const css=await readFile(path,'utf8');
 for(const match of css.matchAll(/@import\s+url\(['"]([^'"]+)['"]\)/g))await inspect(resolve(dirname(path),match[1]));
 if(basename(path)==='performance-tokens.css')return;
 for(const [,property,raw]of css.matchAll(/(?:^|[;{])\s*(font(?:-size|-family|-weight)?|line-height|letter-spacing)\s*:\s*([^;}]+)/gm)){
  const value=raw.trim();
  assert.equal(basename(path),'typography.css',`${path}: ${property} belongs in typography.css`);
  assert(/^(?:var\(--dj-semantic-[\w-]+\)|inherit|normal)$/.test(value),`${path}: unowned ${property}: ${value}`);
 }
}
await inspect(entry);
console.log(`Typography ownership checked across ${files.size} runtime stylesheets.`);
