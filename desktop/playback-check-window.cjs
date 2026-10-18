'use strict';
const checks=new Set();let sequence=0;
// Test-only window: volatile session, no shared MIDI/library state or device
// permission grants. Uses the same packaged assets and Electron runtime.
function openIsolatedCheck({BrowserWindow,origin,title,route,label}){
 const window=new BrowserWindow({width:1440,height:1000,minWidth:1000,minHeight:700,title:title+' — '+label,backgroundColor:'#111111',webPreferences:{partition:`open-play-playback-check-${process.pid}-${++sequence}`,nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true}});
 checks.add(window);window.on('closed',()=>checks.delete(window));window.on('page-title-updated',event=>event.preventDefault());
 window.webContents.session.setPermissionCheckHandler(()=>false);
 window.webContents.session.setPermissionRequestHandler((_contents,_permission,callback)=>callback(false));
 window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 window.webContents.on('will-navigate',(event,url)=>{try{if(new URL(url).origin===origin)return;}catch{}event.preventDefault();});
 window.loadURL(origin+route).catch(error=>console.error('Local playback check could not load:',error.message));
 return window;
}
function openPlaybackCheck(options){return openIsolatedCheck({...options,route:'/prototype/rapid-sync-play-harness.html',label:'synthetic input check'});}
function openAutoGainCheck(options){return openIsolatedCheck({...options,route:'/prototype/auto-gain-harness.html',label:'measured Auto Gain check'});}
function openRelativeTempoCheck(options){return openIsolatedCheck({...options,route:'/prototype/relative-tempo-harness.html',label:'relative controller tempo check'});}
function openGUITempoCheck(options){return openIsolatedCheck({...options,route:'/prototype/gui-tempo-harness.html',label:'GUI tempo check'});}
function openSimpleControllerCheck(options){return openIsolatedCheck({...options,route:'/prototype/simple-sync-controller-harness.html',label:'Simple Sync controller check'});}
module.exports={openPlaybackCheck,openAutoGainCheck,openRelativeTempoCheck,openGUITempoCheck,openSimpleControllerCheck};
