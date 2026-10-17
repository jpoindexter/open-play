// Browser wrapper. Await prepareExtendedEffects(context) once before construction.
export {
  extendedEffectNames,
  channelEffectNames,
  getExtendedEffectControls,
} from "./extended-effects-kernel.js";
import { extendedEffectDefinitions } from "./extended-effects-kernel.js";
const prepared = new WeakMap();
export async function prepareExtendedEffects(ctx) {
  if (!ctx.audioWorklet)
    throw new Error(
      "This browser does not support AudioWorklet. Extended FX cannot run.",
    );
  if (!prepared.has(ctx))
    prepared.set(
      ctx,
      ctx.audioWorklet
        .addModule(
          new URL("./extended-effects-worklet.js", import.meta.url).href,
        )
        .then(() => true)
        .catch((e) => {
          prepared.delete(ctx);
          throw e;
        }),
    );
  return prepared.get(ctx);
}
export function createExtendedEffect(ctx, spec, bpm = 120) {
  // Keep processor identity stable even for direct callers with mutable slots.
  spec = {...spec, params: {...spec.params}};
  if (!extendedEffectDefinitions[spec.name])
    throw new Error(`Unsupported extended FX: ${spec.name}`);
  if (!prepared.has(ctx))
    throw new Error(
      "Await prepareExtendedEffects(context) before creating FX.",
    );
  const input = ctx.createGain(),
    output = ctx.createGain();
  const processor = new AudioWorkletNode(ctx, "open-play-extended-effect-v1", {
    numberOfInputs: 1,
    numberOfOutputs: 1,
    outputChannelCount: [2],
    processorOptions: { spec, bpm },
  });
  input.connect(processor);
  processor.connect(output);
  let disposed = false;
  return {
    input,
    output,
    processor,
    update(nextSpec, nextBpm = bpm) {
      if (disposed || nextSpec.name !== spec.name) return false;
      processor.port.postMessage({
        type: "update",
        spec: nextSpec,
        bpm: nextBpm,
      });
      return true;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      processor.port.postMessage({ type: "dispose" });
      input.disconnect();
      processor.disconnect();
      output.disconnect();
      processor.port.close();
    },
  };
}
