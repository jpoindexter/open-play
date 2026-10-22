import {validateSavedState} from './library-state.js';
export const sessionKey='openplay-review-v1';
export function createSessionStorage(storage){
  let raw=null,error=null,blocked=false,recoveryKey=null;
  const status=()=>({error,blocked,recoveryKey,original:raw});
  function reject(cause){blocked=true;error=`Saved session could not be loaded. ${cause.message}`;}
  function load(){
    try{raw=storage.getItem(sessionKey);return raw===null?{}:validateSavedState(JSON.parse(raw));}
    catch(cause){reject(cause);return {};}
  }
  function save(value){
    if(blocked)return false;
    try{storage.setItem(sessionKey,JSON.stringify(value));error=null;return true;}
    catch{error='Changes are not saved. Keep this window open and export a backup, or retry saving.';return false;}
  }
  function recover(value){
    if(!blocked)return save(value);
    try{
      // Keep the rejected record before allowing any replacement or later autosave.
      if(raw!==null){
        let suffix=Date.now();do{recoveryKey=`${sessionKey}-recovery-${suffix++}`;}while(storage.getItem(recoveryKey)!==null);
        storage.setItem(recoveryKey,raw);
      }else if(storage.getItem(sessionKey)!==null)throw Error('Reopen to read the original session first.');
      storage.setItem(sessionKey,JSON.stringify(value));blocked=false;error=null;return true;
    }catch{error='Recovery could not be saved. The original session is unchanged. Export your current backup and original data before closing.';return false;}
  }
  return{load,save,recover,status,reject};
}
