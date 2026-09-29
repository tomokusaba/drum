export function fmSample(carrierPhase, modulatorPhase, modulationIndex) {
  return Math.sin(carrierPhase + Math.sin(modulatorPhase) * modulationIndex);
}

export function amplitudeEnvelope(ageSeconds, decaySeconds) {
  if (ageSeconds < 0 || decaySeconds <= 0) return 0;
  return Math.exp((-6 * ageSeconds) / decaySeconds);
}

export function pitchMultiplier(ageSeconds, semitoneDrop, sweepSeconds = 0.035) {
  if (semitoneDrop <= 0) return 1;
  const startRatio = 2 ** (semitoneDrop / 12);
  if (sweepSeconds <= 0) return 1;
  return 1 + (startRatio - 1) * Math.exp(-Math.max(0, ageSeconds) / sweepSeconds);
}

export function secondsPerSixteenth(bpm) {
  const safeBpm = Math.min(180, Math.max(60, Number(bpm) || 110));
  return 60 / safeBpm / 4;
}

export function collectStepHits(pattern, instruments, step) {
  return instruments
    .filter(({ id }) => pattern[id]?.has(step))
    .map(({ id }) => id);
}
