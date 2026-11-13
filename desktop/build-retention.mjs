import {readdir,access} from 'node:fs/promises';
import path from 'node:path';

export async function assertBuildRetention(root,name){
 const entries=await readdir(root,{withFileTypes:true}).catch(error=>{if(error.code==='ENOENT')return[];throw error;});
 const bundles=[];
 for(const entry of entries){
  if(!entry.isDirectory()||!/^0\.1\.\d+$/.test(entry.name))continue;
  const output=path.join(root,entry.name,`${name}-darwin-${process.arch}`,`${name}.app`);
  try{await access(path.join(output,'Contents','Info.plist'));bundles.push(output);}
  catch(error){if(error.code!=='ENOENT')throw error;}
 }
 if(bundles.length>=2)throw Error(`Clean up superseded Open Play builds before packaging: ${bundles.length} app bundles already exist; keep at most the current app and one staged candidate. Profiles and recordings must be preserved.`);
 return bundles;
}
