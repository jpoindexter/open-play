// Original CD+G interpreter from documented packet facts. No external decoder
// code/assets copied. Serato visual parity, selective tile channels and parity
// correction are unverified. All tile channels are played together.
export const CDG_FORMAT = Object.freeze({packetBytes:24, packetsPerSecond:300,
  width:300,height:216,cropWidth:288,cropHeight:192,channelPolicy:'all channels',parityCorrection:false});
const WIDTH=300, HEIGHT=216, SIZE=WIDTH*HEIGHT;
const freshCounts = () => ({decodedPackets:0,graphicsPackets:0,timingPackets:0,
  unknownCommands:0,unknownInstructions:0,invalidTiles:0,invalidScrollPackets:0,
  invalidScrollFields:0,memoryPresets:0,memoryRepeatPackets:0,tilePackets:0,
  tilePacketsWithChannelBits:0,packetsWithParityData:0});

/** Input is copied. packetCursor is the number of complete packets consumed:
 * packet0 has PTS0, so nonempty renderAt(0) returns cursor1. Every packet keeps
 * its timeline slot, including timing/unknown/malformed packets.
 * Stream diagnostic counts describe only the current replay prefix, never the
 * total work across seeks. Separately named lifetime counters expose that work.
 * Full frames preserve physical border pixels; fine offsets sample the visible
 * [6,294)x[12,204) viewport. crop:true returns only that288x192 viewport.
 * This presentation/recovery policy is independent; no vendor parity is claimed.
 */
