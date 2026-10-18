import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {parseControllerCatalog,attestControllerCatalog,bindControllerProfile,controllerSourceLabel} from '../prototype/controller-catalog.js';
const folder=process.argv[2],priorFile=process.argv[3];if(!folder||!priorFile)throw Error('Choose v3 private directory and the earlier private Hercules catalog');
const files=(await fs.readdir(folder)).filter(f=>/^factory-\d+\.json$/.test(f)).sort(),profiles=[];
for(const file of files){const c=await attestControllerCatalog(parseControllerCatalog(await fs.readFile(path.join(folder,file),'utf8')));profiles.push(...c.profiles);}
assert.equal(profiles.length,197);assert(profiles.every(p=>p.adapterVersion.endsWith('-v3')&&controllerSourceLabel(p)==='Official Serato'&&!p.fullyTranslated));
const p=profiles.find(p=>p.sourceFile.includes('inpulse_300_mk2')),device={id:'authored',state:'connected'};
assert.equal(p.mappings.length,356);assert.equal(p.issues.length,18);
const old=(await attestControllerCatalog(parseControllerCatalog(await fs.readFile(priorFile,'utf8')))).profiles[0];
const bound=bindControllerProfile(old,device,[]),upgrade=bindControllerProfile(p,device,bound.mappings);
assert.equal(upgrade.added.length,21);assert.equal(upgrade.unchanged.length,335);assert.equal(upgrade.conflicts.length,0);assert.equal(upgrade.mappings.length,356);
assert.equal(upgrade.mappings.filter(m=>m.channel===2&&m.number===4&&m.type==='Note').length,2,'New fader-enable companion did not join its existing modifier input');
const user={target:'Deck 4 play',type:'Note',channel:2,number:4,encoding:'7-bit absolute',deviceId:device.id};
const guarded=bindControllerProfile(p,device,[user]);assert(guarded.conflicts.some(m=>m.target==='Deck 1 fader start enable'));assert.equal(guarded.mappings[0],user);
console.log(JSON.stringify({definitions:profiles.length,shards:files.length,assignments:profiles.reduce((n,p)=>n+p.mappings.length,0),definitionsWithInputMappings:profiles.filter(p=>p.mappings.length).length,hercules:{assignments:356,unresolved:18,upgradeAdded:21,retained:335,conflicts:0},userConflictPreserved:true,fullParity:false,physicalCompatibilityVerified:false},null,2));
