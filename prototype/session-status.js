// Recovery stays outside layout adapters so every deck layout keeps the same access.
export function installSessionStatus({storage,save,recover,backup,download}){
  const banner=document.createElement('section');banner.id='session-save-status';banner.hidden=true;
  banner.setAttribute('aria-label','Library save and recovery');
  banner.innerHTML='<p role="status" aria-live="polite"></p><button data-session-retry>Retry save</button><button data-session-backup>Export current backup</button><button data-session-original>Export original saved data</button><button data-session-recover>Keep original copy & save current session</button>';
  document.body.append(banner);
  const get=key=>banner.querySelector(`[data-session-${key}]`);
  get('retry').onclick=()=>save();
  get('backup').onclick=()=>download('open-play-library.json',JSON.stringify(backup(),null,2));
  get('original').onclick=()=>download('open-play-recovery-original.json',storage.status().original);
  get('recover').onclick=()=>recover();
  function update(){
    const {error,blocked,original}=storage.status();banner.hidden=!error;
    banner.querySelector('p').textContent=blocked
      ? `${error} Automatic saving is paused to protect the original. Stored audio is unchanged. Export the original data, then restore a valid backup in Library tools or save this recovery session.`
      : error||'';
    get('retry').hidden=blocked;get('original').hidden=!blocked||original===null;get('recover').hidden=!blocked;
  }
  update();return update;
}
