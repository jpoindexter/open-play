import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {parseControllerCatalog,attestControllerCatalog,bindControllerProfile,controllerSourceLabel} from '../prototype/controller-catalog.js';
const folder=process.argv[2];if(!folder)throw Error('Choose the private v2 catalog directory');
const files=(await fs.readdir(folder)).filter(f=>/^factory-\d+\.json$/.test(f)).sort();
const profiles=[];
for(const file of files){const c=await attestControllerCatalog(parseControllerCatalog(await fs.readFile(path.join(folder,file),'utf8')));profiles.push(...c.profiles);}
assert.equal(profiles.length,197);assert(profiles.every(p=>p.adapterVersion.endsWith('-v2')&&controllerSourceLabel(p)==='Official Serato'&&!p.physicalCompatibilityVerified&&!p.fullyTranslated));
const p=profiles.find(p=>p.sourceFile.includes('inpulse_300_mk2')),dev={id:'authored',state:'connected'};
assert.equal(p.mappings.length,335);assert.equal(p.mappings.filter(m=>'conditions' in m).length,275);
const bound=bindControllerProfile(p,dev,[]);assert.equal(bound.conflicts.length,0);
assert.equal(bound.mappings.filter(m=>m.channel===1&&m.type==='Note'&&m.number===3).length,2,'Mutually exclusive Prepare cases lost');
const modeTargets=new Set(bound.mappings.filter(m=>m.target.includes('pad mode ')).map(m=>m.target.replace(/^Deck [12] pad mode /,'')));assert.equal(modeTargets.size,8);
const mutated=structuredClone(p);mutated.mappings.find(m=>m.conditions?.length).conditions[0].equals=!mutated.mappings.find(m=>m.conditions?.length).conditions[0].equals;
await assert.rejects(()=>attestControllerCatalog(parseControllerCatalog(JSON.stringify({format:'open-play-controller-catalog-v1',profiles:[mutated]}))),/modified or unsupported/);
console.log(JSON.stringify({definitions:profiles.length,shards:files.length,assignments:profiles.reduce((n,p)=>n+p.mappings.length,0),definitionsWithInputMappings:profiles.filter(p=>p.mappings.length).length,hercules:{assignments:p.mappings.length,conditionalAssignments:275,padModes:modeTargets.size,retainedBranches:true},modifiedPredicateRejected:true,fullParity:false,physicalCompatibilityVerified:false},null,2));
