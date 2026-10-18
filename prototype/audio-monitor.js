// Independent monitor graph. Physical channel mapping still requires device proof.
const invalid=message=>new TypeError(message);
const bounded=(value,name,min,max)=>{if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)throw invalid(`${name} must be ${min}..${max}.`);return value;};
export function monitorSettings(value={}){
  const settings={mix:.5,volume:.1,masterCue:false,splitCue:false,mono:false,...value};
  bounded(settings.mix,'Cue mix',0,1);bounded(settings.volume,'Cue volume',0,1);
  for(const field of ['masterCue','splitCue','mono'])if(typeof settings[field]!=='boolean')throw invalid(field+' must be boolean.');
  return settings;
}
export function cueVolumeGain(volume){bounded(volume,'Cue volume',0,1);return volume<=.1?volume*10:10**((volume-.1)/.9*12/20);}
const stereo=context=>{const n=context.createGain();n.channelCount=2;n.channelCountMode='explicit';n.channelInterpretation='speakers';return n;};
const at=(context,node,value)=>{const p=node.gain;p.cancelScheduledValues(context.currentTime);p.setValueAtTime(value,context.currentTime);};
export function createAudioMonitor(context,{master,deckTaps=[],destination=context.destination,settings:initial={}}={}){
  if(!context?.createChannelMerger||!master?.connect||!deckTaps.every(n=>n?.connect))throw invalid('Monitor needs a context, master and deck taps.');
  let settings=monitorSettings(initial),disposed=false,layout='stereo',masterPair=0,cuePair=2,physical=null,physicalMuted=false;
  const offline=typeof context.startRendering==='function';
  const owned=[],node=n=>(owned.push(n),n),gain=()=>node(stereo(context));
  const cueBus=gain(),monitor=gain(),level=gain(),cueNormal=gain(),masterNormal=gain(),cueMono=gain(),masterMono=gain(),cueSplitGain=gain(),masterSplitGain=gain(),masterStereo=gain(),masterMonoOut=gain();
  const cueSplit=node(context.createChannelSplitter(2)),masterSplit=node(context.createChannelSplitter(2)),headphoneSplit=node(context.createChannelSplitter(2)),splitStereo=node(context.createChannelMerger(2));
  // Averaging both channels explicitly avoids implicit quad downmixing.
  function average(split,target){for(let c=0;c<2;c++){const half=gain();half.channelCount=1;half.channelCountMode='explicit';half.channelInterpretation='discrete';half.gain.value=.5;split.connect(half,c);half.connect(target);}}
  cueBus.connect(cueNormal);cueNormal.connect(monitor);masterNormal.connect(monitor);
  cueBus.connect(cueSplit);master.connect(masterSplit);average(cueSplit,cueMono);average(masterSplit,masterMono);
  cueMono.connect(cueSplitGain);masterMono.connect(masterSplitGain);cueSplitGain.connect(splitStereo,0,0);masterSplitGain.connect(splitStereo,0,1);splitStereo.connect(monitor);
  monitor.connect(level);level.connect(headphoneSplit);
  master.connect(masterStereo);masterMono.connect(masterMonoOut);
  const pfl=deckTaps.map(tap=>{const gate=gain();gate.gain.value=0;tap.connect(gate);gate.connect(cueBus);return gate;});
  const masterOutput=gain();masterStereo.connect(masterOutput);masterMonoOut.connect(masterOutput);masterOutput.connect(masterNormal);
  const masterOutputSplit=node(context.createChannelSplitter(2));masterOutput.connect(masterOutputSplit);
  const outputGate=gain();outputGate.channelInterpretation='discrete';outputGate.gain.value=1;
  const assertLive=()=>{if(disposed)throw Object.assign(Error('Monitor disposed.'),{name:'InvalidStateError'});};
  function update(next={}){
    assertLive();settings=monitorSettings({...settings,...next});
    const cue=settings.masterCue?0:1-settings.mix,main=settings.masterCue?1:settings.mix,split=settings.splitCue&&!settings.masterCue;
    at(context,cueNormal,split?0:cue);at(context,masterNormal,split?0:main);
    at(context,cueSplitGain,split?cue:0);at(context,masterSplitGain,split?main:0);
    at(context,level,cueVolumeGain(settings.volume));at(context,masterStereo,settings.mono?0:1);at(context,masterMonoOut,settings.mono?1:0);
    return {...settings};
  }
  function connectPhysical(next='stereo',{masterStart=0,cueStart=2}={}){
    assertLive();if(!['stereo','four-channel'].includes(next))throw invalid('Choose stereo or four-channel output.');
    if(![0,2].includes(masterStart)||![0,2].includes(cueStart)||masterStart===cueStart)throw invalid('Master and cue pairs must be distinct1/2 and3/4.');
    const count=next==='stereo'?2:4,capacity=destination.maxChannelCount||destination.channelCount;
    if(capacity<count)throw Object.assign(Error(`This destination exposes ${capacity} channels; ${count} are required.`),{name:'NotSupportedError'});
    if(physical&&next===layout&&masterStart===masterPair&&cueStart===cuePair)return snapshot();
    const merger=context.createChannelMerger(count);merger.channelInterpretation='discrete';
    const previousCount=destination.channelCount;
    try{
      if(!offline&&destination.maxChannelCount)destination.channelCount=count;
      destination.channelInterpretation='discrete';
      for(let c=0;c<2;c++)masterOutputSplit.connect(merger,c,next==='stereo'?c:masterStart+c);
      if(next==='four-channel')for(let c=0;c<2;c++)headphoneSplit.connect(merger,c,cueStart+c);
      merger.connect(outputGate);
    }catch(error){try{masterOutputSplit.disconnect(merger);}catch{}try{headphoneSplit.disconnect(merger);}catch{}merger.disconnect();if(!offline&&destination.maxChannelCount)try{destination.channelCount=previousCount;}catch{}throw error;}
    // Exact edge removal preserves recording, meters, diagnostic taps and cue bus.
    if(physical){try{masterOutputSplit.disconnect(physical);}catch{}try{headphoneSplit.disconnect(physical);}catch{}physical.disconnect();}
    outputGate.channelCount=count;physical=merger;layout=next;masterPair=masterStart;cuePair=cueStart;
    return snapshot();
  }
  function snapshot(){return{settings:{...settings},layout,masterChannels:layout==='stereo'?[1,2]:[masterPair+1,masterPair+2],cueChannels:layout==='four-channel'?[cuePair+1,cuePair+2]:[],destinationChannels:destination.channelCount,destinationMaximum:destination.maxChannelCount,physicalMuted,disposed,cueGain:cueVolumeGain(settings.volume),scope:'Channel matrix and commanded mute state; rendered audio, physical sockets and unplug behavior need their own evidence.'};}
  update();connectPhysical();outputGate.connect(destination);
  return{cueBus,headphones:level,masterOutput,physicalOutput:outputGate,update,connectPhysical,snapshot,
    setPFL(index,on,trim=1){assertLive();if(!Number.isInteger(index)||!pfl[index]||typeof on!=='boolean')throw invalid('Unknown cue deck or state.');bounded(trim,'Cue trim',0,2);at(context,pfl[index],on?trim:0);},
    // AudioParam.value can lag a scheduled change until the rendering thread
    // advances. Report the accepted control target, not that stale sample.
    mutePhysical(mute=true){assertLive();at(context,outputGate,mute?0:1);physicalMuted=!!mute;},
    dispose(){if(disposed)return;disposed=true;for(const [i,tap]of deckTaps.entries())try{tap.disconnect(pfl[i]);}catch{}for(const target of [masterSplit,masterStereo])try{master.disconnect(target);}catch{}physical?.disconnect();for(const n of owned)try{n.disconnect();}catch{};}
  };
}
