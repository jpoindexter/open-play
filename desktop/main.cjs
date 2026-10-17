'use strict';
const {app,BrowserWindow,Menu,dialog}=require('electron');
const path=require('node:path');
const {createAssetServer}=require('./server.cjs');
app.setName('Open Play Test');
let host,window;
if(!app.requestSingleInstanceLock())app.quit();
else{
 app.on('second-instance',()=>{if(window){if(window.isMinimized())window.restore();window.show();window.focus();}});
 app.whenReady().then(async()=>{
  const assets=app.isPackaged?path.join(app.getAppPath(),'assets'):path.resolve(__dirname,'..');
  host=await createAssetServer({root:assets});
  const partition='persist:open-play-test';
  const createWindow=()=>{
   window=new BrowserWindow({width:1440,height:1000,minWidth:1000,minHeight:700,title:'Open Play Test — HTML f8b0abf',backgroundColor:'#111111',webPreferences:{partition,nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true}});
   const own=url=>{try{return new URL(url).origin===host.origin;}catch{return false;}};
   const ses=window.webContents.session;
   // Electron44 requests its coarse midiSysex permission even for the approved
   // renderer's requestMIDIAccess({sysex:false}). The renderer keeps that false;
   // no SysEx/output path is added. Never grant this to another origin/window.
   const midiPermission=permission=>permission==='midi'||permission==='midiSysex';
   ses.setPermissionCheckHandler((contents,permission,origin)=>contents===window?.webContents&&own(origin)&&midiPermission(permission));
   ses.setPermissionRequestHandler((contents,permission,callback)=>callback(contents===window?.webContents&&own(contents.getURL())&&midiPermission(permission)));
   window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
   window.webContents.on('will-navigate',(event,url)=>{if(!own(url))event.preventDefault();});
   window.webContents.on('render-process-gone',(_,details)=>dialog.showErrorBox('Open Play stopped',`The renderer stopped (${details.reason}). Reopen the app. Imported audio must be re-imported.`));
   window.on('closed',()=>window=null);
   window.loadURL(host.origin+'/prototype/');
  };
  Menu.setApplicationMenu(Menu.buildFromTemplate([{label:app.name,submenu:[{label:'About this test build',click:()=>dialog.showMessageBox({type:'info',title:'Open Play Test',message:'Desktop test of approved HTML revision f8b0abf',detail:`Electron ${process.versions.electron}; Chromium ${process.versions.chrome}. Existing UI and browser audio engine. Full Serato parity, physical MIDI operation, separate headphone/master routing and release-quality latency remain unverified. Imported bytes are session-only. Optional stems use the existing local model service. No public release or notarization.\n\nProject: ${assets}`})},{type:'separator'},{role:'quit'}]},{label:'Edit',submenu:[{role:'undo'},{role:'redo'},{type:'separator'},{role:'cut'},{role:'copy'},{role:'paste'},{role:'selectAll'}]},{label:'View',submenu:[{role:'reload'},{role:'resetZoom'},{role:'zoomIn'},{role:'zoomOut'},{role:'togglefullscreen'},{type:'separator'},{role:'toggleDevTools'}]},{label:'Window',submenu:[{role:'minimize'},{role:'front'}]}]));
  createWindow();app.on('activate',()=>{if(!BrowserWindow.getAllWindows().length)createWindow();});
 }).catch(error=>{dialog.showErrorBox('Open Play could not start',error.message);app.quit();});
 app.on('window-all-closed',()=>app.quit());
 app.on('will-quit',()=>host?.server.close());
}
