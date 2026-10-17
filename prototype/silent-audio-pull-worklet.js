// Pull every independent source while emitting only zero. This graph must never
// feed stem histories, effects or an audible gain route.
class SilentAudioPull extends AudioWorkletProcessor {
  constructor(){
    super();this.disposed=false;this.blocks=0;this.frames=0;this.last=[];
    this.port.onmessage=({data})=>{
      if(data.type==='dispose'){
        this.disposed=true;this.last=[];
        this.port.postMessage({type:'disposed',id:data.id,disposed:true});
      }
    };
    this.port.postMessage({type:'ready'});
  }
  process(inputs,outputs){
    for(const bus of outputs)for(const channel of bus)channel.fill(0);
    if(this.disposed)return false;
    const frames=outputs[0]?.[0]?.length||128;this.blocks++;this.frames+=frames;
    this.last=inputs.map(bus=>{
      let power=0,peak=0,count=0;
      for(const channel of bus)for(const sample of channel){power+=sample*sample;peak=Math.max(peak,Math.abs(sample));count++;}
      return{channels:bus.length,frames:bus[0]?.length||0,rms:count?Math.sqrt(power/count):0,peak};
    });
    if(this.blocks%64===0)this.port.postMessage({type:'pulled',blocks:this.blocks,frames:this.frames,inputs:this.last});
    return true;
  }
}
registerProcessor('open-play-silent-audio-pull',SilentAudioPull);
