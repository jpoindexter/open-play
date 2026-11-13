export function createPerformancePanelNavigation({state,$,$$,render,returnToSettings}){
 let returnScroll=null;
 function close(){
  $('#panel').hidden=true;state.panel=null;returnScroll=null;
  $$('[data-panel]').forEach(button=>button.classList.remove('active'));
 }
 function bind(){
  const button=$('#close-panel');if(button)button.onclick=close;
  if(returnScroll===null)return;
  const back=document.createElement('button');back.id='panel-settings-back';back.type='button';
  back.textContent='Back to Settings';back.dataset.icon='back';back.dataset.iconOnly='false';
  back.onclick=()=>{const scroll=returnScroll;close();returnToSettings(scroll);};
  $('#panel .panel-head')?.prepend(back);
 }
 return{
  open(name,settingsScroll=null){
   if(state.panel===name&&!$('#panel').hidden&&settingsScroll===null){close();return;}
   returnScroll=settingsScroll;state.panel=name;$('#panel').hidden=false;render(name);bind();
   $$('[data-panel]').forEach(button=>button.classList.toggle('active',button.dataset.panel===name));
  },
  refresh(){if(state.panel)render(state.panel);bind();}
 };
}
