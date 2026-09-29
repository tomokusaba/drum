export class FMDrumEngine {
  constructor(context, workletNode) {
    this.context = context;
    this.node = workletNode;
  }

  trigger(instrumentId, atTime, { sequence = false } = {}) {
    const params = this.parameters[instrumentId];
    if (!params) throw new Error(`No FM parameters are registered for "${instrumentId}".`);
    this.node.port.postMessage({
      type: "trigger",
      instrumentId,
      atFrame: Math.round(atTime * this.context.sampleRate),
      sequence,
      params,
    });
  }

  setParameters(parameters) {
    this.parameters = parameters;
  }

  cancelSequence() {
    this.node.port.postMessage({ type: "cancel-sequence" });
  }
}

export async function createFMDrumEngine(context, parameters) {
  if (!context.audioWorklet) {
    throw new Error("This browser does not support AudioWorklet. Try a current version of Chrome, Edge, Firefox, or Safari.");
  }
  await context.audioWorklet.addModule("/fm-processor.js");
  const node = new AudioWorkletNode(context, "fm-drum-processor", {
    numberOfInputs: 0,
    numberOfOutputs: 1,
    outputChannelCount: [2],
  });
  const gain = context.createGain();
  gain.gain.value = 0.72;
  node.connect(gain).connect(context.destination);
  const engine = new FMDrumEngine(context, node);
  engine.setParameters(parameters);
  return engine;
}
