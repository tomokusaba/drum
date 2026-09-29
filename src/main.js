import { createFMDrumEngine } from "./audio/engine.js";
import { StepSequencer } from "./audio/sequencer.js";
import {
  clonePattern,
  INSTRUMENTS,
  PARAMETER_DEFINITIONS,
  PATTERN_PRESETS,
} from "./data/instruments.js";

const settings = Object.fromEntries(
  INSTRUMENTS.map(({ id, initial }) => [id, { ...initial }]),
);
const patterns = Object.fromEntries(
  Object.entries(PATTERN_PRESETS).map(([id, pattern]) => [id, clonePattern(pattern)]),
);

const padGrid = document.querySelector("#pad-grid");
const parameterGrid = document.querySelector("#parameter-grid");
const stepGrid = document.querySelector("#step-grid");
const audioStatus = document.querySelector("#audio-status");
const announcer = document.querySelector("#live-announcer");
const playButton = document.querySelector("#play-button");
const stopButton = document.querySelector("#stop-button");
const tempoInput = document.querySelector("#tempo");
const tempoOutput = document.querySelector("#tempo-value");
const patternSelect = document.querySelector("#pattern-select");
const selectedVoice = document.querySelector("#selected-voice");

let selectedInstrument = INSTRUMENTS[0];
let selectedPattern = patternSelect.value;
let audioContext;
let engine;
let enginePromise;
let sequencer;

function announce(message) {
  announcer.textContent = message;
}

function setStatus(message) {
  audioStatus.textContent = message;
}

function activeInstrument(id) {
  return INSTRUMENTS.find((instrument) => instrument.id === id);
}

function renderPads() {
  for (const instrument of INSTRUMENTS) {
    const button = document.createElement("button");
    button.className = "pad";
    button.type = "button";
    button.dataset.instrument = instrument.id;
    button.setAttribute("aria-keyshortcuts", instrument.key);
    button.setAttribute("aria-current", String(instrument.id === selectedInstrument.id));
    button.innerHTML = `
      <span class="pad-name">${instrument.name}</span>
      <span class="pad-gm-name">${instrument.gmName}</span>
      <span class="pad-meta"><span>GM ${instrument.gmNote}</span><kbd>${instrument.key}</kbd></span>
      <span class="pad-meter" aria-hidden="true"></span>
    `;
    button.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      selectInstrument(instrument);
      flashPad(button);
      void triggerInstrument(instrument);
    });
    button.addEventListener("click", (event) => {
      if (event.detail !== 0) return;
      selectInstrument(instrument);
      flashPad(button);
      void triggerInstrument(instrument);
    });
    padGrid.append(button);
  }
}

function flashPad(button) {
  button.classList.add("is-active");
  window.clearTimeout(button.flashTimer);
  button.flashTimer = window.setTimeout(() => button.classList.remove("is-active"), 170);
}

function selectInstrument(instrument) {
  selectedInstrument = instrument;
  for (const pad of padGrid.querySelectorAll(".pad")) {
    pad.setAttribute("aria-current", String(pad.dataset.instrument === instrument.id));
  }
  selectedVoice.textContent = `${instrument.name} · two-operator FM`;
  renderParameters();
}

function renderParameters() {
  parameterGrid.replaceChildren();
  for (const definition of PARAMETER_DEFINITIONS) {
    const value = settings[selectedInstrument.id][definition.key];
    const field = document.createElement("div");
    field.className = "parameter";
    const inputId = `parameter-${selectedInstrument.id}-${definition.key}`;
    field.innerHTML = `
      <div class="parameter-top">
        <label for="${inputId}">${definition.label}</label>
        <output id="${inputId}-value" for="${inputId}">${definition.format(value)}</output>
      </div>
      <input id="${inputId}" type="range" min="${definition.min}" max="${definition.max}" step="${definition.step}" value="${value}" />
    `;
    const input = field.querySelector("input");
    const output = field.querySelector("output");
    input.addEventListener("input", () => {
      const newValue = Number(input.value);
      settings[selectedInstrument.id][definition.key] = newValue;
      output.textContent = definition.format(newValue);
    });
    parameterGrid.append(field);
  }
}

function renderSequencer() {
  stepGrid.replaceChildren();
  const spacer = document.createElement("span");
  spacer.className = "step-label";
  spacer.setAttribute("aria-hidden", "true");
  stepGrid.append(spacer);

  for (let step = 0; step < 16; step += 1) {
    const number = document.createElement("span");
    number.className = `step-number${step % 4 === 0 ? " beat" : ""}`;
    number.textContent = String(step + 1).padStart(2, "0");
    number.setAttribute("aria-hidden", "true");
    stepGrid.append(number);
  }

  for (const instrument of INSTRUMENTS) {
    const label = document.createElement("span");
    label.className = "step-label";
    label.innerHTML = `<span class="step-gm-note">${instrument.gmNote}</span><span>${instrument.name}</span>`;
    stepGrid.append(label);

    for (let step = 0; step < 16; step += 1) {
      const button = document.createElement("button");
      button.className = "step-cell";
      button.type = "button";
      button.dataset.instrument = instrument.id;
      button.dataset.step = String(step);
      button.dataset.beat = String(step % 4 === 0);
      button.setAttribute("aria-pressed", String(patterns[selectedPattern][instrument.id].has(step)));
      button.setAttribute(
        "aria-label",
        `${instrument.name}, step ${step + 1}, ${patterns[selectedPattern][instrument.id].has(step) ? "on" : "off"}`,
      );
      stepGrid.append(button);
    }
  }
}

