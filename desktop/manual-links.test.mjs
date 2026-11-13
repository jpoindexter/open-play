import test from 'node:test';
import assert from 'node:assert/strict';
import {createManualLinkHandler} from './manual-links.cjs';

test('manual links leave the renderer through the browser only from the app origin',async()=>{
 const origin='http://127.0.0.1:18775',opened=[],errors=[];
 let current=origin+'/prototype/workspace-preview.html',failure=null;
 const handler=createManualLinkHandler({contents:{getURL:()=>current},origin,
  openExternal:url=>{if(failure)throw failure;opened.push(url);return Promise.resolve();},onError:error=>errors.push(error)});
 const request=(url,postBody)=>{assert.deepEqual(handler({url,postBody}),{action:'deny'});};
 request('https://open-play-help.vercel.app/');
 request('https://open-play-help.vercel.app/?q=cue%20mix');
 assert.deepEqual(opened,['https://open-play-help.vercel.app/','https://open-play-help.vercel.app/?q=cue%20mix']);
 for(const url of ['https://support.serato.com/','https://open-play-help.vercel.app.attacker.invalid/','https://open-play-help.vercel.app:8443/','http://open-play-help.vercel.app/','https://user@open-play-help.vercel.app/','https://open-play-help.vercel.app@attacker.invalid/','javascript:alert(1)','file:///tmp/manual.html','not a URL'])request(url);
 request('https://open-play-help.vercel.app/',{data:[]});
 current='https://foreign.invalid/';request('https://open-play-help.vercel.app/');
 current='';request('https://open-play-help.vercel.app/');
 assert.equal(opened.length,2);assert.deepEqual(errors,[]);
 current=origin+'/prototype/';failure=Error('controlled browser failure');request('https://open-play-help.vercel.app/');
 assert.deepEqual(errors,[failure]);
 const rejected=Error('controlled asynchronous failure');
 const reject=createManualLinkHandler({contents:{getURL:()=>current},origin,openExternal:()=>Promise.reject(rejected),onError:error=>errors.push(error)});
 assert.deepEqual(reject({url:'https://open-play-help.vercel.app/'}),{action:'deny'});await Promise.resolve();
 assert.deepEqual(errors,[failure,rejected]);
});
