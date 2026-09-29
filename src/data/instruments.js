export const INSTRUMENTS = [
  {
    id: "kick",
    name: "Kick",
    key: "Q",
    initial: { pitch: 62, pitchDrop: 31, carrierRatio: 1, modulatorRatio: 1.42, modulationIndex: 3.2, decay: 0.48, noise: 0.06 },
  },
  {
    id: "snare",
    name: "Snare",
    key: "W",
    initial: { pitch: 184, pitchDrop: 8, carrierRatio: 1, modulatorRatio: 2.8, modulationIndex: 5.6, decay: 0.24, noise: 0.42 },
  },
  {
    id: "closed-hat",
    name: "Closed hat",
    key: "E",
    initial: { pitch: 620, pitchDrop: 0, carrierRatio: 1, modulatorRatio: 5.25, modulationIndex: 9.5, decay: 0.075, noise: 0.54 },
  },
  {
    id: "open-hat",
    name: "Open hat",
    key: "R",
    initial: { pitch: 580, pitchDrop: 0, carrierRatio: 1, modulatorRatio: 4.72, modulationIndex: 10.5, decay: 0.48, noise: 0.38 },
  },
  {
    id: "clap",
    name: "Clap",
    key: "A",
    initial: { pitch: 205, pitchDrop: 3, carrierRatio: 1, modulatorRatio: 3.4, modulationIndex: 6.5, decay: 0.21, noise: 0.62 },
  },
  {
    id: "tom",
    name: "Tom",
    key: "S",
    initial: { pitch: 128, pitchDrop: 14, carrierRatio: 1, modulatorRatio: 1.88, modulationIndex: 3.8, decay: 0.36, noise: 0.04 },
  },
  {
    id: "rim",
    name: "Rim",
    key: "D",
    initial: { pitch: 410, pitchDrop: 3, carrierRatio: 1, modulatorRatio: 2.55, modulationIndex: 7.8, decay: 0.1, noise: 0.12 },
  },
  {
    id: "cowbell",
    name: "Cowbell",
    key: "F",
    initial: { pitch: 340, pitchDrop: 0, carrierRatio: 1, modulatorRatio: 1.48, modulationIndex: 11, decay: 0.33, noise: 0 },
  },
];

const makePattern = (hits) =>
  Object.fromEntries(INSTRUMENTS.map(({ id }) => [id, new Set(hits[id] ?? [])]));

export const PATTERN_PRESETS = {
  A: makePattern({
    kick: [0, 8],
    snare: [4, 12],
    "closed-hat": [2, 6, 10, 14],
    "open-hat": [15],
    clap: [12],
  }),
  B: makePattern({
    kick: [0, 10],
    snare: [8],
    "closed-hat": [2, 6, 10, 14],
    tom: [6, 14],
  }),
  C: makePattern({
    kick: [0, 6, 8, 14],
    snare: [4, 12],
    "closed-hat": [0, 2, 4, 6, 8, 10, 12, 14],
    rim: [7, 15],
  }),
  D: makePattern({}),
};

export const PARAMETER_DEFINITIONS = [
  { key: "pitch", label: "Pitch", min: 40, max: 1200, step: 1, unit: "Hz", format: (v) => `${Math.round(v)} Hz` },
  { key: "pitchDrop", label: "Pitch fall", min: 0, max: 36, step: 1, unit: "st", format: (v) => `${Math.round(v)} st` },
  { key: "carrierRatio", label: "Carrier ratio", min: 0.25, max: 8, step: 0.05, unit: "×", format: (v) => `${Number(v).toFixed(2)}×` },
  { key: "modulatorRatio", label: "Modulator ratio", min: 0.25, max: 12, step: 0.05, unit: "×", format: (v) => `${Number(v).toFixed(2)}×` },
  { key: "modulationIndex", label: "FM amount", min: 0, max: 12, step: 0.1, unit: "", format: (v) => Number(v).toFixed(1) },
  { key: "decay", label: "Decay", min: 0.04, max: 1.2, step: 0.01, unit: "s", format: (v) => `${Number(v).toFixed(2)} s` },
  { key: "noise", label: "Noise layer", min: 0, max: 0.8, step: 0.01, unit: "", format: (v) => Number(v).toFixed(2) },
];

export function clonePattern(pattern) {
  return Object.fromEntries(Object.entries(pattern).map(([id, steps]) => [id, new Set(steps)]));
}
