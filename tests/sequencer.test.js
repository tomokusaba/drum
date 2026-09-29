import test from "node:test";
import assert from "node:assert/strict";
import { StepSequencer } from "../src/audio/sequencer.js";

test("sequencer schedules pattern hits ahead on the audio clock and cancels on stop", () => {
  const originalWindow = globalThis.window;
  let timerCallback;
  globalThis.window = {
    setInterval(callback) {
      timerCallback = callback;
      return 1;
    },
    clearInterval() {},
    requestAnimationFrame() {
      return 2;
    },
    cancelAnimationFrame() {},
  };

  try {
    const context = { currentTime: 0 };
    const calls = [];
    const engine = {
      trigger: (...args) => calls.push(args),
      cancelSequence: () => calls.push(["cancel"]),
    };
    const pattern = { kick: new Set([0, 1]), snare: new Set([1]) };
    const sequencer = new StepSequencer({
      context,
      engine,
      getPattern: () => pattern,
      getInstruments: () => [{ id: "kick" }, { id: "snare" }],
      onPlayheadChange() {},
    });

    sequencer.start();
    assert.deepEqual(calls, [["kick", 0.05, { sequence: true }]]);
    context.currentTime = 0.11;
    timerCallback();
    assert.equal(calls.length, 3);
    assert.equal(calls[1][0], "kick");
    assert.equal(calls[2][0], "snare");
    assert.equal(calls[1][2].sequence, true);
    sequencer.stop();
    assert.deepEqual(calls.at(-1), ["cancel"]);
    assert.equal(sequencer.isPlaying, false);
  } finally {
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  }
});
