import {extractFile} from '../desktop/node_modules/@electron/asar/lib/asar.js';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import path from 'node:path';
const version=process.argv[2];
if(!/^\d+\.\d+\.\d+$/.test(version||''))throw Error('Pass an explicit packaged version.');
const archive=`local-evidence/desktop-builds/${version}/Open Play Test-darwin-arm64/Open Play Test.app/Contents/Resources/app.asar`;
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const provenance=JSON.parse(extractFile(archive,'BUILD_PROVENANCE.json'));
const source=provenance.sourceCommit||provenance.approvedHTMLCommit;
if(!/^[0-9a-f]{40}$/.test(source))throw Error('Missing immutable source commit.');
const files=execFileSync('git',['ls-tree','-r','--name-only','-z',source,'--','prototype'],{encoding:'utf8'}).split('\0').filter(Boolean);
const checked=files.map(file=>{const actual=extractFile(archive,path.posix.join('assets',file));const expected=execFileSync('git',['show',`${source}:${file}`],{maxBuffer:64*1024*1024});return{file,sha256:hash(actual),matches:actual.equals(expected)};});
const hostFiles={};
for(const file of ['main.cjs','server.cjs','package.json']){const packaged=extractFile(archive,file),disk=await readFile(`desktop/${file}`);hostFiles[file]={packagedSHA256:hash(packaged),diskSHA256:hash(disk),matches:packaged.equals(disk)};}
// Packager20 sanitizes development/publishing metadata; retain the raw mismatch.
const bundledPackage=JSON.parse(extractFile(archive,'package.json'));
const expectedPackage=JSON.parse(await readFile('desktop/package.json','utf8'));
for(const field of ['devDependencies','scripts','private'])delete expectedPackage[field];
const expectedPackageBytes=Buffer.from(JSON.stringify(expectedPackage,null,2)+'\n');
const packageMetadata={removedFields:['devDependencies','scripts','private'],expectedSHA256:hash(expectedPackageBytes),matchesExpectedSanitizedBytes:extractFile(archive,'package.json').equals(expectedPackageBytes),versionMatches:bundledPackage.version===version};
const runtimeFilesMatch=['main.cjs','server.cjs'].every(file=>hostFiles[file].matches);
const report={version,archive,archiveSHA256:hash(await readFile(archive)),provenance,prototypeFilesChecked:checked.length,prototypeMismatches:checked.filter(x=>!x.matches),prototypeFiles:checked,hostFiles,packageMetadata,runtimeFilesMatch,scope:'Actual ASAR bytes versus immutable Git prototype and current host. This does not launch Electron or prove native audio, physical devices, permissions, persistence or quality.'};
await writeFile(`docs/prototype/desktop-${version}-package-inspection.json`,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({version,source,prototypeFiles:checked.length,mismatches:report.prototypeMismatches.length,runtimeFilesMatch,packageMetadataMatches:packageMetadata.matchesExpectedSanitizedBytes,archiveSHA256:report.archiveSHA256}));
if(report.prototypeMismatches.length||!runtimeFilesMatch||!packageMetadata.matchesExpectedSanitizedBytes||!packageMetadata.versionMatches)process.exitCode=1;
