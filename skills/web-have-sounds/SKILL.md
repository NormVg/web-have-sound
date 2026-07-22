---
name: web-have-sounds
description: Best practices and API documentation for adding procedural audio, UI sounds, or audio feedback to a web application using the @thenormvg/web-have-sounds library. Make sure to use this skill whenever the user mentions "sounds", "audio", "ui feedback", "ambient loops", or wants to augment interactions with audio.
---

# Web Have Sounds

A skill for correctly implementing procedural audio UI feedback using `@thenormvg/web-have-sounds`, while strictly adhering to sound design UI/UX best practices.

This library is a zero-dependency, procedural audio synthesizer that uses the Web Audio API. It does not use MP3/WAV files. 

## 1. UX Audio Principles (CRITICAL)

Before writing any code to play sounds, you must adhere to these sound design rules:

- **Visual Equivalent (`a11y-visual-equivalent`)**: Every sound MUST have a visual equivalent (a toast, animation, border change). Sound should augment, not replace, visual feedback.
- **Appropriate Context (`appropriate-confirmations-only`)**: Only play sounds for significant interactions: confirmations, payments, uploads, errors, and warnings.
- **No Decorative Sounds (`appropriate-no-decorative`)**: Do NOT play sound on `hover` or for basic keyboard navigation.
- **Respect User State (`a11y-toggle-setting`)**: Respect reduced motion and provide a toggle for users to mute sounds if needed.
- **Subtle Volume (`impl-default-subtle`)**: Keep the default volume subtle (e.g., `0.3` to `0.5`). 

## 2. Global Initialization

Initialize the global engine once at the root of the app (e.g. `App.vue`, `_app.tsx`). The `configureUISounds` function creates the singleton engine.

```typescript
import { configureUISounds } from '@thenormvg/web-have-sounds';

// Initialize with a default 'Feel'
configureUISounds({
  feel: 'aero', // 'aero' (default), 'soft', 'glass', 'minimal', 'arcade', 'industrial'
  volume: 0.5,
  debug: true // Enables console.warns for silent failures (recommended in dev)
});
```

*Note: The library handles `context-reuse-single`, `context-resume-suspended`, and node cleanup (`context-cleanup-nodes`) automatically. Do not attempt to manage AudioContexts manually.*

## 3. Playing One-Shot Sounds

To trigger sounds, import `playUISound`. The library guarantees silent failure, so you do not need to wrap this in `try/catch`. 

```typescript
import { playUISound } from '@thenormvg/web-have-sounds';

// Good: Playing on significant interaction
function handleSubmit() {
  playUISound('click');
  // ... do work ...
  playUISound('success', 'arcade'); // Override the global feel for a specific event
}
```

**Built-in Sounds:**
- `click`, `pop`, `thud`, `tick`
- `success`, `error`, `warning`, `notify`
- `startup`, `connect`, `disconnect`
- `toggle`, `press`, `release`, `select`, `deselect`
- `delete`, `remove`, `drop`

## 4. Playing Ambient Loops

Loops are long-running procedural soundscapes (beds) that fade in and out.
Built-ins: `loading`, `processing`, `pulse`, `hum`.

```typescript
import { startLoop, stopLoop, stopAllLoops } from '@thenormvg/web-have-sounds';

// Start a loop (automatically fades in)
startLoop('loading', { volume: 0.4, feel: 'soft' });

// Stop a loop (automatically fades out)
stopLoop('loading'); 

// Stop all running loops
stopAllLoops();
```

## 5. Declarative HTML Binding

You can bind sounds directly to HTML attributes without writing JS event listeners. You must call `bindUISounds()` when the component mounts.

```html
<button data-uisound="click" data-uisound-feel="industrial">Submit</button>
```

```javascript
import { bindUISounds } from '@thenormvg/web-have-sounds';
import { useEffect } from 'react'; // or onMounted in Vue

useEffect(() => {
  const unbind = bindUISounds();
  return unbind;
}, []);
```

## 6. Custom Sound Synthesis Rules

If the user asks to create a custom sound (`registerSound`) or a custom loop (`registerLoop`), follow these acoustic design principles:

- **Exponential Decay (`envelope-exponential-decay`)**: When writing custom Web Audio nodes, always use `exponentialRampToValueAtTime` targeting `0.001` or `0.01` (never exactly `0`, which crashes Web Audio).
- **Initial Values (`envelope-set-initial-value`)**: Always set an initial value via `setValueAtTime` before ramping.
- **Tonal vs Percussive**: Use oscillators with pitch sweeps for tonal sounds (`design-oscillator-for-tonal`).
- **Durations (`param-click-duration`)**: Click sounds should have a duration of 5-15ms (0.005s to 0.015s).

**Example of a properly synthesized custom sound:**

```typescript
import { registerSound } from '@thenormvg/web-have-sounds';

registerSound('my_alert', ({ ctx, time, params, volume, connect }) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  // Use feel params for tone shaping
  osc.type = params.oscType; 
  osc.frequency.setValueAtTime(600 * params.pitchMult, time);
  
  // Exponential envelope targeting 0.001 (NOT 0)
  gain.gain.setValueAtTime(volume * params.gainMult, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
  
  osc.connect(gain);
  connect(gain); // Connect to master bus
  
  osc.start(time);
  osc.stop(time + 0.3);
});
```

## 7. Error Handling

Do NOT write `try/catch` wrappers around `playUISound`. The library is designed to swallow errors silently and return a `{ ok: boolean, reason: string }` object. 

If the user complains about sounds not playing, instruct them to pass `debug: true` into `configureUISounds` so they can see the warnings in their console.
