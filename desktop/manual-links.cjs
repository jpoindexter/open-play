'use strict';
function createManualLinkHandler({contents,origin,openExternal,onError}){
 return ({url,postBody})=>{
  let target;
  try{
   target=new URL(url);
   if(new URL(contents.getURL()).origin!==origin||target.origin!=='https://open-play-help.vercel.app'||target.username||target.password||postBody)return{action:'deny'};
  }catch{return{action:'deny'};}
  // Keep remote content outside the audio renderer, even for the trusted manual.
  try{void Promise.resolve(openExternal(target.href)).catch(onError);}catch(error){onError(error);}
  return{action:'deny'};
 };
}
module.exports={createManualLinkHandler};
