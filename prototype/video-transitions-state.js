// Original transition lifecycle. No reference implementation or vendor code used.
const clamp = (n) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0.5));

export function createTransitionState() {
  let previous = null;
  return {
    reset() { previous = null; },
    advance({ name, amount, time = 0, frameId, left, right }) {
      amount = clamp(amount);
      const restart = !previous || name !== previous.name ||
        left !== previous.left || right !== previous.right || time < previous.time;
      const freshFrame = restart || frameId === undefined || frameId !== previous.frameId;
      // frameId deduplicates temporal history, not control events or clock reads.
      // Always record endpoints, threshold crossings and the latest observed time.
      const endpoint = amount <= 0 ? 0 : amount >= 1 ? 1 : null;
      let side = restart ? (amount < 0.5 ? 0 : 1) : previous.result.side;
      let captureLatch = restart;
      if (name === "Latch 50") {
        const next = amount < 0.5 ? 0 : 1;
        captureLatch ||= next !== side || endpoint !== null;
        side = next;
      } else if (name === "Scratch" || name === "Scratch Fade") {
        if (endpoint !== null) { side = endpoint; captureLatch = true; }
        else if (previous?.endpoint !== null && previous?.endpoint !== undefined) captureLatch = true;
      }
      const result = { side, captureLatch, freshFrame, resetHistory: restart };
      previous = { name, time, frameId, left, right, endpoint, result };
      return result;
    },
  };
}
