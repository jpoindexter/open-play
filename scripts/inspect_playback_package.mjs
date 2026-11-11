import {extractFile,listPackage,statFile} from '../desktop/node_modules/@electron/asar/lib/asar.js';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';import path from 'node:path';import assert from 'node:assert/strict';
const version=process.argv[2],label=process.argv[3]||'inspection';
if(!/^0\.1\.\d+$/.test(version||'')||!/^[a-z0-9-]+$/.test(label))throw Error('Pass an explicit version and optional receipt label.');
const receipt=JSON.parse(await readFile(`docs/prototype/desktop-${version}-playback-package.json`)),archive=receipt.asarPath,sha=b=>createHash('sha256').update(b).digest('hex'),p=JSON.parse(extractFile(archive,'BUILD_PROVENANCE.json')),checks=[];
const report={version,archiveSHA256:sha(await readFile(archive)),sourceCommit:p.sourceCommit,checks,scope:'Actual ASAR bytes and controlled packaged host/check-window callbacks, not native UI/audio/device acceptance.',fullParityVerified:false};
async function check(name,run){const row={name,passed:false};checks.push(row);row.evidence=await run();row.passed=true;}
try{
 await check('Archive and all declared prototype module bytes match immutable source',()=>{assert.equal(report.archiveSHA256,receipt.asarSHA256);assert.equal(p.version,version);const files=execFileSync('git',['ls-tree','-r','--name-only','-z',p.sourceCommit,'--','prototype']).toString().split('\0').filter(Boolean);const omittedDevelopmentFiles=files.filter(file=>file==='prototype/ui/package-lock.json');const runtimeFiles=files.filter(file=>!omittedDevelopmentFiles.includes(file));for(const file of runtimeFiles)assert(extractFile(archive,'assets/'+file).equals(execFileSync('git',['show',p.sourceCommit+':'+file],{maxBuffer:128*1024*1024})),file);for(const file of p.prototypeFiles)assert.equal(sha(extractFile(archive,'assets/'+file.file)),file.sha256,file.file);return{runtimePrototypeFiles:runtimeFiles.length,omittedDevelopmentFiles,declaredModules:p.prototypeFiles.length};});
 await check('Staged host/helper bytes and sanitized package identity match receipt',()=>{for(const file of receipt.stagedWrites){if(file.file==='package.json')continue;assert.equal(sha(extractFile(archive,file.file)),file.sha256,file.file);}const pkg=JSON.parse(extractFile(archive,'package.json'));assert.equal(pkg.version,version);assert.equal(pkg.name,'open-play-playback-local-test');for(const key of ['devDependencies','scripts','private'])assert(!(key in pkg));return{stagedFiles:receipt.stagedWrites.length,version:pkg.version};});
 if(Number(version.split('.').at(-1))>=17)await check('Only four generated diagnostic WAVs match independently referenced hashes',()=>{assert.equal(p.diagnosticFixtures.length,4);for(const fixture of p.diagnosticFixtures){assert(['A','B','silence','mono'].includes(fixture.name));assert.equal(sha(extractFile(archive,'assets'+fixture.url)),fixture.sha256);}const fixtureManifest=JSON.parse(extractFile(archive,'assets/docs/prototype/auto-gain-fixture-reference.json'));assert.equal(fixtureManifest.fixtures.length,4);return{generatedWAVs:4,noNativeReferenceLibrary:true};});
 await check('Archive excludes raw evidence, user profiles, Git and credentials',()=>{const files=listPackage(archive).filter(f=>statFile(archive,f.slice(1)).size!==undefined);for(const file of files){assert(/^\/(?:main\.cjs|server\.cjs|package\.json|BUILD_PROVENANCE\.json|playback-check-window\.cjs|menu-bar\.cjs|manual-links\.cjs)$/.test(file)||/^\/assets\/(?:prototype\/|docs\/|handoffs\/|README\.md$|FULL_BUILD_PLAN\.md$|PROJECT_PROMPT\.md$|menuTemplate(?:@2x)?\.png$|open-play\.icns$)/.test(file),file);assert(!/\/(?:node_modules|local-evidence|\.git)\/|\/\.env(?:\.|$)/.test(file),file);}return{files:files.length};});
 await check('Packaged main profile/permissions and isolated check session remain distinct',async()=>{
  const windows=[],menus=[],dialogs=[],trays=[],external=[],paths={},origin='http://127.0.0.1:18775',events={};
  class Window{constructor(options){this.options=options;this.events={};const ses={setPermissionCheckHandler:f=>ses.check=f,setPermissionRequestHandler:f=>ses.request=f};this.webContents={session:ses,getURL:()=>this.url,on:(n,f)=>this.events['web:'+n]=f,setWindowOpenHandler:f=>this.popup=f};windows.push(this);}on(n,f){this.events[n]=f;}loadURL(url){this.url=url;return Promise.resolve();}isDestroyed(){return false;}isMinimized(){return true;}restore(){this.restored=true;}show(){this.shown=true;}focus(){this.focused=true;}static getAllWindows(){return windows;}}
  class Tray{constructor(icon){assert.equal(icon.template,true);trays.push(this);}setToolTip(value){this.tooltip=value;}setContextMenu(value){this.menu=value;}destroy(){this.destroyed=true;}}
  const app={name:'',isPackaged:true,setName(n){this.name=n;},setPath:(key,v)=>paths[key]=v,getPath:()=>'/controlled/Application Support',getAppPath:()=>'/controlled/app',getVersion:()=>version,requestSingleInstanceLock:()=>true,whenReady:()=>Promise.resolve(),on:(n,f)=>events[n]=f};
  const helperModule={exports:{}};vm.runInNewContext(extractFile(archive,'playback-check-window.cjs').toString(),{module:helperModule,process,URL,console});
  const stubs={electron:{app,BrowserWindow:Window,Tray,shell:{openExternal:async url=>external.push(url)},nativeImage:{createFromPath:file=>{assert.equal(file,'/controlled/assets/menuTemplate.png');return{isEmpty:()=>false,setTemplateImage(value){this.template=value;}};}},Menu:{buildFromTemplate:v=>v,setApplicationMenu:m=>menus.push(m)},dialog:{showErrorBox(){throw Error('Unexpected host error');},showMessageBox(...args){dialogs.push(args.at(-1));}}},'node:path':path,'./server.cjs':{createAssetServer:async options=>{assert.equal(options.port,18775);return{origin,server:{close(){}}};}},'./playback-check-window.cjs':helperModule.exports};
  if(listPackage(archive).includes('/menu-bar.cjs')){const menuModule={exports:{}};vm.runInNewContext(extractFile(archive,'menu-bar.cjs').toString(),{module:menuModule,URL,console});stubs['./menu-bar.cjs']=menuModule.exports;}
  if(listPackage(archive).includes('/manual-links.cjs')){const manualModule={exports:{}};vm.runInNewContext(extractFile(archive,'manual-links.cjs').toString(),{module:manualModule,URL,Promise});stubs['./manual-links.cjs']=manualModule.exports;}
  vm.runInNewContext(extractFile(archive,'main.cjs').toString(),{require:name=>{assert(name in stubs,name);return stubs[name];},process,URL,__dirname:'/controlled'});await new Promise(resolve=>setImmediate(resolve));
  assert.equal(windows.length,1);const main=windows[0];assert.equal(paths.userData,'/controlled/Application Support/Open Play Playback Test');assert.equal(main.options.webPreferences.partition,'persist:open-play-playback-test');assert.equal(main.url,origin+(Number(version.split('.').at(-1))>=28?'/prototype/workspace-preview.html':'/prototype/'));
  if(stubs['./menu-bar.cjs']&&process.platform==='darwin'){assert.equal(trays.length,1);assert.equal(trays[0].tooltip,'Open Play');assert.deepEqual(Array.from(trays[0].menu,item=>item.label||item.type),['Show Open Play','Settings…','Audio Devices…','Help','separator','Quit']);trays[0].menu[0].click();assert(main.restored&&main.shown&&main.focused);}
  if(stubs['./manual-links.cjs']){assert.equal(main.popup({url:'https://open-play-help.vercel.app/?q=tempo'}).action,'deny');assert.deepEqual(external,['https://open-play-help.vercel.app/?q=tempo']);main.popup({url:'https://foreign.invalid/'});assert.equal(external.length,1);}
  assert.equal(main.webContents.session.check(main.webContents,'midi',origin,{isMainFrame:true}),true);assert.equal(main.webContents.session.check(main.webContents,'microphone',origin,{isMainFrame:true}),false);
  if(Number(version.split('.').at(-1))>=18){
   const session=main.webContents.session;
   for(let i=0;i<90;i++)assert.equal(session.check(main.webContents,'speaker-selection',origin,{isMainFrame:true}),true);
   assert.equal(session.check(main.webContents,'speaker-selection','https://foreign.invalid',{isMainFrame:true}),false);
   assert.equal(session.check(main.webContents,'speaker-selection',origin,{isMainFrame:false}),false);
   assert.equal(session.check(null,'speaker-selection',origin,{isMainFrame:true}),false);
   for(const permission of ['media','camera','microphone'])assert.equal(session.check(main.webContents,permission,origin,{isMainFrame:true,mediaType:'audio'}),false);
   let allowed;session.request(main.webContents,'speaker-selection',value=>allowed=value,{isMainFrame:true,requestingUrl:origin+'/prototype/'});assert.equal(allowed,true);
   const traceAction=menus[0].find(m=>m.label==='Checks').submenu.find(x=>x.label==='Device permission decisions');assert(traceAction);traceAction.click();
   const trace=JSON.parse(dialogs.at(-1).detail);assert.equal(trace.length,80);
   for(const row of trace){assert.deepEqual(Object.keys(row).sort(),['kind','permission','mainContents','ownOrigin','isMainFrame','requestingUrlOwn','mediaType','allowed'].sort());assert(!JSON.stringify(row).includes('http'));}
  }
  const action=menus[0].find(m=>m.label==='Checks').submenu[0];assert.equal(action.label,'Rapid Sync and Play');action.click();action.click();assert.equal(windows.length,3);
  const diagnostic=windows[1],again=windows[2];assert.notEqual(diagnostic.options.webPreferences.partition,again.options.webPreferences.partition);assert(!diagnostic.options.webPreferences.partition.startsWith('persist:'));assert.notEqual(diagnostic.webContents.session,main.webContents.session);assert.equal(diagnostic.url,origin+'/prototype/rapid-sync-play-harness.html');
  for(const w of [main,diagnostic]){assert.equal(w.options.webPreferences.nodeIntegration,false);assert.equal(w.options.webPreferences.contextIsolation,true);assert.equal(w.options.webPreferences.sandbox,true);assert.equal(w.options.webPreferences.webSecurity,true);}
  assert.equal(diagnostic.webContents.session.check(diagnostic.webContents,'midi',origin,{isMainFrame:true}),false);let granted;diagnostic.webContents.session.request(diagnostic.webContents,'speaker-selection',v=>granted=v);assert.equal(granted,false);assert.equal(diagnostic.popup().action,'deny');
  let blocked=false;diagnostic.events['web:will-navigate']({preventDefault(){blocked=true;}},'https://foreign.invalid');assert.equal(blocked,true);blocked=false;diagnostic.events['web:will-navigate']({preventDefault(){blocked=true;}},origin+'/prototype/');assert.equal(blocked,false);
  const autoAction=menus[0].find(m=>m.label==='Checks').submenu.find(x=>x.label==='Measured Auto Gain');
  if(Number(version.split('.').at(-1))>=17){assert(autoAction);autoAction.click();const auto=windows.at(-1);assert.equal(auto.url,origin+'/prototype/auto-gain-harness.html');assert(!auto.options.webPreferences.partition.startsWith('persist:'));assert.notEqual(auto.options.webPreferences.partition,diagnostic.options.webPreferences.partition);assert.equal(auto.webContents.session.check(auto.webContents,'midi',origin,{isMainFrame:true}),false);}
  let relativeCheckVerified=false;
  if(Number(version.split('.').at(-1))>=22){
   const action=menus[0].find(m=>m.label==='Checks').submenu.find(x=>x.label==='Relative Controller Tempo');assert(action);action.click();const relative=windows.at(-1);
   assert.equal(relative.url,origin+'/prototype/relative-tempo-harness.html');assert(!relative.options.webPreferences.partition.startsWith('persist:'));assert.notEqual(relative.options.webPreferences.partition,diagnostic.options.webPreferences.partition);
   assert.equal(relative.webContents.session.check(relative.webContents,'midi',origin,{isMainFrame:true}),false);let allowed;relative.webContents.session.request(relative.webContents,'speaker-selection',v=>allowed=v);assert.equal(allowed,false);
   assert.equal(relative.options.webPreferences.sandbox,true);assert.equal(relative.options.webPreferences.contextIsolation,true);relativeCheckVerified=true;
  }
  let guiTempoCheckVerified=false,simpleControllerCheckVerified=false;
  if(Number(version.split('.').at(-1))>=23){
   for(const [label,route]of [['GUI Tempo after Sync','gui-tempo-harness.html'],['Simple Sync Controller','simple-sync-controller-harness.html']]){
    const previousPartitions=new Set(windows.map(w=>w.options.webPreferences.partition));
    const action=menus[0].find(m=>m.label==='Checks').submenu.find(x=>x.label===label);assert(action);action.click();const w=windows.at(-1);
    assert.equal(w.url,origin+'/prototype/'+route);assert(!w.options.webPreferences.partition.startsWith('persist:'));assert(!previousPartitions.has(w.options.webPreferences.partition));
    assert.equal(w.webContents.session.check(w.webContents,'midi',origin,{isMainFrame:true}),false);let allowed;w.webContents.session.request(w.webContents,'speaker-selection',v=>allowed=v);assert.equal(allowed,false);
    assert.equal(w.options.webPreferences.nodeIntegration,false);assert.equal(w.options.webPreferences.contextIsolation,true);assert.equal(w.options.webPreferences.sandbox,true);assert.equal(w.options.webPreferences.webSecurity,true);
   }
   guiTempoCheckVerified=true;simpleControllerCheckVerified=true;
  }
  events['will-quit']();if(trays.length)assert.equal(trays[0].destroyed,true);
  return{mainPartition:main.options.webPreferences.partition,diagnosticPartitionPersistent:false,uniqueDiagnosticSessions:true,devicePermissionsDenied:true,sandboxRetained:true,relativeCheckVerified,guiTempoCheckVerified,simpleControllerCheckVerified,menuBarVerified:trays.length===1};
 });
}catch(error){report.error={message:error.message,stack:error.stack};}
report.passed=checks.filter(c=>c.passed).length;report.failed=checks.filter(c=>!c.passed).length;report.completed=report.failed===0&&!report.error;
await writeFile(`docs/prototype/desktop-${version}-playback-${label}.json`,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({completed:report.completed,passed:report.passed,failed:report.failed,sourceCommit:p.sourceCommit,asarSHA256:report.archiveSHA256,error:report.error?.message}));if(!report.completed)process.exitCode=1;
