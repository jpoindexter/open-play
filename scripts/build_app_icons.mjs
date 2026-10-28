import {execFileSync} from 'node:child_process';
import {mkdtemp,mkdir,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

const root=path.dirname(path.dirname(fileURLToPath(import.meta.url))),assets=path.join(root,'desktop/assets');
const temp=await mkdtemp(path.join(tmpdir(),'open-play-icons-'));
const resize=(source,size,out,dpi=72)=>execFileSync('sips',['-z',String(size),String(size),'-s','dpiWidth',String(dpi),'-s','dpiHeight',String(dpi),source,'--out',out],{stdio:'ignore'});
try{
 const iconset=path.join(temp,'OpenPlay.iconset');await mkdir(iconset);
 for(const size of [16,32,128,256,512])for(const scale of [1,2])
  resize(path.join(assets,'open-play-icon.png'),size*scale,path.join(iconset,`icon_${size}x${size}${scale===2?'@2x':''}.png`),72*scale);
 execFileSync('iconutil',['-c','icns','-o',path.join(assets,'open-play.icns'),iconset]);
 for(const scale of [1,2])resize(path.join(assets,'menu-icon-source.png'),16*scale,path.join(assets,`menuTemplate${scale===2?'@2x':''}.png`),72*scale);
 assert.equal((await readFile(path.join(assets,'open-play.icns'))).subarray(0,4).toString(),'icns');
 for(const [file,size]of [['menuTemplate.png',16],['menuTemplate@2x.png',32]]){
  const png=await readFile(path.join(assets,file));assert.equal(png.readUInt32BE(16),size);assert.equal(png.readUInt32BE(20),size);
 }
 console.log('Exported macOS app icon and 16/32px template icons.');
}finally{await rm(temp,{recursive:true,force:true});}
