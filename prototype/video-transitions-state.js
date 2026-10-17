// Original lifecycle. Historical manual supplies broad transition meanings;
// thresholds, curves, traversal events and seeded ordering are independent.
const clamp = n => Math.max(0,Math.min(1,Number.isFinite(n)?n:.5));
export function gridSequenceOrder(cycle=0){
  if(!Number.isSafeInteger(cycle)||cycle<0)throw new RangeError('Grid sequence cycle must be a nonnegative safe integer.');
  let seed=(0x6d2b79f5^cycle)>>>0;
  const random=()=>{seed=(seed+0x6d2b79f5)>>>0;let t=Math.imul(seed^(seed>>>15),1|seed);t^=t+Math.imul(t^(t>>>7),61|t);return((t^(t>>>14))>>>0)/4294967296;};
  const order=Array.from({length:9},(_,i)=>i);
  for(let i=8;i>0;i--){const j=Math.floor(random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
  return Object.freeze(order);
}
export function createTransitionState() {
  let previous = null;
  return {
    reset() { previous = null; },
    advance({ name, amount, time = 0, frameId, left, right }) {
      amount = clamp(amount);
      const restart = !previous || name !== previous.name || left !== previous.left ||
        right !== previous.right || time < previous.time;
      const freshFrame = restart || frameId === undefined || frameId !== previous.frameId;
      const endpoint = amount <= 0 ? 0 : amount >= 1 ? 1 : null;
      let side = restart ? (amount < .5 ? 0 : 1) : previous.result.side;
      if (name === 'Latch 50') side = amount < .5 ? 0 : 1;
      if (name === 'Scratch') {
        if (amount <= .05) side = 0;
        else if (amount >= .95) side = 1;
      }
      // Each observed departure from an endpoint begins a traversal. Interior
      // reversals and duplicate frame/control events keep the current traversal.
      // Starting in the interior counts as the first traversal (H / seed zero).
      let cycle = restart ? 0 : previous.result.cycle;
      let traversalStarted = restart ? endpoint === null : previous.result.traversalStarted;
      if (!restart && previous.endpoint !== null && endpoint === null) {
        if (traversalStarted) cycle++;
        traversalStarted = true;
      }
      const sequenceOrder = restart || cycle !== previous.result.cycle ?
        gridSequenceOrder(cycle) : previous.result.sequenceOrder;
      const mixAmount = name === 'Center' ? clamp((amount - .25) * 2) : amount;
      const upfaderGates = name === 'Scratch Fade' ?
        (amount <= .05 ? [1, 0] : amount >= .95 ? [0, 1] : [1, 1]) : [1, 1];
      const result = { side, mixAmount, captureLatch: false, freshFrame,
        resetHistory: restart, cycle, traversalStarted, boxAxis: cycle % 2,
        sequenceOrder, upfaderGates };
      previous = { name, time, frameId, left, right, endpoint, result };
      return result;
    },
  };
}