export function createCDGDecoder(input,{transparency='index'}={}) {
  if (!(input instanceof Uint8Array)) throw new TypeError('CD+G input must be a Uint8Array.');
  if (!['index','alpha-table'].includes(transparency)) throw new RangeError('Choose an explicit CD+G transparency profile: index or alpha-table.');
  let bytes=new Uint8Array(input),indices=new Uint8Array(SIZE),scratch=new Uint8Array(SIZE),
    palette=new Uint8Array(16*3),alpha=new Uint8Array(16).fill(255);
  const totalPackets=Math.floor(bytes.length/24),trailingBytes=bytes.length%24;
  let packetCursor=0,hOffset=0,vOffset=0,counts=freshCounts(),disposed=false,
    renderCallsLifetime=0,replaysLifetime=0,resetsLifetime=0,processedPacketsLifetime=0;
  const available=()=>{if(disposed)throw new Error('CD+G decoder is disposed.');};
  function clear() {
    indices.fill(0);scratch.fill(0);palette.fill(0);alpha.fill(255);
    packetCursor=0;hOffset=0;vOffset=0;counts=freshCounts();
  }
  function packet(offset) {
    counts.decodedPackets++;processedPacketsLifetime++;
    if ([2,3,20,21,22,23].some(index=>bytes[offset+index]!==0)) counts.packetsWithParityData++;
    const command=bytes[offset]&63,instruction=bytes[offset+1]&63,d=offset+4;
    if(command!==9){if(command===0)counts.timingPackets++;else counts.unknownCommands++;return;}
    counts.graphicsPackets++;
    if(instruction===1) {
      indices.fill(bytes[d]&15);counts.memoryPresets++;
      if(bytes[d+1]&15)counts.memoryRepeatPackets++;
    } else if(instruction===2) {
      const color=bytes[d]&15;
      for(let y=0;y<HEIGHT;y++) {
        if(y<12||y>=204)indices.fill(color,y*WIDTH,(y+1)*WIDTH);
        else {indices.fill(color,y*WIDTH,y*WIDTH+6);indices.fill(color,y*WIDTH+294,(y+1)*WIDTH);}
      }
    } else if(instruction===6||instruction===38) {
      counts.tilePackets++;
      if((bytes[d]|bytes[d+1])&48)counts.tilePacketsWithChannelBits++;
      const row=bytes[d+2]&31,column=bytes[d+3]&63;
      if(row>=18||column>=50){counts.invalidTiles++;return;}
      const colors=[bytes[d]&15,bytes[d+1]&15],x=column*6,y=row*12;
      for(let j=0;j<12;j++)for(let i=0;i<6;i++) {
        const index=(y+j)*WIDTH+x+i,color=colors[(bytes[d+4+j]>>(5-i))&1];
        indices[index]=instruction===38 ? indices[index]^color : color;
      }
    } else if(instruction===20||instruction===24) {
      const horizontal=(bytes[d+1]&48)>>4,vertical=(bytes[d+2]&48)>>4,
        fineX=bytes[d+1]&7,fineY=bytes[d+2]&15;
      const invalid=Number(horizontal===3)+Number(vertical===3)+Number(fineX>5)+Number(fineY>11);
      if(invalid){counts.invalidScrollPackets++;counts.invalidScrollFields+=invalid;}
      hOffset=Math.min(5,fineX);vOffset=Math.min(11,fineY);
      const dx=horizontal===1?6:horizontal===2?-6:0,dy=vertical===1?12:vertical===2?-12:0;
      if(!dx&&!dy)return;
      const fill=bytes[d]&15,wrap=instruction===24;
      for(let y=0;y<HEIGHT;y++)for(let x=0;x<WIDTH;x++) {
        let sx=x-dx,sy=y-dy;
        if(wrap){sx=(sx+WIDTH)%WIDTH;sy=(sy+HEIGHT)%HEIGHT;}
        scratch[y*WIDTH+x]=sx<0||sx>=WIDTH||sy<0||sy>=HEIGHT?fill:indices[sy*WIDTH+sx];
      }
      [indices,scratch]=[scratch,indices];
    } else if(instruction===30||instruction===31) {
      const base=instruction===30?0:8;
      for(let i=0;i<8;i++) {
        const packed=((bytes[d+2*i]&63)<<6)|(bytes[d+2*i+1]&63),out=(base+i)*3;
        palette[out]=((packed>>8)&15)*17;palette[out+1]=((packed>>4)&15)*17;palette[out+2]=(packed&15)*17;
      }
    } else if(instruction===28) {
      if(transparency==='index'){alpha.fill(255);alpha[bytes[d]&15]=0;}
      else for(let i=0;i<16;i++)alpha[i]=255-((bytes[d+i]&63)*4);
    } else counts.unknownInstructions++;
  }
  function diagnostics() {
    return {disposed,transparencyProfile:transparency,channelPolicy:'all channels',parityCorrection:false,
      totalPackets,trailingBytes,packetCursor,endOfStream:packetCursor===totalPackets,
      horizontalOffset:hOffset,verticalOffset:vOffset,...counts,
      renderCallsLifetime,replaysLifetime,resetsLifetime,processedPacketsLifetime,
      retainedInputBytes:disposed?0:bytes.length};
  }
  function renderAt(seconds,{crop=false}={}) {
    available();
    if(typeof seconds!=='number'||!Number.isFinite(seconds)||seconds<0)throw new RangeError('CD+G time must be finite, nonnegative original-track seconds.');
    if(typeof crop!=='boolean')throw new TypeError('CD+G crop must be a boolean.');
    renderCallsLifetime++;
    const target=seconds>=totalPackets/300?totalPackets:Math.min(totalPackets,Math.floor(seconds*300)+1);
    if(target<packetCursor){clear();replaysLifetime++;}
    while(packetCursor<target){packet(packetCursor*24);packetCursor++;}
    const width=crop?288:WIDTH,height=crop?192:HEIGHT,data=new Uint8ClampedArray(width*height*4);
    for(let y=0;y<height;y++)for(let x=0;x<width;x++) {
      const viewport=crop||(x>=6&&x<294&&y>=12&&y<204),
        sx=x+(crop?6:0)+(viewport?hOffset:0),sy=y+(crop?12:0)+(viewport?vOffset:0),
        index=indices[sy*WIDTH+sx],color=index*3,out=(y*width+x)*4;
      data[out]=palette[color];data[out+1]=palette[color+1];data[out+2]=palette[color+2];data[out+3]=alpha[index];
    }
    return {width,height,data,packetCursor,diagnostics:diagnostics()};
  }
  function reset(){available();clear();resetsLifetime++;}
  function dispose(){if(disposed)return;bytes=indices=scratch=palette=alpha=null;disposed=true;}
  return {renderAt,reset,dispose,diagnostics};
}