function updatePatternButtons() {
  for (const button of stepGrid.querySelectorAll(".step-cell")) {
    const instrumentId = button.dataset.instrument;
    const step = Number(button.dataset.step);
    const active = patterns[selectedPattern][instrumentId].has(step);
    button.setAttribute("aria-pressed", String(active));
    button.setAttribute(
      "aria-label",
      `${activeInstrument(instrumentId).name}, step ${step + 1}, ${active ? "on" : "off"}`,
    );
  }
}

function updatePlayhead(step) {
  for (const button of stepGrid.querySelectorAll(".step-cell")) {
    button.classList.toggle("is-playhead", step !== null && Number(button.dataset.step) === step);
  }
}

function makeEmptyPattern() {
  return Object.fromEntries(INSTRUMENTS.map(({ id }) => [id, new Set()]));
}

async function ensureAudio() {
  const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error("Web Audio is not available in this browser. Try a current desktop or mobile browser.");
  }
  if (!audioContext) audioContext = new AudioContextClass({ latencyHint: "interactive" });
  if (audioContext.state !== "running") await audioContext.resume();
  if (engine) return engine;
  if (!enginePromise) {
    enginePromise = createFMDrumEngine(audioContext, settings)
      .then((created) => {
        engine = created;
        engine.node.onprocessorerror = () => {
          setStatus("The FM audio processor stopped unexpectedly. Reload the page to try again.");
        };
        return created;
      })
      .catch(async (error) => {
        enginePromise = undefined;
        const contextToClose = audioContext;
        audioContext = undefined;
        await contextToClose?.close();
        throw error;
      });
  }
  return enginePromise;
}

async function triggerInstrument(instrument) {
  if (!engine) setStatus("Starting the FM audio engine…");
  try {
    const currentEngine = await ensureAudio();
    currentEngine.trigger(instrument.id, audioContext.currentTime + 0.015);
    setStatus("Audio ready · use the pads or start the pattern.");
  } catch (error) {
    console.error("Unable to start the FM drum engine.", error);
    setStatus(error instanceof Error ? error.message : "Audio could not start. Check browser audio permissions and try again.");
  }
}

async function startSequence() {
  playButton.disabled = true;
  setStatus("Preparing the FM audio engine…");
  try {
    await ensureAudio();
    if (!sequencer) {
      sequencer = new StepSequencer({
        context: audioContext,
        engine,
        getPattern: () => patterns[selectedPattern],
        getInstruments: () => INSTRUMENTS,
        onPlayheadChange: updatePlayhead,
      });
    }
    sequencer.setTempo(Number(tempoInput.value));
    sequencer.start();
    playButton.disabled = true;
    stopButton.disabled = false;
    setStatus(`Playing pattern ${selectedPattern} · ${tempoInput.value} BPM.`);
  } catch (error) {
    console.error("Unable to start the step sequencer.", error);
    playButton.disabled = false;
    setStatus(error instanceof Error ? error.message : "Playback could not start. Try again.");
  }
}

function stopSequence() {
  sequencer?.stop();
  playButton.disabled = false;
  stopButton.disabled = true;
  if (audioContext?.state === "running") setStatus("Audio on · pattern stopped.");
  else setStatus("Audio is off. Play a pad or start the pattern to enable sound.");
}

renderPads();
renderParameters();
renderSequencer();

playButton.addEventListener("click", () => {
  if (!sequencer?.isPlaying) void startSequence();
});
stopButton.addEventListener("click", stopSequence);

tempoInput.addEventListener("input", () => {
  const tempo = Number(tempoInput.value);
  tempoOutput.innerHTML = `${tempo} <span>BPM</span>`;
  sequencer?.setTempo(tempo);
});

patternSelect.addEventListener("change", () => {
  selectedPattern = patternSelect.value;
  updatePatternButtons();
  if (sequencer?.isPlaying) setStatus(`Playing pattern ${selectedPattern} · ${tempoInput.value} BPM.`);
  announce(`Pattern ${selectedPattern} selected.`);
});

document.querySelector("#clear-pattern").addEventListener("click", () => {
  patterns[selectedPattern] = makeEmptyPattern();
  updatePatternButtons();
  announce(`Pattern ${selectedPattern} cleared.`);
});

stepGrid.addEventListener("click", (event) => {
  const button = event.target.closest(".step-cell");
  if (!button) return;
  const instrumentId = button.dataset.instrument;
  const step = Number(button.dataset.step);
  const steps = patterns[selectedPattern][instrumentId];
  if (steps.has(step)) steps.delete(step);
  else steps.add(step);
  const active = steps.has(step);
  button.setAttribute("aria-pressed", String(active));
  button.setAttribute(
    "aria-label",
    `${activeInstrument(instrumentId).name}, step ${step + 1}, ${active ? "on" : "off"}`,
  );
  announce(`${activeInstrument(instrumentId).name}, step ${step + 1} ${active ? "on" : "off"}.`);
});

document.addEventListener("keydown", (event) => {
  if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.target instanceof HTMLElement && event.target.closest("input, select, textarea, [contenteditable='true']")) return;
  const key = event.key.toUpperCase();
  const instrument = INSTRUMENTS.find((candidate) => candidate.key === key);
  if (!instrument) return;
  event.preventDefault();
  const pad = padGrid.querySelector(`[data-instrument="${instrument.id}"]`);
  if (pad) flashPad(pad);
  selectInstrument(instrument);
  void triggerInstrument(instrument);
});
