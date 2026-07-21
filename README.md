# @thenormvg/web-have-sounds

Procedural UI sounds via the Web Audio API — zero dependencies, zero audio files.

[![npm version](https://img.shields.io/npm/v/@thenormvg/web-have-sounds.svg)](https://npmjs.com/package/@thenormvg/web-have-sounds)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**One system:** a catalog of named feels + sounds, run through a single play pipeline. Built-ins and your custom registrations use the same path. Production-safe (never throws); optional `debug` warnings for developers.

## Features

- Zero dependencies, instant synth (no buffers to decode)
- 9 Feels + full `FeelParams` (ADSR, pan, pitch)
- 20+ built-in interaction sounds + **multi-loop system** (`loading`, `processing`, `pulse`, `hum` + custom)
- Concurrent long-running beds with fade in/out, per-loop volume, `registerLoop`
- `registerFeel` / `registerSound` — define once, use app-wide (including `data-uisound`)
- SSR-safe, silent failure, autoplay-safe resume
- Master mute + volume, spam throttling, optional randomization
- Declarative DOM binding
- `debug` mode for unknown names / bad registration
- `createUISounds()` for isolated engines (tests / multi-root)

---

## Install

```bash
npm install @thenormvg/web-have-sounds
```

---

## Quick start

```js
import {
  configureUISounds,
  playUISound,
  warmUpAudio,
} from '@thenormvg/web-have-sounds';

configureUISounds({
  feel: 'glass',
  volume: 0.8,
  debug: import.meta.env?.DEV, // warnings in development only
});

document.addEventListener('pointerdown', () => warmUpAudio(), { once: true });

button.addEventListener('click', () => {
  playUISound('pop');
});
```

### Safety guarantees

| Behavior | What happens |
|----------|----------------|
| SSR / no `window` | No-op, no crash |
| AudioContext blocked / missing | No-op; warn once if `debug` |
| Autoplay resume rejected | Swallowed silently |
| Unknown sound / feel | No-op / fall back to `aero`; warn if `debug` |
| Play path exceptions | Caught; never throw into your handler |

`playUISound` returns a result you can ignore:

```ts
const result = playUISound('click');
// { ok: true } | { ok: false, reason: 'muted' | 'ssr' | 'throttled' | 'unknown' | 'no-audio' | 'error' }
```

---

## Architecture (how to think about it)

```
configure / registerFeel / registerSound / registerLoop
                    ↓
              Catalog (names)
         ┌──────────┴──────────┐
     play()                 LoopRuntime
   (one-shots)            (long-running)
         └──────────┬──────────┘
                    ↓
            AudioEngine
   synth → [pan] → [loop bus] → master → out
```

**Gain model:** synth peaks use feel `gainMult` only; loop bus holds per-loop volume + fade; engine **master bus** applies live `setMasterVolume` to everything.

Built-ins are pre-registered the same way as custom entries — one code path.

---

## Global config

```js
configureUISounds({
  feel: 'industrial',
  volume: 0.7,
  enabled: true,
  randomize: true,
  throttleMs: { hover: 150, keystroke: 80 },
  debug: true, // console.warn for typos & bad setup
});

setUISoundsEnabled(false);
setMasterVolume(0.5);
```

One shared `AudioContext` is created lazily. Override per call with `{ ctx }` or use `createUISounds()` for a separate engine.

---

## Sounds

| Type | Use |
|------|-----|
| `click` `pop` `toggle` | General UI |
| `press` / `release` | Pointer down / up |
| `hover` | Pointer enter (throttled 150ms) |
| `tick` | Steppers (throttled) |
| `keystroke` | Typing feedback (throttled 80ms) |
| `select` / `deselect` | Lists, tabs, checkboxes |
| `drop` | Dismiss / close |
| `delete` / `remove` | Remove from list (swoosh) |
| `success` `error` `warning` `notify` | Outcome toasts |
| `startup` | Session / boot |
| `connect` / `disconnect` | Online / websocket |

### Loops (long-running / ambient beds)

One-shots fire and die. **Loops** keep running until you stop them — uploads, sync, focus mode, recording.

Built-ins: `loading` · `processing` · `pulse` · `hum`

```js
import {
  startLoop,
  stopLoop,
  stopAllLoops,
  isLoopPlaying,
  setLoopVolume,
} from '@thenormvg/web-have-sounds';

// Multiple loops can run together
startLoop('loading', { feel: 'soft' });
startLoop('hum', { volume: 0.4, fadeIn: 0.3 });

setLoopVolume('loading', 0.5);

// … upload finished …
stopLoop('loading');
stopAllLoops(); // or stopLoop() with no id
```

| API | Role |
|-----|------|
| `startLoop(id, opts?)` | Start / restart a loop (`feel`, `pan`, `volume`, `fadeIn`, `ctx`) |
| `stopLoop(id?, opts?)` | Stop one, or all if id omitted (`fadeOut`) |
| `stopAllLoops()` | Stop everything |
| `isLoopPlaying(id?)` | Any active, or specific id |
| `getActiveLoops()` | List of running ids |
| `setLoopVolume(id, 0–1)` | Live level while playing |
| `registerLoop(name, synth, opts?)` | Custom long-running bed |

#### Custom loop

```js
registerLoop(
  'upload',
  ({ ctx, time, params, volume, connect }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = 330 * params.pitchMult;
    gain.gain.value = 0.06 * volume;

    lfo.frequency.value = 3;
    lfoGain.gain.value = 0.03 * volume;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);

    osc.connect(gain);
    connect(gain);
    osc.start(time);
    lfo.start(time);

    // Return sources so stopLoop can end them after fade-out
    return { sources: [osc, lfo] };
  },
  { fadeIn: 0.1, fadeOut: 0.25 }
);

startLoop('upload');
// …
stopLoop('upload');
```

Same `SynthContext` as one-shots. Return `{ sources, dispose? }` so teardown is clean.

> **Aliases:** `startAmbient` / `stopAmbient` / `isAmbientPlaying` still work and map to the loop API.

---

## Feels — when to use which

| Feel | Character | Good for |
|------|-----------|----------|
| `aero` (default) | Clean modern sine | General product UI |
| `soft` | Gentle, longer | Wellness, onboarding |
| `glass` | High, resonant | Creative / premium |
| `minimal` | Quiet | Dense dashboards |
| `crisp` | Bright, quick | Productivity |
| `organic` | Warm triangle | Content, community |
| `arcade` | 8-bit square | Games, playful |
| `retro` | Soft square | Nostalgic UI |
| `industrial` | Heavy saw | Dev tools, infra |

```js
playUISound('success', 'arcade');
playUISound('notify', { feel: 'glass', pan: 0.5, randomize: true });
```

---

## Custom feels & sounds

### Feel

```js
registerFeel('brand', {
  filterFreq: 4200,
  q: 6,
  oscType: 'triangle',
  decayMult: 0.7,
  gainMult: 0.9,
  pitchMult: 1.15,
});

configureUISounds({ feel: 'brand' });
playUISound('success'); // brand
```

### Sound

```js
import { registerSound, synthHelpers } from '@thenormvg/web-have-sounds';

registerSound(
  'whoosh',
  (s) => {
    synthHelpers.tone(s, {
      freq: 900 * s.params.pitchMult,
      endFreq: 100,
      duration: 0.22,
      peak: 0.28 * s.volume,
    });
  },
  { throttleMs: 120 }
);

playUISound('whoosh', 'brand');
```

`SynthContext` (one-shots & loops): `ctx`, `time`, `params`, `volume` (feel `gainMult` only), `connect(node)`.

`synthHelpers`: `tone`, `noiseBurst`, `chord`, `envelope`, `clamp`, `safeOscType`.

---

## Declarative binding

```html
<button data-uisound="click">Save</button>
<button data-uisound="whoosh" data-uisound-feel="brand">Go</button>
<div data-uisound="hover" data-uisound-feel="soft">…</div>
```

```js
bindUISounds(); // returns unbind()
```

Attributes: `data-uisound`, `data-uisound-feel`, `data-uisound-params` (JSON), `data-uisound-event`, `data-uisound-pan`.

---

## Isolated engine (optional)

```js
import { createUISounds } from '@thenormvg/web-have-sounds';

const sfx = createUISounds();
sfx.configure({ feel: 'arcade', debug: true });
sfx.play('click');
sfx.bind({ root: document.getElementById('game') });
```

Default package functions use a shared singleton — fine for most apps.

---

## API cheat sheet

| API | Role |
|-----|------|
| `playUISound` / `configureUISounds` | Core |
| `warmUpAudio` / `getAudioContext` | Audio unlock |
| `setUISoundsEnabled` / `setMasterVolume` | Mute & level |
| `registerFeel` / `registerSound` | Catalog |
| `hasFeel` / `hasSound` / `listCustom*` | Introspection |
| `startLoop` / `stopLoop` / `stopAllLoops` | Long-running beds |
| `registerLoop` / `hasLoop` / `listLoops` | Custom loops |
| `setLoopVolume` / `getActiveLoops` / `isLoopPlaying` | Loop control |
| `startAmbient` / `stopAmbient` | Deprecated aliases → loop API |
| `bindUISounds` | DOM attributes |
| `createUISounds` | Isolated instance |
| `synthHelpers` / `FEEL_PRESETS` | Power tools |

### `FeelParams`

`filterFreq`, `q`, `oscType`, `decayMult`, `gainMult`, `pitchMult`, optional `pan`, `attackMult`, `sustainLevel`, `releaseMult`.

---

## License

MIT
