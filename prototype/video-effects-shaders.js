// Original algorithms. No vendor shader or resource code is used.
export const videoVertexShader = `#version 300 es
in vec2 position;
out vec2 uv;
void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
export const videoFragmentShader = `#version 300 es
precision highp float;
precision highp sampler2DArray;
in vec2 uv;
out vec4 outputColor;
uniform sampler2D inputFrame;
uniform sampler2D holdFrame;
uniform sampler2D backgroundFrame;
uniform sampler2DArray historyFrames;
uniform int effect;
uniform int historyLayers[16];
uniform float amount;
uniform float time;
uniform float bpm;
uniform float level;
uniform float upfader;
uniform float rate;
uniform float recordPosition;
uniform float reducedMotion;
uniform float hasBackground;
uniform float outputPremultiplied;
uniform vec2 resolution;
uniform vec3 bands;
uniform float spectrum8[8];
uniform vec3 columns;
uniform vec4 p;
uniform vec4 q;
const float PI=3.141592653589793;
const float TAU=6.283185307179586;
float luma(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}
vec4 premul(vec4 c){return vec4(c.rgb*c.a,c.a);}
vec4 straight(vec4 c){return vec4(c.a>.00001?c.rgb/c.a:vec3(0.),c.a);}
vec4 encodeOutput(vec4 c){return outputPremultiplied>.5?premul(c):c;}
vec4 blend(vec4 a,vec4 b,float value){return straight(mix(premul(a),premul(b),value));}
vec4 source(vec2 point){
 if(any(lessThan(point,vec2(0.)))||any(greaterThan(point,vec2(1.))))return vec4(0.);
 return straight(texture(inputFrame,point));
}
vec2 rotatePoint(vec2 point,float angle){
 vec2 v=point-.5;v.x*=resolution.x/resolution.y;
 float cs=cos(angle),sn=sin(angle);v=mat2(cs,-sn,sn,cs)*v;
 v.x/=resolution.x/resolution.y;return v+.5;
}
vec4 blurAt(vec2 point,float radius){
 vec2 d=vec2(radius)/resolution;
 vec4 sum=premul(source(point))*.25;
 sum+=(premul(source(point+vec2(d.x,0.)))+premul(source(point-vec2(d.x,0.)))+premul(source(point+vec2(0.,d.y)))+premul(source(point-vec2(0.,d.y))))*.125;
 sum+=(premul(source(point+d))+premul(source(point-d))+premul(source(point+vec2(d.x,-d.y)))+premul(source(point+vec2(-d.x,d.y))))*.0625;
 return straight(sum);
}
float edgeAt(vec2 point){
 vec2 d=1./resolution;
 float dx=luma(source(point+vec2(d.x,0.)).rgb)-luma(source(point-vec2(d.x,0.)).rgb);
 float dy=luma(source(point+vec2(0.,d.y)).rgb)-luma(source(point-vec2(0.,d.y)).rgb);
 return clamp(length(vec2(dx,dy))*2.,0.,1.);
}
vec3 hueRotate(vec3 c,float angle){
 vec3 axis=normalize(vec3(1.));float cs=cos(angle),sn=sin(angle);
 return c*cs+cross(axis,c)*sn+axis*dot(axis,c)*(1.-cs);
}
float hueOf(vec3 c){
 float hi=max(c.r,max(c.g,c.b)),lo=min(c.r,min(c.g,c.b)),d=hi-lo;
 if(d<.00001)return 0.;
 float h=hi==c.r?(c.g-c.b)/d:hi==c.g?2.+(c.b-c.r)/d:4.+(c.r-c.g)/d;
 return fract(h/6.+1.);
}
vec2 kaleido(vec2 point,float sectors,float angle){
 vec2 v=point-.5;v.x*=resolution.x/resolution.y;
 float radius=length(v),segment=TAU/max(2.,sectors),a=atan(v.y,v.x)+angle;
 a=abs(mod(a,segment)-segment*.5);
 v=vec2(cos(a),sin(a))*radius;v.x/=resolution.x/resolution.y;return v+.5;
}
vec4 over(vec4 front,vec4 back){
 float alpha=front.a+back.a*(1.-front.a);
 return vec4(alpha>.00001?(front.rgb*front.a+back.rgb*back.a*(1.-front.a))/alpha:vec3(0.),alpha);
}
vec3 bandColor(float band){return band<.5?vec3(1.,.2,.1):band<1.5?vec3(.15,1.,.3):vec3(.2,.4,1.);}
float bandAt(int n){return n==0?bands.x:n==1?bands.y:bands.z;}
void main(){
 vec4 c=source(uv),z=c;
 if(effect<0||amount<=0.){outputColor=encodeOutput(c);return;}
 if(effect==0){
  vec4 low=blurAt(uv,p.y),wide=blurAt(uv,p.y*2.);
  z=p.x<.5?low:p.x<1.5?vec4(c.rgb-low.rgb+.5,c.a):vec4(low.rgb-wide.rgb+.5,c.a);
  z=blend(c,z,amount);
 }else if(effect==1){
  vec2 grid=vec2(p.x);vec2 cell=floor(uv*grid);int tile=int(mod(cell.x+cell.y*grid.x,16.));
  z=blend(c,straight(texture(historyFrames,vec3(fract(uv*grid),float(historyLayers[tile])))),amount);
 }else if(effect==2){if(p.x>.5)z=blend(c,straight(texture(holdFrame,uv)),amount);
 }else if(effect==3){
  float period=p.x>0.?p.x:60./bpm*p.z;
  float wave=.5-.5*cos(TAU*time/max(.001,period));
  float distance=min(min(uv.x,1.-uv.x),min(uv.y,1.-uv.y));
  float border=1.-smoothstep(0.,p.y,distance);
  z.a=c.a*(1.-amount*wave*border*(1.-reducedMotion));
 }else if(effect==4){
  if(p.w>.5)z.rgb=mix(c.rgb,c.rgb*vec3(1.,.15,.15),amount*bands.x);
  else{float distance=abs(hueOf(c.rgb)-p.x/360.);distance=min(distance,1.-distance);float keep=1.-smoothstep(p.y,p.y+p.z,distance);z.rgb=mix(c.rgb,mix(vec3(luma(c.rgb)),c.rgb,keep*bands.x),amount);}
 }else if(effect==5){
  float pulse=fract(time*bpm/60./max(.125,p.x))<p.y?1.:0.;
  z.rgb=mix(c.rgb,vec3(1.),amount*pulse*(1.-reducedMotion));
 }else if(effect==6){
  float count=max(2.,floor(p.x));float panel=floor(uv.x*count);
  vec2 point=vec2(fract(uv.x*count),fract(uv.y+mod(panel,2.)*.5));z=blend(c,source(point),amount);
 }else if(effect==7){
  float count=1.+floor(amount*level*8.);float row=floor(uv.y*count);
  z=reducedMotion>.5?c:source(vec2(fract(uv.x+mod(row,2.)*.25*amount*level),fract(uv.y*count)));
 }else if(effect==8){z.a*=mix(1.,level,amount);
 }else if(effect==9){
  int b=min(2,int(floor(uv.x*3.)));float h=bandAt(b);
  float bar=step(uv.y,h)*step(.12,fract(uv.y*20.))*step(.08,fract(uv.x*3.))*step(fract(uv.x*3.),.92);
  z.rgb=mix(c.rgb,bandColor(float(b)),bar*amount);
 }else if(effect==10){
  int b=min(2,int(floor(uv.x*3.)));z.a*=mix(1.,step(uv.y,bandAt(b)),amount);
 }else if(effect==11){z=source(rotatePoint(uv,recordPosition*TAU*p.x*amount*(1.-reducedMotion)));
 }else if(effect==12){
  float radius=length((uv-.5)*vec2(resolution.x/resolution.y,1.));
  float mask=1.-smoothstep(.6-amount*.4,.75-amount*.4,radius);z.a*=mix(1.,mask*(.25+.75*clamp(abs(rate),0.,1.)),amount);
 }else if(effect==13){z.a*=mix(1.,clamp(abs(rate),0.,1.),amount);
 }else if(effect==14||effect==16){z=blurAt(uv,amount*(effect==14?bands.x:bands.z)*12.);
 }else if(effect==15||effect==17){z=reducedMotion>.5?c:source((uv-.5)/(1.+amount*(effect==15?bands.x:bands.z)*2.)+.5);
 }else if(effect==18){z.rgb=mix(c.rgb,c.rgb*p.xyz,amount);
 }else if(effect==19){z.rgb=c.rgb*(vec3(1.)+bands*amount);
 }else if(effect==20){
  vec3 hue=hueRotate(c.rgb,p.x*PI/180.);z.rgb=mix(c.rgb,vec3(luma(hue))+(hue-vec3(luma(hue)))*p.y+vec3(p.z),amount);
 }else if(effect==21){
  vec3 hue=hueRotate(c.rgb,bands.x*TAU);z.rgb=mix(c.rgb,vec3(luma(hue))+(hue-vec3(luma(hue)))*(1.+bands.y)+vec3(bands.z*.3),amount);
 }else if(effect==22){z.rgb=c.rgb+vec3(amount*(upfader-.5)*2.*p.x);
 }else if(effect==23){
  if(p.w>.5){
   vec2 direction=vec2(cos(p.z),sin(p.z))/resolution*amount*20.;z=vec4(0.);float total=0.;
   for(int i=0;i<9;i++){float weight=exp(-float(i)*.35);z+=premul(source(uv-direction*float(i)))*weight;total+=weight;}z=straight(z/total);
  }else if(p.x>0.){
   vec2 ray=(uv-.5)*resolution;vec2 direction=length(ray)>.00001?normalize(ray):vec2(0.);vec4 sum=vec4(0.);
   for(int i=0;i<9;i++){vec2 point=clamp(uv+direction*p.x*float(i)/8./resolution,.5/resolution,1.-.5/resolution);sum+=premul(source(point))/9.;}
   float distance=min(min(uv.x,1.-uv.x),min(uv.y,1.-uv.y));float edge=1.-smoothstep(0.,p.y,distance);z=blend(c,straight(sum),amount*edge);
  }
 }else if(effect==24){
  vec2 point=uv;if(p.x<.5||p.x>1.5)point.x=min(uv.x,1.-uv.x);if(p.x>.5)point.y=max(uv.y,1.-uv.y);z=blend(c,source(point),amount);
 }else if(effect==25){z=blend(c,source(kaleido(uv,p.x,p.y)),amount);
 }else if(effect==26){z=blend(c,source(kaleido(uv,3.+floor(bands.y*9.),bands.x*PI)),amount*level*(1.-reducedMotion));
 }else if(effect==27){float grey=luma(c.rgb);z.rgb=mix(c.rgb,vec3(grey)+(c.rgb-vec3(grey))*p.x,amount);
 }else if(effect==28){z.rgb=(c.rgb-.5)*(1.+amount*3.)+.5;
 }else if(effect==29){float exponent=p.w>.5?1./mix(1.,p.y,amount):mix(1.,p.x,amount);z.rgb=pow(max(c.rgb,vec3(0.)),vec3(exponent));
 }else if(effect==30){
  float distance=abs(hueOf(c.rgb)-p.x/360.);distance=min(distance,1.-distance);
  float keep=1.-smoothstep(p.y,p.y+p.z,distance);z.rgb=mix(c.rgb,mix(vec3(luma(c.rgb)),c.rgb,keep),amount);
 }else if(effect==31){
  if(p.w>.5){vec3 neon=max(c.rgb-vec3(.2),vec3(0.))*vec3(.6,.3,1.8)+edgeAt(uv)*vec3(.1,.8,.9);z.rgb=mix(c.rgb,neon,amount);}
  else{float hi=max(c.r,max(c.g,c.b)),lo=min(c.r,min(c.g,c.b));float colorful=hi>.00001?(hi-lo)/hi:0.;float gate=smoothstep(p.x,p.x+p.y,colorful);
   vec3 hue=clamp(abs(fract(vec3(hueOf(c.rgb))+vec3(0.,2./3.,1./3.))*6.-3.)-1.,0.,1.);z.rgb=mix(c.rgb,hue*gate,amount);}
 }else if(effect==32){
  vec2 d=vec2(amount*p.x/resolution.x,0.);z=vec4(source(uv-d).r,source(uv+d).gb,c.a);
 }else if(effect==33||effect==34||effect==35){
  float keep;
  if(effect==33)keep=smoothstep(amount-p.x,amount+p.x,luma(c.rgb));
  else if(effect==34)keep=1.-smoothstep(1.-amount-p.x,1.-amount+p.x,luma(c.rgb));
  else{float dominance=c.g-max(c.r,c.b);float threshold=.65*(1.-amount);keep=1.-smoothstep(threshold-p.x,threshold+p.x,dominance);z.g-=max(0.,dominance)*(1.-keep)*p.y;}
  z.a*=keep;if(hasBackground>.5)z=over(z,straight(texture(backgroundFrame,uv)));
 }else if(effect==36){z.rgb=mix(c.rgb,step(vec3(.5),c.rgb)*(1.-edgeAt(uv)*.8),amount);
 }else if(effect==37){
  vec2 d=vec2(1.)/resolution;float relief=luma(source(uv+d).rgb)-luma(source(uv-d).rgb);z.rgb=mix(c.rgb,vec3(.5+relief*2.),amount);
 }else if(effect==38){z.rgb=c.rgb+(c.rgb-blurAt(uv,1.5).rgb)*amount*3.;
 }else if(effect==39){z=blurAt(uv,amount*10.);
 }else if(effect==40){z.rgb=mix(c.rgb,vec3(edgeAt(uv)),amount);
 }else if(effect==41){
  float cell=2.+amount*12.;vec2 point=(floor(uv*resolution/cell)+.5)*cell/resolution;
  float aperture=1.-smoothstep(.35,.46,length(fract(uv*resolution/cell)-.5));z=source(point);z.rgb*=aperture;
 }else if(effect==42){
  vec2 point=uv;point.y=fract(point.y+amount*(.15+.15*sin(time*7.))*(1.-reducedMotion));
  point.x=fract(point.x+amount*.02*sin(floor(uv.y*resolution.y/3.)+time*20.)*(1.-reducedMotion));z=source(point);
 }else if(effect==43){float levels=2.+floor((1.-amount)*14.);z.rgb=floor(c.rgb*(levels-1.)+.5)/(levels-1.);
 }else if(effect==44){z.rgb=mix(c.rgb,1.-c.rgb,amount);
 }else if(effect==45){
  float grey=luma(c.rgb);vec3 warm=grey*vec3(1.2,1.,.72);z.rgb=mix(c.rgb,warm,amount);
 }else if(effect==46){
  vec3 smoothColor=blurAt(uv,2.).rgb;vec3 paint=floor(smoothColor*5.+.5)/5.;paint*=1.-smoothstep(.08,.4,edgeAt(uv));z.rgb=mix(c.rgb,paint,amount);
 }else if(effect==47){z=source(rotatePoint(uv,p.x*PI/180.*amount));
 }else if(effect==48){z=source((uv-p.yz)/mix(1.,p.x,amount)+p.yz);
 }else if(effect==49){float count=1.+floor(amount*(p.x-1.));z=source(fract(uv*count));
 }else if(effect==50){z=source(fract((uv-.5)*(.25+amount*5.)+.5));
 }else if(effect==51){float l=luma(c.rgb);vec3 heat=vec3(smoothstep(0.,.5,l),1.-abs(2.*l-1.),1.-smoothstep(.5,1.,l));z.rgb=mix(c.rgb,heat,amount);
 }else if(effect==52){
  if(p.w>.5){int b=min(2,int(floor(uv.x*3.)));z.rgb=mix(c.rgb,bandColor(float(b))*step(uv.y,bandAt(b)),amount);}
  else if(p.z>.5){int b=min(7,int(floor(uv.x*8.)));float height=clamp(spectrum8[b]*p.y,0.,1.);vec3 color=clamp(abs(fract(vec3(p.x/360.)+vec3(0.,2./3.,1./3.))*6.-3.)-1.,0.,1.);z.rgb=mix(c.rgb,color*step(uv.y,height),amount);}
 }else if(effect==53){float x=clamp((uv.x-.166667)*3.,0.,2.);float height=x<1.?mix(bands.x,bands.y,x):mix(bands.y,bands.z,x-1.);float line=1.-smoothstep(.008,.025,abs(uv.y-height));z.rgb=mix(c.rgb,c.rgb*.2+vec3(line),amount);
 }else if(effect==54){int b=min(2,int(floor(uv.x*3.)));float height=.1+.9*(b==0?columns.x:b==1?columns.y:columns.z);vec4 block=source(vec2(fract(uv.x*3.),uv.y/max(.1,height)));block.a*=step(uv.y,height);z=reducedMotion>.5?c:blend(c,block,amount);
 }
 outputColor=encodeOutput(vec4(clamp(z.rgb,0.,1.),clamp(z.a,0.,1.)));
}`;
