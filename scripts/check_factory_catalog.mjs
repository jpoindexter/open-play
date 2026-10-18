// Actual private catalog data goes in argv[2]; receipts contain metadata only.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {parseControllerCatalog,attestControllerCatalog,controllerSourceLabel,bindControllerProfile} from '../prototype/controller-catalog.js';
const folder=process.argv[2];if(!folder)throw Error('Choose a private catalog directory');
const files=(await fs.readdir(folder)).filter(f=>/^factory-\d+\.json$/.test(f)).sort();
let profiles=[];
for(const file of files){const c=await attestControllerCatalog(parseControllerCatalog(await fs.readFile(path.join(folder,file),'utf8')));profiles.push(...c.profiles);}
assert.equal(profiles.length,197);assert.equal(new Set(profiles.map(p=>p.id)).size,197);
assert(profiles.every(p=>controllerSourceLabel(p)==='Official Serato'&&!p.physicalCompatibilityVerified&&!p.fullyTranslated));
const hercules=profiles.find(p=>p.sourceFile.includes('inpulse_300_mk2'));
assert.equal(hercules.mappings.length,56);assert(hercules.mappings.some(m=>m.target==='Deck 2 tempo'&&m.invert&&m.number===8&&m.encoding==='14-bit absolute'));
const forged=JSON.parse(JSON.stringify(hercules));forged.mappings[0].number=(forged.mappings[0].number+1)%128;forged.officialSourceVerified=true;
await assert.rejects(()=>attestControllerCatalog(parseControllerCatalog(JSON.stringify({format:'open-play-controller-catalog-v1',profiles:[forged]}))),/modified or unsupported/);
const unknown={...JSON.parse(JSON.stringify(hercules)),id:'e'.repeat(64),sourceSHA256:'e'.repeat(64),provenance:{kind:'official'},officialSourceVerified:true};
const c=await attestControllerCatalog(parseControllerCatalog(JSON.stringify({format:'open-play-controller-catalog-v1',profiles:[unknown]}),{kind:'alternative',name:'Authored test source'}));
assert.equal(controllerSourceLabel(c.profiles[0]),'Alternative mapping — Authored test source');
const dev={id:'synthetic',state:'connected'},old={target:'Deck 4 level',type:'CC',channel:2,number:32,encoding:'7-bit absolute',deviceId:dev.id};
const binding=bindControllerProfile(hercules,dev,[old]);assert(binding.conflicts.some(m=>m.target==='Deck 1 level'));assert.equal(binding.mappings[0],old);
console.log(JSON.stringify({definitions:profiles.length,shards:files.length,officialContentAttestations:profiles.length,herculesAssignments:hercules.mappings.length,forgedKnownSourceRejected:true,unknownSourceNotPromoted:true,complementPairConflictPreserved:true,physicalCompatibilityVerified:false,fullParity:false},null,2));
