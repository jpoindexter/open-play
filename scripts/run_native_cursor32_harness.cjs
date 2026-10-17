'use strict';
// Separate local diagnostic host, not a new product build or native audio engine.
const {app,BrowserWindow,Menu,dialog}=require('electron');
const path=require('node:path');
const {createAssetServer}=require('../desktop/server.cjs');
let host,window;
app.setName('Open Play Cursor32 Diagnostic');
app.whenReady().then(async()=>{
 host=await createAssetServer({root:path.resolve(__dirname,'..'),port:18787});
 window=new BrowserWindow({width:1180,height:900,title:'Open Play — 32ms cursor diagnostic',backgroundColor:'#171717',webPreferences:{partition:'open-play-cursor32-diagnostic-v1',nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true}});
 const own=url=>{try{return new URL(url).origin===host.origin;}catch{return false;}};
 window.webContents.session.setPermissionCheckHandler(()=>false);
 window.webContents.session.setPermissionRequestHandler((contents,permission,callback)=>callback(false));
 window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 window.webContents.on('will-navigate',(event,url)=>{if(!own(url))event.preventDefault();});
 window.on('page-title-updated',event=>event.preventDefault());
 window.on('closed',()=>window=null);
 Menu.setApplicationMenu(Menu.buildFromTemplate([{label:app.name,submenu:[{role:'quit'}]},{label:'Edit',submenu:[{role:'copy'},{role:'paste'},{role:'selectAll'}]},{label:'View',submenu:[{role:'reload'},{role:'toggleDevTools'}]}]));
 await window.loadURL(host.origin+'/prototype/keylock-engine-cursor32-harness.html');
 console.log(JSON.stringify({kind:'separate-native-test-host',pid:process.pid,electron:process.versions.electron,origin:host.origin,root:path.resolve(__dirname,'..'),physicalOutputsMutedByHarness:true,productBundleUnchanged:true}));
}).catch(error=>{dialog.showErrorBox('Cursor32 diagnostic could not start',error.message);app.quit();});
app.on('window-all-closed',()=>app.quit());
app.on('will-quit',()=>host?.server.close());
