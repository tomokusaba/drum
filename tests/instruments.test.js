import test from "node:test";
import assert from "node:assert/strict";
import { INSTRUMENTS } from "../src/data/instruments.js";

test("drum pads follow ascending GM percussion notes with standard names and ordered home-row keys", () => {
  assert.deepEqual(
    INSTRUMENTS.map(({ id, gmNote, gmName, key }) => [id, gmNote, gmName, key]),
    [
      ["kick", 36, "Bass Drum 1", "A"],
      ["rim", 37, "Side Stick", "S"],
      ["snare", 38, "Acoustic Snare", "D"],
      ["clap", 39, "Hand Clap", "F"],
      ["closed-hat", 42, "Closed Hi-Hat", "G"],
      ["tom", 45, "Low Tom", "H"],
      ["open-hat", 46, "Open Hi-Hat", "J"],
      ["cowbell", 56, "Cowbell", "K"],
    ],
  );
  assert.ok(INSTRUMENTS.every((instrument, index, instruments) =>
    index === 0 || instruments[index - 1].gmNote < instrument.gmNote,
  ));
});
