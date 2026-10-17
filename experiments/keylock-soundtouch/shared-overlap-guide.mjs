// Experimental shared WSOLA decisions. Upstream files remain untouched; follower
// instances deliberately consume the original pair's decisions instead of their
// own independent correlation search. Not selected by the app or its 0.1.7 build.
const failure=message=>Object.assign(new Error(message),{name:'SharedOverlapError'});
const geometry=s=>({overlapLength:s.overlapLength,seekLength:s.seekLength,seekWindowLength:s.seekWindowLength,nominalSkip:s.nominalSkip});
export class SharedOverlapGuide {
 constructor(participants,{maxPendingDecisions=4096}={}){if(!Number.isInteger(participants)||participants<1||!Number.isInteger(maxPendingDecisions)||maxPendingDecisions<1)throw new RangeError('Explicit positive guide limits required');this.participants=participants;this.maxPendingDecisions=maxPendingDecisions;this.readers=[];this.decisions=new Map();this.next=0;this.produced=0;this.consumed=0;this.peakPending=0;}
 attach(stretch){if(this.readers.length>=this.participants)throw failure('Too many guide participants');const reader={index:this.readers.length,next:0,disposed:false};this.readers.push(reader);const original=stretch.seekBestOverlapPosition,guide=this;
  stretch.seekBestOverlapPosition=function(input){if(reader.disposed)throw failure('Disposed guide participant');const shape=geometry(this);let offset;
   if(reader.index===0){if(guide.decisions.size>=guide.maxPendingDecisions)throw failure('Follower lag exceeded bounded guide queue');offset=original.call(this,input);if(!Number.isInteger(offset)||offset<0||offset>=this.seekLength)throw failure('Original overlap decision out of range');guide.decisions.set(guide.next++,{offset,shape});guide.produced++;guide.peakPending=Math.max(guide.peakPending,guide.decisions.size);reader.next=guide.next;}
   else{const decision=guide.decisions.get(reader.next);if(!decision)throw failure('Follower requested an unavailable original decision');if(JSON.stringify(decision.shape)!==JSON.stringify(shape))throw failure('Follower DSP geometry differs from original');offset=decision.offset;reader.next++;guide.consumed++;}
   guide.prune();return offset;
  };
  return()=>{if(reader.disposed)return;reader.disposed=true;stretch.seekBestOverlapPosition=original;guide.prune();};
 }
 prune(){if(this.readers.length!==this.participants)return;const live=this.readers.filter(r=>!r.disposed);if(!live.length){this.decisions.clear();return;}const first=Math.min(...live.map(r=>r.next));for(const index of this.decisions.keys())if(index<first)this.decisions.delete(index);}
 snapshot(){return{participants:this.participants,registered:this.readers.length,nextDecision:this.next,retainedDecisions:this.decisions.size,maxPendingDecisions:this.maxPendingDecisions,peakPendingDecisions:this.peakPending,produced:this.produced,consumed:this.consumed,readers:this.readers.map(r=>({...r}))};}
}
