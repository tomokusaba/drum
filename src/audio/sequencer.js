import { collectStepHits, secondsPerSixteenth } from "./fm-engine.js";

const LOOKAHEAD_SECONDS = 0.12;
const SCHEDULER_INTERVAL_MS = 25;

export class StepSequencer {
  constructor({ context, engine, getPattern, getInstruments, onPlayheadChange }) {
    this.context = context;
    this.engine = engine;
    this.getPattern = getPattern;
    this.getInstruments = getInstruments;
    this.onPlayheadChange = onPlayheadChange;
    this.isPlaying = false;
    this.step = 0;
    this.nextStepAt = 0;
    this.timer = null;
    this.frame = null;
    this.playheadEvents = [];
    this.visibleStep = null;
    this._tick = this._tick.bind(this);
    this._renderPlayhead = this._renderPlayhead.bind(this);
  }

  start() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.step = 0;
    this.nextStepAt = this.context.currentTime + 0.05;
    this.playheadEvents = [];
    this.timer = window.setInterval(this._tick, SCHEDULER_INTERVAL_MS);
    this._tick();
    this._renderPlayhead();
  }

  stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    window.clearInterval(this.timer);
    window.cancelAnimationFrame(this.frame);
    this.timer = null;
    this.frame = null;
    this.playheadEvents = [];
    this.engine.cancelSequence();
    this.visibleStep = null;
    this.onPlayheadChange(null);
  }

  setTempo(bpm) {
    this.bpm = Number(bpm);
  }

  _tick() {
    const now = this.context.currentTime;
    while (this.nextStepAt < now + LOOKAHEAD_SECONDS) {
      const step = this.step;
      const atTime = this.nextStepAt;
      const hits = collectStepHits(this.getPattern(), this.getInstruments(), step);
      for (const instrumentId of hits) this.engine.trigger(instrumentId, atTime, { sequence: true });
      this.playheadEvents.push({ step, atTime });
      this.step = (this.step + 1) % 16;
      this.nextStepAt += secondsPerSixteenth(this.bpm ?? 110);
    }
  }

  _renderPlayhead() {
    if (!this.isPlaying) return;
    const now = this.context.currentTime;
    let latest = this.visibleStep;
    while (this.playheadEvents.length && this.playheadEvents[0].atTime <= now) {
      latest = this.playheadEvents.shift().step;
    }
    if (latest !== this.visibleStep) {
      this.visibleStep = latest;
      this.onPlayheadChange(latest);
    }
    this.frame = window.requestAnimationFrame(this._renderPlayhead);
  }
}
