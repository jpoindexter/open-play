// Original media is copied only into this origin's local IndexedDB; never uploaded.
const failure=(name,message)=>Object.assign(new Error(message),{name});
const digest=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
export function createLocalAudioLibrary({factory=globalThis.indexedDB,name='openplay-local-audio-v1',openTimeoutMs=5000}={}){
  let opening=null,db=null,disposed=false;
  const active=new Set();
  const live=()=>{if(disposed)throw failure('InvalidStateError','Local audio store is closed.');};
  async function open(){
    live();if(db)return db;if(opening)return opening;
    if(!factory?.open)throw failure('NotSupportedError','Local audio storage is unavailable; imports remain session-only.');
    opening=new Promise((resolve,reject)=>{
      let settled=false;const request=factory.open(name,1);
      const finish=(error,result)=>{if(settled){result?.close();return;}settled=true;clearTimeout(timer);if(error)reject(error);else resolve(result);};
      const timer=setTimeout(()=>finish(failure('TimeoutError','Local audio storage did not open. Close another Open Play window and retry.')),openTimeoutMs);
      request.onupgradeneeded=()=>{if(disposed||settled){request.transaction.abort();return;}const next=request.result;for(const store of ['catalog','media'])if(!next.objectStoreNames.contains(store))next.createObjectStore(store,{keyPath:'id'});};
      request.onerror=()=>finish(request.error||failure('UnknownError','Cannot open local audio storage.'));
      request.onblocked=()=>finish(failure('InvalidStateError','Another Open Play window blocks local audio storage. Close it and retry.'));
      request.onsuccess=()=>{
        const result=request.result;
        if(disposed||settled){result.close();if(disposed)finish(failure('InvalidStateError','Local audio store is closed.'));return;}
        db=result;db.onversionchange=()=>{result.close();if(db===result){db=null;opening=null;}};finish(null,result);
      };
    });
    try{return await opening;}catch(error){opening=null;throw error;}
  }
  async function transaction(stores,mode,run){
    const database=await open();live();
    return new Promise((resolve,reject)=>{
      let result;const tx=database.transaction(stores,mode);active.add(tx);
      tx.oncomplete=()=>{active.delete(tx);resolve(result);};
      tx.onabort=()=>{active.delete(tx);reject(tx.error||failure('AbortError','Local audio transaction aborted.'))};
      tx.onerror=()=>{}; // The transaction's abort is the authoritative failure.
      try{run(tx,value=>{result=value;});}catch(error){try{tx.abort();}catch{}active.delete(tx);reject(error);}
    });
  }
  async function list(){return transaction(['catalog'],'readonly',(tx,set)=>{const request=tx.objectStore('catalog').getAll();request.onsuccess=()=>set(request.result);});}
  async function save(track,file,bytes){
    live();if(!(bytes instanceof ArrayBuffer)||!bytes.byteLength)throw new TypeError('Original audio bytes are required.');
    const hash=await digest(bytes);live();if(track.id!=='local-'+hash||track.contentHash!==hash)throw failure('DataError','Audio identity does not match its original bytes.');
    if(!file||typeof file.name!=='string'||file.size!==bytes.byteLength)throw failure('DataError','Audio file metadata does not match its bytes.');
    const catalog={...track,id:'local-'+hash,contentHash:hash,filename:file.name,fileSize:bytes.byteLength,mime:file.type||'',lastModified:file.lastModified||0,storedAt:new Date().toISOString()};
    // Never structured-clone transient File/decoder/functions or borrowed app state.
    for(const key of ['file','readFile','storage','storageError'])delete catalog[key];
    const media={id:catalog.id,blob:new Blob([bytes],{type:file.type||''})};
    return transaction(['catalog','media'],'readwrite',(tx,set)=>{tx.objectStore('catalog').put(catalog);tx.objectStore('media').put(media);set({...catalog,storage:'saved'});});
  }
  async function file(id){
    const pair=await transaction(['catalog','media'],'readonly',(tx,set)=>{
      const out={};set(out);for(const store of ['catalog','media']){const request=tx.objectStore(store).get(id);request.onsuccess=()=>{out[store]=request.result;};}
    });
    live();const catalog=pair?.catalog,blob=pair?.media?.blob;
    if(!catalog||!(blob instanceof Blob))throw failure('NotFoundError','Saved audio is missing. Re-import the original file; its library identity is preserved.');
    const bytes=await blob.arrayBuffer(),hash=await digest(bytes);live();
    if(id!=='local-'+hash||catalog.contentHash!==hash||catalog.fileSize!==bytes.byteLength)throw failure('DataError','Saved audio failed its identity check. Re-import the original file.');
    return new File([bytes],catalog.filename,{type:catalog.mime,lastModified:catalog.lastModified});
  }
  return{list,save,file,close(){if(disposed)return;disposed=true;for(const tx of active)try{tx.abort();}catch{}active.clear();db?.close();db=null;}};
}
