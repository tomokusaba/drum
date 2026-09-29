import test from "node:test";
import assert from "node:assert/strict";
import {
  amplitudeEnvelope,
  collectStepHits,
  fmSample,
  pitchMultiplier,
  secondsPerSixteenth,
} from "../src/audio/fm-engine.js";
import { FMDrumEngine } from "../src/audio/engine.js";

test("two-operator FM uses the modulator to offset the carrier phase", () => {
  assert.equal(fmSample(Math.PI / 2, 0, 8), 1);
  assert.ok(Math.abs(fmSample(0, Math.PI / 2, 1) - Math.sin(1)) < 1e-12);
  assert.ok(Math.abs(fmSample(0.4, 1.2, 0) - Math.sin(0.4)) < 1e-12);
});

test("percussive amplitude decays exponentially and rejects invalid ages", () => {
  assert.equal(amplitudeEnvelope(-0.01, 0.2), 0);
  assert.equal(amplitudeEnvelope(0.2, 0), 0);
  assert.equal(amplitudeEnvelope(0, 0.2), 1);
  assert.ok(Math.abs(amplitudeEnvelope(0.2, 0.2) - Math.exp(-6)) < 1e-12);
});

test("pitch fall begins above the tuned pitch and settles to the base frequency", () => {
  assert.equal(pitchMultiplier(0, 0), 1);
  assert.equal(pitchMultiplier(0, 12), 2);
  assert.ok(pitchMultiplier(0.2, 12) > 1);
  assert.ok(pitchMultiplier(2, 12) < 1.000001);
});

test("sixteenth-note duration follows tempo and clamps unsupported values", () => {
  assert.equal(secondsPerSixteenth(120), 0.125);
  assert.equal(secondsPerSixteenth(60), 0.25);
  assert.equal(secondsPerSixteenth(300), secondsPerSixteenth(180));
});

test("step hit collection returns only enabled instrument voices", () => {
  const instruments = [{ id: "kick" }, { id: "snare" }, { id: "hat" }];
  const pattern = { kick: new Set([0, 8]), snare: new Set([4]), hat: new Set() };
  assert.deepEqual(collectStepHits(pattern, instruments, 0), ["kick"]);
  assert.deepEqual(collectStepHits(pattern, instruments, 4), ["snare"]);
  assert.deepEqual(collectStepHits(pattern, instruments, 1), []);
});

test("engine converts the audio-clock timestamp to a worklet frame", () => {
  const messages = [];
  const parameters = { kick: { pitch: 62, decay: 0.48 } };
  const engine = new FMDrumEngine(
    { sampleRate: 48000 },
    { port: { postMessage: (message) => messages.push(message) } },
  );
  engine.setParameters(parameters);

  engine.trigger("kick", 1.5, { sequence: true });

  assert.deepEqual(messages, [
    {
      type: "trigger",
      instrumentId: "kick",
      atFrame: 72000,
      sequence: true,
      params: parameters.kick,
    },
  ]);
});
