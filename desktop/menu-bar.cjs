'use strict';
function createMenuBar({Tray,Menu,nativeImage,getWindow,origin,iconPath,quit}){
 const icon=nativeImage.createFromPath(iconPath);
 if(icon.isEmpty()){console.error('Open Play menu bar icon could not load.');return null;}
 icon.setTemplateImage(true);
 const tray=new Tray(icon);
 function show(){
  const window=getWindow();if(!window||window.isDestroyed())return null;
  if(window.isMinimized())window.restore();window.show();window.focus();return window;
 }
 function openPanel(panel){
  const window=show();if(!window)return;
  const contents=window.webContents;
  const open=()=>{
   if(window!==getWindow()||window.isDestroyed()||contents.isDestroyed())return;
   try{
    if(new URL(contents.getURL()).origin!==origin)return;
    const script=`if(location.origin===${JSON.stringify(origin)}){const button=document.querySelector(${JSON.stringify(`[data-panel="${panel}"]`)});if(button&&!button.disabled&&!button.closest('[inert]'))button.click();}`;
    void contents.executeJavaScript(script).catch(error=>console.error('Open Play menu action could not open:',error.message));
   }catch(error){console.error('Open Play menu action could not open:',error.message);}
  };
  if(contents.isLoading())contents.once('did-finish-load',open);else open();
 }
 tray.setToolTip('Open Play');
 tray.setContextMenu(Menu.buildFromTemplate([
  {label:'Show Open Play',click:show},
  {label:'Settings…',click:()=>openPanel('settings')},
  {label:'Audio Devices…',click:()=>openPanel('hardware')},
  {label:'Help',click:()=>openPanel('help')},
  {type:'separator'},
  {label:'Quit',click:quit},
 ]));
 return tray;
}
module.exports={createMenuBar};
