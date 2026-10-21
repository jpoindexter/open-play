import {createBeatgrid} from './beatgrid.js';
import {paintSourceDetail} from './source-waveform.js';
import {paintStemDetail} from './stem-waveform.js';
import {performanceColors as ink} from './performance-tokens.js';

// Drawing only: positions/rates come from the engine, never from other lanes.
export function paintDetailWaveforms(c,{width:w,height:h,horizontal,decks,span,position,buffer,view,colors}){
  c.clearRect(0,0,w,h);
  const count=decks.length;
  for(const [index,d]of decks.entries()){
    const x=horizontal?0:index*w/count,y=horizontal?index*h/count:0;
    const width=horizontal?w:w/count,height=horizontal?h/count:h;
    const ruler=horizontal?(height<40?14:18):Math.min(22,width*.3);
    const plot=horizontal?{x,y:y+ruler,width,height:Math.max(1,height-ruler)}:{x:x+ruler,y,width:Math.max(1,width-ruler),height};
    c.save();c.beginPath();c.rect(x,y,width,height);c.clip();
    const t=d.track,p=t?position(d):0,buf=t?buffer(d):null,wave=t?view(d):null,sourceSpan=span*Math.max(.25,Math.min(4,d.rate||1));
    c.fillStyle=ink.waveBackground;c.fillRect(x,y,width,height);
    const along=time=>((time-p)/sourceSpan+.5)*(horizontal?width:height);
    const length=horizontal?width:height;
    function line(time,color,thickness=1,halo=false){
      const at=along(time);if(at<0||at>length)return;
      const draw=(size,paint)=>{c.fillStyle=paint;if(horizontal)c.fillRect(x+at-size/2,plot.y,size,plot.height);else c.fillRect(plot.x,y+at-size/2,plot.width,size);};
      if(halo)draw(thickness+2,ink.waveBackground);
      draw(thickness,color);
    }
    const grid=t&&createBeatgrid(t);
    if(t){
      if(wave.kind==='stems'&&!horizontal)paintStemDetail(c,wave.profile,{x:plot.x,width:plot.width,height,position:p,span:sourceSpan,color:colors[d.index]});
      else if(wave.kind!=='pending'&&buf)paintSourceDetail(c,buf,{...plot,position:p,span:sourceSpan,vertical:!horizontal});
      c.fillStyle=ink.wavePast;
      if(horizontal)c.fillRect(plot.x,plot.y,plot.width/2,plot.height);else c.fillRect(plot.x,plot.y,plot.width,plot.height/2);
      for(const beat of grid?.lines(p-sourceSpan/2,p+sourceSpan/2)||[]){
        if(beat.time<0||beat.time>t.duration)continue;
        line(beat.time,beat.downbeat?ink.waveDownbeat:ink.waveBeatGuide,beat.downbeat?1.5:1,beat.downbeat);
      }
      for(const marker of t.gridWarpMarkers||[])line(marker.time,colors[0],2,true);
      c.font='bold 11px Arial';
      for(const [i,q]of t.cues.entries())if(q){
        line(q.position,colors[i%8],2,true);const at=along(q.position);
        if(at>=0&&at<=length){c.fillStyle=ink.waveBackground;c.fillRect(horizontal?x+at+2:plot.x+plot.width-15,horizontal?plot.y+2:y+at-13,14,13);c.fillStyle=colors[i%8];c.fillText(String(i+1),horizontal?x+at+4:plot.x+plot.width-12,horizontal?plot.y+12:y+at-3);}
      }
    }
    // The ruler is separate from frequency color; thickness/text also encode bars.
    c.fillStyle=ink.waveRuler;if(horizontal)c.fillRect(x,y,width,ruler);else c.fillRect(x,y,ruler,height);
    c.font='11px Arial';c.textBaseline='alphabetic';
    let lastLabel=-Infinity;
    for(const beat of grid?.lines(p-sourceSpan/2,p+sourceSpan/2)||[]){
      if(beat.time<0||beat.time>t.duration)continue;
      const at=along(beat.time),major=beat.downbeat;
      c.fillStyle=major?ink.wavePlayhead:ink.waveBeat;
      if(horizontal)c.fillRect(x+at-(major?1:0),y+ruler-(major?8:4),major?2:1,major?8:4);
      else c.fillRect(x+ruler-(major?8:4),y+at-(major?1:0),major?8:4,major?2:1);
      if(!major||at<0||at>length||at-lastLabel<42)continue;
      if(horizontal&&(at<100||Math.abs(at-width/2)<30))continue;
      if(!horizontal&&(at<22||Math.abs(at-height/2)<16))continue;
      c.fillStyle=ink.waveText;
      c.fillText(String(beat.bar),horizontal?x+at+4:x+2,horizontal?y+ruler-5:y+at-4);
      lastLabel=at;
    }
    const phase=grid?.beatAt(p),beat=Number.isFinite(phase)&&phase>=0?Math.floor(phase):null;
    const status=beat===null?(grid?'LEAD-IN':width<110?'—':'NO GRID'):`${Math.floor(beat/4)+1}.${beat%4+1}`;
    const label=`${'ABCD'[d.index]} · ${status}`;
    c.font='bold 11px Arial';c.fillStyle=ink.waveRuler;c.fillRect(x,y,Math.min(width,96),horizontal?ruler:18);
    c.fillStyle=ink.waveText;c.fillText(label,x+4,y+12);
    c.fillStyle=ink.waveLaneDivider;
    if(horizontal)c.fillRect(x,y+height-1,width,1);else c.fillRect(x+width-1,y,1,height);
    // Dark surround keeps the single shared NOW position visible over RGB peaks.
    c.fillStyle=ink.waveBackground;
    if(horizontal)c.fillRect(w/2-3,y,6,height);else c.fillRect(x,h/2-3,width,6);
    c.fillStyle=ink.wavePlayhead;
    if(horizontal)c.fillRect(w/2-1,y,2,height);else c.fillRect(x,h/2-1,width,2);
    c.font='bold 10px Arial';
    const labelX=horizontal?w/2+5:x+Math.min(24,width*.32),labelY=horizontal?y+11:h/2-5;
    if(horizontal||index===0){c.fillStyle=ink.waveBackground;c.fillRect(labelX-2,labelY-10,26,12);c.fillStyle=ink.wavePlayhead;c.fillText('NOW',labelX,labelY);}
    c.restore();
  }
}
