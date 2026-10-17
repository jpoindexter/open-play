'use strict';
const checks=new Set();
function createWarpCheckWindow({BrowserWindow,host,version}){
  const title=`Open Play Warp Check ${version} — isolated shared-stem audio`;
  const check=new BrowserWindow({width:1440,height:1050,minWidth:1000,minHeight:700,title,backgroundColor:'#111111',webPreferences:{
    partition:'open-play-warp-check-'+Date.now(),nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true
  }});
  checks.add(check);
  const own=url=>{try{return new URL(url).origin===host.origin;}catch{return false;}};
  // The check records only the app's master bus. It needs no device permissions.
  check.webContents.session.setPermissionCheckHandler(()=>false);
  check.webContents.session.setPermissionRequestHandler((_contents,_permission,callback)=>callback(false));
  check.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  check.webContents.on('will-navigate',(event,url)=>{if(!own(url))event.preventDefault();});
  check.on('page-title-updated',event=>event.preventDefault());
  check.on('closed',()=>checks.delete(check));
  check.loadURL(host.origin+'/prototype/stem-coherence-harness.html');
  return check;
}
module.exports={createWarpCheckWindow};
