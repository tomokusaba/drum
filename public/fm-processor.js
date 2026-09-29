class FMDrumProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.voices = [];
    this.events = [];
    this.noiseSeed = 0x6d2b79f5;
    this.port.onmessage = ({ data }) => {
      if (data.type === "trigger") {
        this.events.push(data);
        this.events.sort((a, b) => a.atFrame - b.atFrame);
      } else if (data.type === "cancel-sequence") {
        this.events = this.events.filter((event) => !event.sequence);
      }
    };
  }

  nextNoise() {
    let x = this.noiseSeed;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.noiseSeed = x >>> 0;
    return (this.noiseSeed / 0xffffffff) * 2 - 1;
  }

  startVoice(event, frame) {
    const p = event.params;
    const frequency = Math.max(20, Math.min(18000, p.pitch));
    if (this.voices.length >= 32) this.voices.shift();
    this.voices.push({
      id: event.instrumentId,
      startFrame: Math.max(frame, event.atFrame),
      pitch: frequency,
      pitchDrop: Math.max(0, Math.min(48, p.pitchDrop)),
      carrierRatio: Math.max(0.1, Math.min(16, p.carrierRatio)),
      modulatorRatio: Math.max(0.1, Math.min(16, p.modulatorRatio)),
      modulationIndex: Math.max(0, Math.min(18, p.modulationIndex)),
      decay: Math.max(0.025, Math.min(2, p.decay)),
      noise: Math.max(0, Math.min(1, p.noise)),
      carrierPhase: 0,
      modulatorPhase: 0,
      seed: this.noiseSeed = (this.noiseSeed + 0x9e3779b9) >>> 0,
    });
  }

  process(_inputs, outputs) {
    const output = outputs[0];
    if (!output?.length) return true;
    const frameStart = currentFrame;
    for (let sampleIndex = 0; sampleIndex < output[0].length; sampleIndex += 1) {
      const frame = frameStart + sampleIndex;
      while (this.events.length && this.events[0].atFrame <= frame) {
        this.startVoice(this.events.shift(), frame);
      }

      let mixed = 0;
      for (let index = this.voices.length - 1; index >= 0; index -= 1) {
        const voice = this.voices[index];
        const age = (frame - voice.startFrame) / sampleRate;
        const envelope = Math.exp((-6 * age) / voice.decay);
        if (envelope < 0.0007) {
          this.voices.splice(index, 1);
          continue;
        }
        const pitchRatio =
          1 + (2 ** (voice.pitchDrop / 12) - 1) * Math.exp(-age / 0.035);
        const carrierHz = voice.pitch * pitchRatio * voice.carrierRatio;
        const modulatorHz = voice.pitch * pitchRatio * voice.modulatorRatio;
        const indexEnvelope = voice.modulationIndex * (0.3 + envelope * 0.7);
        const modulator = Math.sin(voice.modulatorPhase);
        const tone = Math.sin(voice.carrierPhase + modulator * indexEnvelope);
        const noise = this.nextNoise();
        const sample = tone * (1 - voice.noise * 0.65) + noise * voice.noise;
        mixed += sample * envelope * 0.38;
        voice.carrierPhase += (Math.PI * 2 * carrierHz) / sampleRate;
        voice.modulatorPhase += (Math.PI * 2 * modulatorHz) / sampleRate;
        if (voice.carrierPhase > Math.PI * 2) voice.carrierPhase %= Math.PI * 2;
        if (voice.modulatorPhase > Math.PI * 2) voice.modulatorPhase %= Math.PI * 2;
      }

      const outputSample = Math.tanh(mixed * 0.9);
      for (let channel = 0; channel < output.length; channel += 1) {
        output[channel][sampleIndex] = outputSample;
      }
    }
    return true;
  }
}

registerProcessor("fm-drum-processor", FMDrumProcessor);
