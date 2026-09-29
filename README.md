# DRUM / FM

A browser-based, two-operator FM drum machine. Eight synthesized drum voices, a 16-step sequencer, and editable per-voice parameters run entirely in the browser. The FM synthesis is implemented in the project's AudioWorklet; no synth or sample library is used.

## Run locally

```sh
npm install
npm run dev
```

Create a production build with `npm run build`; preview the built app with `npm run preview`. Run the focused DSP and scheduler tests with `npm test`.

Use a current browser that supports AudioWorklet and serve the app from localhost or HTTPS. Audio is initialized only after a pad or the pattern transport is explicitly activated.

## Controls

- The eight pads follow ascending GM percussion notes: 36 Bass Drum 1, 37 Side Stick, 38 Acoustic Snare, 39 Hand Clap, 42 Closed Hi-Hat, 45 Low Tom, 46 Open Hi-Hat, and 56 Cowbell.
- Play them in that same order with pointer/multi-touch or the home-row keys `A S D F G H J K`. Each pad displays its GM note number, standard drum name, and keyboard key.
- Select a pad to edit pitch, pitch fall, carrier and modulator ratios, FM amount, decay, and the noise layer.
- Toggle 16th-note steps, choose one of four pattern slots, clear the current pattern, and set tempo from 60 to 180 BPM.
- Touch can activate multiple pads concurrently. Each pad hit and sequenced hit uses the same timestamped FM engine.

The MVP keeps patterns and voice edits in memory for the current page session. Recording/export, MIDI, variable velocity, and persistent storage are out of scope.
