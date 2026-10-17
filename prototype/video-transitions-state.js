// Original transition lifecycle. Historical manual supplies Center/midpoint/end-cut
// semantics; curves, ties and5%/95% Scratch bands are independent Open Play policy.
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
      let captureLatch = name === "Scratch Fade" && restart;
      if (name === "Latch 50") {
        const next = amount < 0.5 ? 0 : 1;
        side = next;
      } else if (name === "Scratch") {
        // End cuts select LIVE inputs. Interior travel preserves the last side.
        if (amount <= 0.05) side = 0;
        else if (amount >= 0.95) side = 1;
      } else if (name === "Scratch Fade") {
        if (endpoint !== null) { side = endpoint; captureLatch = true; }
        else if (previous?.endpoint !== null && previous?.endpoint !== undefined) captureLatch = true;
      }
      const mixAmount = name === "Center" ? clamp((amount - 0.25) * 2) : amount;
      const result = { side, mixAmount, captureLatch, freshFrame, resetHistory: restart };
      previous = { name, time, frameId, left, right, endpoint, result };
      return result;
    },
  };
}
