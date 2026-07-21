# @thenormvg/web-have-sounds

A professional, zero-dependency JavaScript/TypeScript library for generating UI sound effects entirely through mathematics via the native Web Audio API.

[![npm version](https://img.shields.io/npm/v/@thenormvg/web-have-sounds.svg)](https://npmjs.com/package/@thenormvg/web-have-sounds)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

No `.wav`, `.mp3`, or `.ogg` files to load. No network requests. Perfect for adding high-quality, interactive sonic feedback to your web apps, dashboards, and games without bloating your bundle size.

**Why this library:** full parameterization and themable **Feels** (not just fixed presets), **register your own feels & sounds** for app-wide reuse, plus production-ready defaults — SSR-safe, silent failure, mute/volume, throttling, declarative binding, and optional ADSR/pan/randomization.

## Features

- 🪶 **Zero dependencies** — extremely lightweight
- ⚡ **Instant playback** — no buffering or audio decoding
- 🎨 **Themable Feels** — 9 distinct sonic palettes, fully overridable with `FeelParams`
- 🧩 **Register your own** — `registerFeel` / `registerSound` once, use everywhere (including `data-uisound`)
- 🎛️ **Power path** — ADSR envelope multipliers, stereo pan, pitch/timing randomization
- 🛡️ **Production-safe** — SSR-safe, never throws from click handlers, autoplay-safe resume
- 🔇 **App-level control** — master mute + master volume
- ⏱️ **Spam throttling** — hover/keystroke/tick rate-limited by default
- 🏷️ **Declarative DOM binding** — `data-uisound` + optional feel/params attributes
- 🔁 **Loopable ambient loading** — `startAmbient` / `stopAmbient` for in-progress states
- ⚛️ **Framework agnostic** — React, Vue, Svelte, Angular, or vanilla JS

---

## Installation

```bash
npm install @thenormvg/web-have-sounds
# or
yarn add @thenormvg/web-have-sounds
# or
pnpm add @thenormvg/web-have-sounds
```

---

## Quick Start

```javascript
import { playUISound, configureUISounds, warmUpAudio } from '@thenormvg/web-have-sounds';

// Optional: set app-wide defaults once
configureUISounds({ feel: 'glass', volume: 0.8 });

// Unlock audio on first gesture (avoids latency on the first real sound)
document.addEventListener('pointerdown', () => warmUpAudio(), { once: true });

document.querySelector('#submit-btn').addEventListener('click', () => {
  playUISound('pop'); // uses configured feel
});
```

### Browser autoplay policy

The Web Audio API starts **suspended** until a user gesture. Call `playUISound()` (or `warmUpAudio()`) as a direct or indirect result of a click/tap/keypress. If resume is still blocked, the library **swallows the rejection** and no-ops — it will not throw in your event handler.

### SSR-safe

Safe to import in Next.js, Nuxt, SvelteKit, etc. Server-side evaluation never touches `window` / `AudioContext`. Playback is a silent no-op until the browser is available.

### Silent failure mode

If `AudioContext` is missing, blocked, or throws on create, all play APIs become **no-ops**. They never throw into your UI handlers.

---

## Global configuration

```javascript
import {
  configureUISounds,
  setUISoundsEnabled,
  setMasterVolume,
  playUISound,
} from '@thenormvg/web-have-sounds';

configureUISounds({
  feel: 'industrial',  // default Feel for every call
  volume: 0.7,         // master volume 0–1
  enabled: true,       // master mute
  randomize: true,     // ±~4% pitch/timing jitter (less fatigue on repeats)
  throttleMs: {
    hover: 150,        // defaults already throttle hover/keystroke/tick
    keystroke: 80,
  },
});

// Imperative toggles (e.g. settings panel)
setUISoundsEnabled(false);
setMasterVolume(0.5);

playUISound('success'); // uses configured feel + volume
```

### Shared AudioContext

A **single lazy singleton** `AudioContext` is created on first use and reused forever. Pass your own via the options/`ctx` argument when integrating with a game engine or larger audio graph:

```javascript
playUISound('warning', { feel: 'industrial', ctx: myAudioContext });
// legacy form still works:
playUISound('warning', 'industrial', myAudioContext);
```

`getAudioContext()` returns that shared instance (or `null` if unavailable). `warmUpAudio()` creates/resumes it after a user gesture.

---

## Sound types

| Type | Typical use |
|------|-------------|
| `click` | Standard UI click |
| `pop` | Toggles, badges, soft confirms |
| `toggle` | Combined switch action |
| `press` / `release` | Pointer down / up (more tactile than a single click) |
| `hover` | Pointer enter (throttled 150ms by default) |
| `tick` | Steppers, scrubbers (throttled) |
| `keystroke` | Text input feedback (throttled 80ms; keep volume low) |
| `select` / `deselect` | Checkboxes, list items, tabs |
| `drop` | Modal close / dismiss |
| `delete` / `remove` | Remove from list (descending swoosh; distinct from `drop`) |
| `success` | Completed action |
| `error` | Failure |
| `warning` | Attention needed |
| `notify` | Neutral toast / async alert (not a failure) |
| `startup` | App boot / session start chord |
| `connect` / `disconnect` | Online status, websocket, presence |

### Ambient (loopable)

Unlike one-shot “work started” cues, loading can run for the whole in-progress state:

```javascript
import { startAmbient, stopAmbient } from '@thenormvg/web-have-sounds';

startAmbient('loading');
// … upload / long compute …
stopAmbient();
```

Only one ambient runs at a time; starting a new one replaces the previous. Disabling sounds via `setUISoundsEnabled(false)` also stops ambient.

---

## Feels — when to use which

A **Feel** is a preset for oscillators, filters, timing, and pitch. Pass it per call or set it globally with `configureUISounds`.

| Feel | Character | Good for |
|------|-----------|----------|
| `aero` (default) | Clean, modern sine | General product UI |
| `soft` | Gentle, longer decay | Wellness, consumer, onboarding |
| `glass` | High, resonant, premium | Creative tools, design apps, marketing |
| `minimal` | Quiet, restrained | Dense dashboards, writing apps |
| `crisp` | Bright, quick triangle | Productivity, sharp feedback |
| `organic` | Warm triangle | Lifestyle, content, community |
| `arcade` | 8-bit square, snappy | Games, playful products |
| `retro` | Soft square, nostalgic | Pixel/retro aesthetics |
| `industrial` | Aggressive saw, weighty | Dev tools, infra, monitoring |

```javascript
playUISound('success', 'arcade');
playUISound('success', 'glass');
```

---

## Custom feels & sounds (define once, use everywhere)

This is the main power-path differentiator: ship **your** brand palette and signature interactions as first-class names across the whole app — imperative API, global config, and declarative HTML.

### Register a custom Feel

```javascript
import {
  registerFeel,
  configureUISounds,
  playUISound,
} from '@thenormvg/web-have-sounds';

registerFeel('brand', {
  filterFreq: 4200,
  q: 6,
  oscType: 'triangle',
  decayMult: 0.7,
  gainMult: 0.9,
  pitchMult: 1.15,
  pan: 0,
  attackMult: 0.8,
  sustainLevel: 0.5,
  releaseMult: 1.1,
});

// Use as the app default
configureUISounds({ feel: 'brand' });

playUISound('success');        // brand feel
playUISound('click', 'brand'); // explicit
```

HTML after `bindUISounds()`:

```html
<button data-uisound="pop" data-uisound-feel="brand">Save</button>
```

Helpers: `unregisterFeel(name)`, `hasFeel(name)`, `listCustomFeels()`.

### Register a custom Sound

Write any Web Audio graph. The library handles mute, master volume, feel resolution, pan routing, throttle, and SSR safety.

```javascript
import {
  registerSound,
  playUISound,
  synthHelpers,
  bindUISounds,
} from '@thenormvg/web-have-sounds';

registerSound(
  'whoosh',
  ({ ctx, time, params, volume, connect }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = params.oscType;
    osc.frequency.setValueAtTime(900 * params.pitchMult, time);
    osc.frequency.exponentialRampToValueAtTime(
      100 * params.pitchMult,
      time + 0.22 * params.decayMult
    );

    // Optional: shared ADSR helper
    const dur = synthHelpers.envelope(gain, time, 0.28 * volume, params, 0.22);

    osc.connect(gain);
    connect(gain); // always use connect() so pan works
    osc.start(time);
    osc.stop(time + dur + 0.02);
  },
  { throttleMs: 120, defaultEvent: 'click' }
);

playUISound('whoosh');
playUISound('whoosh', 'brand');
playUISound('whoosh', { feel: 'glass', pan: -0.4 });
```

```html
<button data-uisound="whoosh" data-uisound-feel="brand">Swoosh</button>
```

#### `SoundSynthContext`

| Field | Meaning |
|-------|---------|
| `ctx` | `AudioContext` |
| `time` | Schedule start (`ctx.currentTime`) |
| `params` | Resolved feel (`ResolvedFeelParams`) |
| `volume` | `gainMult * masterVolume` — scale your peaks with this |
| `connect(node)` | Route into the output chain (handles stereo pan) |

Helpers: `unregisterSound(name)`, `hasSound(name)`, `listCustomSounds()`, `synthHelpers.envelope` / `synthHelpers.clamp`.

### Typical app bootstrap

```javascript
// audio/setup.ts — import once at app entry
import {
  registerFeel,
  registerSound,
  configureUISounds,
  bindUISounds,
  warmUpAudio,
} from '@thenormvg/web-have-sounds';

registerFeel('brand', { /* ... */ });
registerSound('whoosh', (synth) => { /* ... */ });
registerSound('coin', (synth) => { /* ... */ }, { throttleMs: 80 });

configureUISounds({ feel: 'brand', volume: 0.85, randomize: true });

document.addEventListener('pointerdown', () => warmUpAudio(), { once: true });
bindUISounds();
```

After that, any component can call `playUISound('coin')` or use `data-uisound="coin"` without re-passing params.

---

## Advanced: inline custom parameters

Bypass named Feels with a full `FeelParams` object (one-off, no registration):

```javascript
playUISound('toggle', {
  filterFreq: 4000,
  q: 5,
  oscType: 'square',
  decayMult: 0.2,
  gainMult: 1.0,
  pitchMult: 2.0,
  // optional extensions
  pan: 0.4,           // -1 left … 1 right
  attackMult: 0.5,    // faster attack
  sustainLevel: 0.4,  // 0–1 relative sustain
  releaseMult: 1.2,   // longer release
});
```

Or use `PlayOptions` for one-off overrides without replacing the whole feel:

```javascript
playUISound('notify', {
  feel: 'glass',
  pan: 0.6,        // toast from the right
  randomize: true,
});
```

### Parameter reference (`FeelParams`)

| Field | Role |
|-------|------|
| `filterFreq` | Filter cutoff (Hz) |
| `q` | Filter resonance |
| `oscType` | `sine` \| `square` \| `sawtooth` \| `triangle` |
| `decayMult` | Duration / decay speed (lower = faster) |
| `gainMult` | Per-sound volume (multiplied by master volume) |
| `pitchMult` | Global pitch (higher = brighter/squeakier) |
| `pan?` | Stereo pan `-1`…`1` |
| `attackMult?` | Attack time multiplier (default `1`) |
| `sustainLevel?` | Sustain level `0`…`1` (default `0.6`) |
| `releaseMult?` | Release time multiplier (default `1`) |

---

## Declarative binding

Zero-effort ergonomics **without** giving up parameterization:

```html
<button data-uisound="click">Save</button>
<button data-uisound="success" data-uisound-feel="arcade">Level up</button>
<button
  data-uisound="delete"
  data-uisound-params='{"filterFreq":3000,"q":4,"oscType":"sawtooth","decayMult":1,"gainMult":0.9,"pitchMult":1,"pan":-0.2}'
>
  Remove
</button>
<div data-uisound="hover" data-uisound-feel="soft">Hover me</div>
<input data-uisound="keystroke" data-uisound-feel="minimal" />
```

```javascript
import { bindUISounds, warmUpAudio } from '@thenormvg/web-have-sounds';

document.addEventListener('pointerdown', () => warmUpAudio(), { once: true });

const unbind = bindUISounds(); // document-wide
// or: bindUISounds({ root: document.getElementById('app') });

// later: unbind();
```

| Attribute | Meaning |
|-----------|---------|
| `data-uisound` | `SoundType` (required) |
| `data-uisound-feel` | Feel name |
| `data-uisound-params` | JSON `FeelParams` (wins over feel when both set) |
| `data-uisound-event` | DOM event override (defaults: `click`, or `pointerenter`/`pointerdown`/`pointerup`/`keydown` for hover/press/release/keystroke) |
| `data-uisound-pan` | Pan `-1`…`1` |

---

## API reference

### Playback

```ts
playUISound(type, feelOrParams?, ctx?)
playUISound(type, options?)  // PlayOptions: { feel?, pan?, randomize?, ctx? }
```

### Config & safety

| API | Description |
|-----|-------------|
| `configureUISounds(config)` | Global feel, volume, enabled, randomize, throttleMs |
| `setUISoundsEnabled(boolean)` / `isUISoundsEnabled()` | Master mute |
| `setMasterVolume(0–1)` / `getMasterVolume()` | Master volume |
| `getAudioContext()` | Shared context or `null` (never throws) |
| `warmUpAudio(ctx?)` | Unlock/resume after a user gesture |

### Custom catalog

| API | Description |
|-----|-------------|
| `registerFeel(name, params)` | Named feel for app-wide reuse |
| `unregisterFeel(name)` / `hasFeel` / `listCustomFeels` | Manage custom feels |
| `registerSound(name, fn, opts?)` | Named custom synthesizer |
| `unregisterSound(name)` / `hasSound` / `listCustomSounds` | Manage custom sounds |
| `synthHelpers` | Shared `envelope` + `clamp` for custom synths |

### Ambient

| API | Description |
|-----|-------------|
| `startAmbient('loading', feel?, ctx?)` | Loopable loading bed |
| `stopAmbient()` | Fade out and stop |
| `isAmbientPlaying()` | Whether ambient is active |

### Declarative

| API | Description |
|-----|-------------|
| `bindUISounds({ root?, capture? })` | Returns `unbind()` |

### Types

```typescript
type SoundType =
  | "click" | "pop" | "toggle" | "tick" | "drop"
  | "success" | "error" | "warning" | "startup"
  | "hover" | "press" | "release"
  | "select" | "deselect" | "delete" | "remove"
  | "notify" | "keystroke" | "connect" | "disconnect";

type SoundId = SoundType | (string & {}); // built-in or registerSound name
type FeelId = FeelType | (string & {});   // built-in or registerFeel name

type AmbientType = "loading";

type FeelType =
  | "soft" | "aero" | "arcade" | "organic" | "glass"
  | "industrial" | "minimal" | "retro" | "crisp";

interface FeelParams { /* filterFreq, q, oscType, decayMult, gainMult, pitchMult, pan?, attackMult?, sustainLevel?, releaseMult? */ }

type SoundSynthFn = (synth: SoundSynthContext) => void;

interface UISoundsConfig {
  feel?: FeelId | FeelParams;
  volume?: number;
  enabled?: boolean;
  randomize?: boolean;
  throttleMs?: Partial<Record<string, number>>;
}
```

---

## License

MIT License
