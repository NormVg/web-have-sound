<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Copy, Check } from '@lucide/vue'
import {
  playUISound,
  startLoop,
  stopLoop,
  configureUISounds,
  FEEL_PRESETS,
  setMasterVolume,
  bindUISounds,
} from '@thenormvg/web-have-sounds'

const agentDocsMarkdown = `# @thenormvg/web-have-sounds

Procedural UI sounds via the Web Audio API — zero dependencies, zero audio files.

## 1. Installation

The library is zero-dependency and uses the native Web Audio API to synthesize all sounds procedurally. There are no MP3/WAV files to load.

\`\`\`bash
npm install @thenormvg/web-have-sounds
\`\`\`

**AI Agent Skill:** If you are using Claude Code, install the \`web-have-sounds\` skill directly into your project to teach your AI how to implement this library according to UI audio best practices.
\`\`\`bash
npx skills add normvg/web-have-sound --skill web-have-sounds
\`\`\`

## 2. Quick Start

You can trigger sounds manually via code, or declaratively using HTML data attributes.

\`\`\`ts
import { configureUISounds, playUISound } from '@thenormvg/web-have-sounds';

// Initialize the global engine
configureUISounds({
  feel: 'aero', // Try 'arcade', 'industrial', 'glass'...
  volume: 0.8,
});

// Trigger a sound
playUISound('click');
playUISound('error', 'industrial'); // Override the global feel for a specific event
\`\`\`

## 3. Architecture

Built-ins are pre-registered the same way as custom entries — one single code path.

\`\`\`
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
\`\`\`

## 4. Global Config

Configure the global state of the singleton audio engine.

\`\`\`js
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
\`\`\`

## 5. Feels Catalog

"Feels" are synthesizer presets that completely change the aesthetic of all sounds. They dictate the ADSR envelope multipliers, oscillator waveforms, and low-pass filter settings.

- \`aero\` - Clean modern sine
- \`soft\` - Gentle, longer
- \`glass\` - High, resonant
- \`minimal\` - Quiet
- \`crisp\` - Bright, quick
- \`organic\` - Warm triangle
- \`arcade\` - 8-bit square
- \`retro\` - Soft square
- \`industrial\` - Heavy saw

## 6. One-Shot Sounds

Trigger these using \`playUISound(id)\` or the \`data-uisound="id"\` attribute.

- \`click\`, \`pop\`, \`tick\`, \`drop\`, \`hover\`, \`thud\`
- \`success\`, \`error\`, \`warning\`, \`notify\`
- \`startup\`, \`connect\`, \`disconnect\`
- \`toggle\`, \`press\`, \`release\`, \`select\`, \`deselect\`
- \`delete\`, \`remove\`, \`keystroke\`

## 7. Ambient Loops

Ambient loops are long-running procedural soundscapes. They automatically fade in and out. You can run multiple loops simultaneously.

- \`loading\` - A pulsating, busy rhythm.
- \`processing\` - A rhythmic data-processing sound.
- \`pulse\` - A deep, rhythmic throb.
- \`hum\` - A low, steady mechanical hum.

\`\`\`ts
import { startLoop, stopLoop } from '@thenormvg/web-have-sounds';

startLoop('loading', { volume: 0.5 });
// ... later ...
stopLoop('loading'); // Or stopAllLoops();
\`\`\`

### Custom loops

You can register custom procedural loops that run indefinitely and can be faded in/out.

\`\`\`js
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
stopLoop('upload');
\`\`\`

## 8. Framework Integration

The easiest way to use the library is with declarative HTML attributes. Run \`bindUISounds()\` when your app mounts.

\`\`\`html
// HTML syntax
<button data-uisound="click" data-uisound-hover="hover">
  Submit
</button>
\`\`\`

### Vue / Nuxt
\`\`\`vue
<script setup>
import { onMounted } from 'vue'
import { bindUISounds } from '@thenormvg/web-have-sounds'

onMounted(() => {
  bindUISounds()
})
<\/script>
\`\`\`

### React / Next.js
\`\`\`jsx
import { useEffect } from 'react'
import { bindUISounds } from '@thenormvg/web-have-sounds';

function App() {
  useEffect(() => {
    return bindUISounds();
  }, []);
  return <div>...</div>;
}
\`\`\`

## 9. Custom API

For advanced users, you can write your own Web Audio API nodes and register them as sounds or feels into the catalog.

\`\`\`ts
import { registerSound, playUISound } from '@thenormvg/web-have-sounds';

registerSound('my_laser', ({ ctx, time, params, volume, connect }) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  // Use the global feel params
  osc.type = params.oscType; 
  osc.frequency.setValueAtTime(800 * params.pitchMult, time);
  osc.frequency.exponentialRampToValueAtTime(100, time + 0.2);
  
  gain.gain.setValueAtTime(volume, time);
  gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
  
  osc.connect(gain);
  
  // Must connect to the provided connect() callback to route 
  // through the master bus and volume controls
  connect(gain);
  
  osc.start(time);
  osc.stop(time + 0.2);
});

playUISound('my_laser');
\`\`\`

## 10. Isolated Engine (Optional)

The default exported functions operate on a shared global singleton, which is perfect for most web apps. If you need a completely isolated audio context (e.g. for independent game audio, or if you have multiple isolated micro-frontends on one page), you can instantiate a separate engine.

\`\`\`js
import { createUISounds } from '@thenormvg/web-have-sounds';

const sfx = createUISounds();
sfx.configure({ feel: 'arcade', debug: true });
sfx.play('click');
sfx.bind({ root: document.getElementById('game') });
\`\`\`

## 11. API Cheat Sheet

| API | Role |
|-----|------|
| \`playUISound\` / \`configureUISounds\` | Core interaction |
| \`warmUpAudio\` / \`getAudioContext\` | Audio unlock |
| \`setUISoundsEnabled\` / \`setMasterVolume\` | Mute & level |
| \`registerFeel\` / \`registerSound\` | Catalog |
| \`startLoop\` / \`stopLoop\` / \`stopAllLoops\` | Long-running beds |
| \`bindUISounds\` | DOM attributes |
| \`createUISounds\` | Isolated instance |

## 12. Error Handling Philosophy

This library is designed for UI augmentation and strictly prioritizes application stability. It follows a **"graceful degradation"** model.

- **Silent Failures:** The library uses extensive \`try/catch\` blocks internally. If the browser blocks audio (e.g., due to autoplay policies), or if a sound fails to synthesize, the error is caught and swallowed. This guarantees that calling \`playUISound()\` will **never** throw an exception that could crash your React/Vue application.
- **Opt-in Debugging:** If you need to troubleshoot why sounds aren't playing (e.g., missing names, bad registrations, or autoplay blocks), initialize with debug mode. This routes internal failures to \`console.warn\` so you can see them during development without crashing the app.

\`\`\`ts
import { configureUISounds } from '@thenormvg/web-have-sounds';

// Initialize with debug mode to route non-fatal 
// audio exceptions to console.warn
configureUISounds({ 
  debug: true 
});
\`\`\`
`

const copied = ref(false)

const copyDocs = () => {
  navigator.clipboard.writeText(agentDocsMarkdown).then(() => {
    copied.value = true
    playUISound('success')
    setTimeout(() => {
      copied.value = false
    }, 2000)
  })
}

// Local state for interactive docs
const selectedFeel = ref('aero')
const activeLoop = ref<string | null>(null)
const masterVolume = ref(0.8)

const sounds = [
  'click', 'pop', 'tick', 'drop', 'hover', 'thud',
  'success', 'error', 'warning', 'notify',
  'startup', 'connect', 'disconnect',
  'toggle', 'press', 'release', 'select', 'deselect',
  'delete', 'remove', 'keystroke'
]

const loops = ['loading', 'processing', 'pulse', 'hum']

const getSoundColor = (id: string) => {
  const colors: Record<string, string> = {
    success: 'bg-emerald-500',
    startup: 'bg-emerald-400',
    connect: 'bg-emerald-400',
    error: 'bg-rose-500',
    delete: 'bg-rose-400',
    remove: 'bg-rose-400',
    warning: 'bg-amber-500',
    disconnect: 'bg-amber-400',
    notify: 'bg-blue-500',
    toggle: 'bg-indigo-400',
    press: 'bg-indigo-400',
    release: 'bg-indigo-300',
    select: 'bg-indigo-400',
    deselect: 'bg-indigo-300',
    drop: 'bg-cyan-400',
    pop: 'bg-[var(--color-liquid-lava)]',
    click: 'bg-zinc-400',
    tick: 'bg-zinc-400',
    hover: 'bg-zinc-400',
    thud: 'bg-slate-800',
    keystroke: 'bg-zinc-400'
  }
  return colors[id] || 'bg-zinc-400'
}

const toggleDocsLoop = (loopId: string) => {
  if (activeLoop.value === loopId) {
    stopLoop(loopId)
    activeLoop.value = null
    playUISound('release')
  } else {
    if (activeLoop.value) {
      stopLoop(activeLoop.value)
    }
    startLoop(loopId, { feel: selectedFeel.value, volume: 0.6 })
    activeLoop.value = loopId
    playUISound('press')
  }
}

const playPreview = (id: string) => {
  playUISound(id as any, selectedFeel.value)
  triggerOscilloscope(id)
}

// --- VISUALIZER STATE ---
const oscCanvas = ref<HTMLCanvasElement | null>(null)
const oscData = ref({ activeSound: 'chime', freq: 1047, time: 0.36, amplitude: 0 })
let oscFrame: any = null

const drawOscilloscope = () => {
  if (!oscCanvas.value) return
  const canvas = oscCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
  const rect = canvas.getBoundingClientRect()
  if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
  } else {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  const width = rect.width
  const height = rect.height

  ctx.clearRect(0, 0, width, height)
  
  // Draw faint grid
  ctx.strokeStyle = '#00000005'
  ctx.lineWidth = 1
  for(let x = 0; x < width; x += 15) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
  for(let y = 0; y < height; y += 15) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }

  // Draw wave
  const time = Date.now() / 1000
  const amp = oscData.value.amplitude
  const baseFreq = oscData.value.freq / 100
  const sName = oscData.value.activeSound
  
  ctx.beginPath()
  ctx.moveTo(0, height / 2)
  for(let x = 0; x < width; x += 2) {
    let y = 0
    if (sName === 'error' || sName === 'delete' || sName === 'remove') {
      // Distorted / noisy
      y = (Math.sin(x * 0.05 * baseFreq + time * 8) + Math.sin(x * 0.1 * baseFreq) * 0.5 + (Math.random() - 0.5) * 0.5) * (2 + 25 * amp)
    } else if (sName === 'success' || sName === 'startup' || sName === 'connect') {
      // FM / rising complexity
      y = Math.sin(x * 0.05 * baseFreq + Math.sin(x * 0.01 + time * 4) * 2 + time * 8) * (2 + 25 * amp)
    } else if (sName === 'hover' || sName === 'tick' || sName === 'click' || sName === 'keystroke') {
      // Short transient
      y = Math.sin(x * 0.1 * baseFreq + time * 12) * (2 + 25 * amp)
    } else if (sName === 'thud') {
      // Heavy low frequency, large amplitude
      y = Math.sin(x * 0.02 * baseFreq + time * 4) * (2 + 40 * amp)
    } else if (sName === 'pop' || sName === 'drop') {
      // Bouncy / rounded
      y = Math.abs(Math.sin(x * 0.04 * baseFreq + time * 8)) * (4 + 30 * amp) - (2 + 15 * amp)
    } else if (sName === 'warning' || sName === 'disconnect') {
      // Square-ish / aggressive
      y = Math.sign(Math.sin(x * 0.05 * baseFreq + time * 8)) * (2 + 20 * amp)
    } else {
      // Default sine (notify, select, toggle, etc)
      y = Math.sin(x * 0.05 * baseFreq + time * 8) * (2 + 25 * amp)
    }
    ctx.lineTo(x, height / 2 + y)
  }
  ctx.strokeStyle = '#ff6b35'
  ctx.lineWidth = 2
  ctx.shadowColor = 'rgba(255, 107, 53, 0.4)'
  ctx.shadowBlur = 6
  ctx.stroke()
  
  oscData.value.amplitude = Math.max(0, oscData.value.amplitude - 0.04)
  oscData.value.time = Math.min(1.0, oscData.value.time + 0.01)
  
  oscFrame = requestAnimationFrame(drawOscilloscope)
}

const triggerOscilloscope = (soundName: string) => {
  oscData.value.activeSound = soundName
  oscData.value.freq = 400 + Math.floor(Math.random() * 800)
  oscData.value.time = 0.0
  oscData.value.amplitude = 1.0
}

const codeInstall = `npm install @thenormvg/web-have-sounds`

const codeQuickstart = `import { configureUISounds, playUISound } from '@thenormvg/web-have-sounds';

// Initialize the global engine
configureUISounds({
  feel: 'aero', // Try 'arcade', 'industrial', 'glass'...
  volume: 0.8,
});

// Trigger a sound
playUISound('click');
playUISound('error', 'industrial'); // Override the global feel for a specific event`

const codeHtml = `// HTML syntax
<button data-uisound="click" data-uisound-hover="hover">
  Submit
</button>`

const codeVue = `import { onMounted, onUnmounted } from 'vue';
import { bindUISounds } from '@thenormvg/web-have-sounds';

export default {
  setup() {
    onMounted(() => {
      const unbind = bindUISounds();
      onUnmounted(unbind);
    });
  }
}`

const codeReact = `import { useEffect } from 'react';
import { bindUISounds } from '@thenormvg/web-have-sounds';

function App() {
  useEffect(() => {
    return bindUISounds();
  }, []);
  return <div>...</div>;
}`

const codeCustom = `import { registerSound, playUISound } from '@thenormvg/web-have-sounds';

registerSound('my_laser', ({ ctx, time, params, volume, connect }) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  // Use the global feel params
  osc.type = params.oscType; 
  osc.frequency.setValueAtTime(800 * params.pitchMult, time);
  osc.frequency.exponentialRampToValueAtTime(100, time + 0.2);
  
  gain.gain.setValueAtTime(volume, time);
  gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
  
  osc.connect(gain);
  
  // Must connect to the provided connect() callback to route 
  // through the master bus and volume controls
  connect(gain);
  
  osc.start(time);
  osc.stop(time + 0.2);
});

playUISound('my_laser');`

const codeErrorHandling = `import { configureUISounds } from '@thenormvg/web-have-sounds';

// Initialize with debug mode to route non-fatal 
// audio exceptions to console.warn
configureUISounds({ 
  debug: true 
});`

const codeGlobalConfig = `configureUISounds({
  feel: 'industrial',
  volume: 0.7,
  enabled: true,
  randomize: true,
  throttleMs: { hover: 150, keystroke: 80 },
  debug: true, // console.warn for typos & bad setup
});

setUISoundsEnabled(false);
setMasterVolume(0.5);`

const codeArchitecture = `configure / registerFeel / registerSound / registerLoop
                    ↓
              Catalog (names)
         ┌──────────┴──────────┐
     play()                 LoopRuntime
   (one-shots)            (long-running)
         └──────────┬──────────┘
                    ↓
            AudioEngine
   synth → [pan] → [loop bus] → master → out`

const codeCustomLoop = `registerLoop(
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
stopLoop('upload');`

const codeIsolatedEngine = `import { createUISounds } from '@thenormvg/web-have-sounds';

const sfx = createUISounds();
sfx.configure({ feel: 'arcade', debug: true });
sfx.play('click');
sfx.bind({ root: document.getElementById('game') });`

onMounted(() => {
  configureUISounds({
    feel: selectedFeel.value,
    volume: masterVolume.value
  })
  bindUISounds()
  oscFrame = requestAnimationFrame(drawOscilloscope)
})

onUnmounted(() => {
  if (oscFrame) cancelAnimationFrame(oscFrame)
})
</script>

<template>
  <!-- Neutral physical desk background outside the column -->
  <div class="min-h-[100dvh] bg-[#d4d4d4] font-mono selection:bg-[var(--color-liquid-lava)] selection:text-white">
    
    <!-- THE CENTERED COLUMN (Physical Unit) -->
    <div class="w-full max-w-[900px] mx-auto min-h-[100dvh] flex flex-col shadow-[0_0_60px_rgba(0,0,0,0.25)] border-l-[6px] border-r-[6px] border-[#1a1a1a] relative bg-[var(--color-snow)] text-[var(--color-dark-void)]">
      
      <!-- Inner chamfer highlights -->
      <div class="absolute inset-y-0 left-0 w-[1px] bg-black/10 z-10 pointer-events-none"></div>
      <div class="absolute inset-y-0 right-0 w-[1px] bg-black/5 z-10 pointer-events-none"></div>

      <!-- Minimal Top Nav -->
      <header class="border-b border-black/5 sticky top-0 bg-[var(--color-snow)]/90 backdrop-blur-md z-50">
        <div class="max-w-3xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <NuxtLink to="/" class="flex items-center gap-3 group" title="Back to Sequencer" data-uisound="hover">
            <div class="w-2 h-2 rounded-full bg-[var(--color-liquid-lava)] group-hover:shadow-[0_0_12px_var(--color-liquid-lava)] transition-shadow duration-300"></div>
            <h1 class="text-[13px] font-medium tracking-wide text-black group-hover:text-black/70 transition-colors font-sans uppercase">
              Web Have Sounds
            </h1>
          </NuxtLink>
          
          <div class="flex items-center gap-5 text-[11px] uppercase tracking-widest font-medium">
            <a href="#installation" class="hidden sm:block text-black/50 hover:text-[var(--color-liquid-lava)] transition-colors" data-uisound="hover">Install</a>
            <a href="#quickstart" class="hidden sm:block text-black/50 hover:text-[var(--color-liquid-lava)] transition-colors" data-uisound="hover">Usage</a>
            <a href="#customization" class="hidden sm:block text-black/50 hover:text-[var(--color-liquid-lava)] transition-colors" data-uisound="hover">API</a>
            <div class="w-[1px] h-3 bg-black/10 hidden sm:block mx-1"></div>
            <button @click="copyDocs" class="flex items-center gap-1.5 text-black/50 hover:text-[var(--color-liquid-lava)] transition-colors" data-uisound="hover">
              <Copy v-if="!copied" class="w-3.5 h-3.5 opacity-70" />
              <Check v-else class="w-3.5 h-3.5 text-[var(--color-liquid-lava)]" />
              {{ copied ? 'COPIED' : 'COPY MD' }}
            </button>
          </div>
        </div>
      </header>

    <!-- Main Content -->
      <main class="max-w-3xl w-full mx-auto px-5 sm:px-8 py-12 sm:py-16 md:py-24 font-sans">
        
        <div class="prose prose-p:text-black/70 prose-p:text-[14px] prose-p:leading-relaxed prose-headings:text-black prose-a:text-[var(--color-liquid-lava)] hover:prose-a:text-[#ff8f40] prose-code:text-black max-w-none">
          
          <section id="installation" class="mb-20">
            <h2 class="text-xl font-semibold mb-4 tracking-tight">1. Installation</h2>
            <p class="mb-4">The library is zero-dependency and uses the native Web Audio API to synthesize all sounds procedurally. There are no MP3/WAV files to load.</p>
            <CodeSnippet :code="codeInstall" class="mb-8" />
            
            <h3 class="text-lg font-semibold mb-3 tracking-tight">AI Agent Skill</h3>
            <p class="mb-4 text-black/70">If you are using Claude Code or an agentic assistant, install the <code>web-have-sounds</code> skill to teach your AI how to perfectly implement this library according to UI audio best practices.</p>
            <CodeSnippet code="npx skills add normvg/web-have-sound --skill web-have-sounds" />
          </section>
  
          <section id="quickstart" class="mb-20">
            <h2 class="text-xl font-semibold mb-4 tracking-tight">2. Quick Start</h2>
            <p class="mb-4">You can trigger sounds manually via code, or declaratively using HTML data attributes.</p>
            <CodeSnippet :code="codeQuickstart" />
          </section>

          <section id="architecture" class="mb-20">
            <h2 class="text-xl font-semibold mb-4 tracking-tight">3. Architecture</h2>
            <p class="mb-4">Built-ins are pre-registered the same way as custom entries — one single code path.</p>
            <CodeSnippet :code="codeArchitecture" />
          </section>

          <section id="config" class="mb-20">
            <h2 class="text-xl font-semibold mb-4 tracking-tight">4. Global Config</h2>
            <p class="mb-4">Configure the global state of the singleton audio engine.</p>
            <CodeSnippet :code="codeGlobalConfig" />
          </section>

        <section id="feels" class="mb-20">
          <h2 class="text-xl font-semibold mb-4 tracking-tight">5. Feels Catalog</h2>
          <p class="mb-6">"Feels" are synthesizer presets that completely change the aesthetic of all sounds. They dictate the ADSR envelope multipliers, oscillator waveforms, and low-pass filter settings.</p>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div v-for="(params, name) in FEEL_PRESETS" :key="name" class="bg-white p-3 rounded border border-black/10 hover:border-[var(--color-liquid-lava)] shadow-sm transition-colors">
              <div class="font-semibold text-sm mb-1 capitalize">{{ name }}</div>
              <div class="text-[10px] font-mono text-black/50">
                Osc: {{ params.oscType }}<br>
                Freq: {{ params.filterFreq }}Hz<br>
                Q: {{ params.q }}
              </div>
            </div>
          </div>
        </section>

        <section id="oneshots" class="mb-20">
          <h2 class="text-xl font-semibold mb-4 tracking-tight">6. One-Shot Sounds</h2>
          <p class="mb-6">Click any of the buttons below to preview the built-in one-shot sounds. The sounds will synthesize according to the "Global Feel" selected at the top of this page.</p>
          
          <!-- DX Sandbox Controls -->
          <div class="bg-black/5 border border-black/10 rounded-lg p-4 sm:p-6 mb-8 flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-center justify-between">
            <div>
              <h3 class="text-sm font-semibold text-black mb-1">Interactive Sandbox</h3>
              <p class="text-xs text-black/60">Change the global feel to preview how the library renders audio below.</p>
            </div>
            
            <div class="flex flex-wrap items-center gap-4 sm:gap-6">
              <div class="flex items-center gap-3">
                <label class="text-xs text-black/50 font-mono">Feel</label>
                <select v-model="selectedFeel" @change="playUISound('select')" class="bg-white border border-black/20 text-black text-xs px-2 py-1 rounded outline-none focus:border-black font-mono min-w-24">
                  <option v-for="feel in Object.keys(FEEL_PRESETS)" :key="feel" :value="feel">{{ feel }}</option>
                </select>
              </div>
              
              <div class="flex items-center gap-3">
                <label class="text-xs text-black/50 font-mono">Vol</label>
                <input type="range" min="0" max="1" step="0.05" v-model.number="masterVolume" @input="setMasterVolume(masterVolume)" class="w-20 accent-[var(--color-liquid-lava)]">
              </div>
            </div>
          </div>

          <!-- Oscilloscope Widget -->
          <div class="bg-white rounded-[4px] p-4 sm:p-5 relative overflow-hidden border border-black/10 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col mb-6">
            <div class="flex flex-col sm:flex-row sm:justify-between items-start sm:items-baseline gap-2 sm:gap-0 mb-4 relative z-10">
              <div class="flex items-baseline gap-3">
                <span class="text-[13px] font-bold text-black/90">Sound palette</span> 
                <span class="text-[10px] text-black/40 font-mono">oscilloscope output</span>
              </div>
              <div class="text-[10px] font-mono text-black/40 bg-black/5 px-2 py-0.5 rounded-sm">{{ oscData.activeSound }} &nbsp;{{ oscData.freq }} Hz &middot; {{ oscData.time.toFixed(2) }} s</div>
            </div>
            <canvas ref="oscCanvas" class="w-full h-[40px] relative z-0"></canvas>
          </div>

          <div class="flex flex-wrap gap-2">
            <button 
              v-for="sound in sounds" 
              :key="sound"
              @click="playPreview(sound)"
              @mouseenter="playUISound('hover')"
              class="bg-white hover:bg-black/5 border border-black/10 hover:border-black/20 rounded px-3 py-1.5 text-xs font-mono text-black/70 hover:text-black shadow-sm transition-colors flex items-center gap-2"
            >
              <span class="w-1.5 h-1.5 rounded-full" :class="getSoundColor(sound)"></span>
              {{ sound }}
            </button>
          </div>
        </section>

        <section id="loops" class="mb-20">
          <h2 class="text-xl font-semibold mb-4 tracking-tight">7. Ambient Loops</h2>
          <p class="mb-6">Ambient loops are long-running procedural soundscapes. They automatically fade in and out. You can run multiple loops simultaneously.</p>
          
          <div class="flex flex-wrap gap-3">
            <button 
              v-for="loop in loops" 
              :key="loop"
              @click="toggleDocsLoop(loop)"
              @mouseenter="playUISound('hover')"
              class="border rounded px-4 py-2 text-xs font-mono transition-colors flex items-center gap-2 shadow-sm"
              :class="activeLoop === loop ? 'bg-black text-white border-black' : 'bg-white border-black/10 text-black/70 hover:text-black hover:border-black/30'"
            >
              <span class="w-1.5 h-1.5 rounded-full" :class="activeLoop === loop ? 'bg-red-500 animate-pulse' : 'bg-black/20'"></span>
              <span class="uppercase">{{ loop }}</span>
            </button>
          </div>
          
          <h3 class="text-sm font-semibold text-black mt-8 mb-2">Custom loops</h3>
          <p class="mb-4">You can register custom procedural loops that run indefinitely and can be faded in/out.</p>
          <CodeSnippet :code="codeCustomLoop" />
        </section>

        <section id="frameworks" class="mb-20">
          <h2 class="text-xl font-semibold mb-4 tracking-tight">8. Framework Integration</h2>
          <p class="mb-4">The easiest way to use the library is with declarative HTML attributes. Run <code class="bg-black/5 px-1.5 py-0.5 rounded text-black border border-black/10">bindUISounds()</code> when your app mounts.</p>
          
          <CodeSnippet :code="codeHtml" />

          <div class="flex flex-col gap-6">
            <div>
              <h3 class="text-xs font-semibold text-black/50 mb-2 uppercase tracking-wider">Vue / Nuxt</h3>
              <CodeSnippet :code="codeVue" />
            </div>
            
            <div>
              <h3 class="text-xs font-semibold text-black/50 mb-2 uppercase tracking-wider">React / Next.js</h3>
              <CodeSnippet :code="codeReact" />
            </div>
          </div>
        </section>

        <section id="customization" class="mb-20">
          <h2 class="text-xl font-semibold mb-4 tracking-tight">9. Custom API</h2>
          <p class="mb-6">For advanced users, you can write your own Web Audio API nodes and register them as sounds or feels into the catalog.</p>
          
          <CodeSnippet :code="codeCustom" />
        </section>

        <section id="isolated" class="mb-20">
          <h2 class="text-xl font-semibold mb-4 tracking-tight">10. Isolated Engine (Optional)</h2>
          <p class="mb-4">The default exported functions operate on a shared global singleton, which is perfect for most web apps. If you need a completely isolated audio context (e.g. for independent game audio, or if you have multiple isolated micro-frontends on one page), you can instantiate a separate engine.</p>
          <CodeSnippet :code="codeIsolatedEngine" />
        </section>

        <section id="cheatsheet" class="mb-20">
          <h2 class="text-xl font-semibold mb-4 tracking-tight">11. API Cheat Sheet</h2>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm text-black/80">
              <thead class="text-xs uppercase bg-black/5 text-black">
                <tr><th class="px-4 py-3 rounded-tl">API</th><th class="px-4 py-3 rounded-tr">Role</th></tr>
              </thead>
              <tbody class="divide-y divide-black/10">
                <tr><td class="px-4 py-3 font-mono text-xs"><code>playUISound</code> / <code>configureUISounds</code></td><td class="px-4 py-3">Core interaction</td></tr>
                <tr><td class="px-4 py-3 font-mono text-xs"><code>warmUpAudio</code> / <code>getAudioContext</code></td><td class="px-4 py-3">Audio unlock</td></tr>
                <tr><td class="px-4 py-3 font-mono text-xs"><code>setUISoundsEnabled</code> / <code>setMasterVolume</code></td><td class="px-4 py-3">Mute & level</td></tr>
                <tr><td class="px-4 py-3 font-mono text-xs"><code>registerFeel</code> / <code>registerSound</code></td><td class="px-4 py-3">Catalog</td></tr>
                <tr><td class="px-4 py-3 font-mono text-xs"><code>startLoop</code> / <code>stopLoop</code> / <code>stopAllLoops</code></td><td class="px-4 py-3">Long-running beds</td></tr>
                <tr><td class="px-4 py-3 font-mono text-xs"><code>bindUISounds</code></td><td class="px-4 py-3">DOM attributes</td></tr>
                <tr><td class="px-4 py-3 font-mono text-xs"><code>createUISounds</code></td><td class="px-4 py-3">Isolated instance</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="error-handling" class="mb-20">
          <h2 class="text-xl font-semibold mb-4 tracking-tight">12. Error Handling Philosophy</h2>
          <p class="mb-4 text-[15px] leading-relaxed text-black/80">This library is designed for UI augmentation and strictly prioritizes application stability. It follows a <strong>"graceful degradation"</strong> model.</p>
          <ul class="list-disc pl-5 mb-6 text-[15px] leading-relaxed text-black/80 space-y-2">
            <li><strong>Silent Failures:</strong> The library uses extensive <code>try/catch</code> blocks internally. If the browser blocks audio (e.g., due to autoplay policies), or if a sound fails to synthesize, the error is caught and swallowed. This guarantees that calling <code>playUISound()</code> will <strong>never</strong> throw an exception that could crash your React/Vue application.</li>
            <li><strong>Opt-in Debugging:</strong> If you need to troubleshoot why sounds aren't playing (e.g., missing names, bad registrations, or autoplay blocks), initialize with debug mode. This routes internal failures to <code>console.warn</code> so you can see them during development without crashing the app.</li>
          </ul>
          <CodeSnippet :code="codeErrorHandling" />
        </section>

      </div>
      </main>
      
      <!-- Footer -->
      <footer class="max-w-3xl w-full mx-auto px-5 sm:px-8 py-12 border-t border-black/10 mt-20 text-sm">
        <div class="flex flex-col sm:flex-row justify-between items-center gap-6 text-black/50 font-sans">
          <div class="flex gap-6 font-medium">
            <a href="https://x.com/TheNormVg" target="_blank" class="hover:text-[var(--color-liquid-lava)] transition-colors">X / Twitter</a>
            <a href="https://github.com/NormVg" target="_blank" class="hover:text-[var(--color-liquid-lava)] transition-colors">GitHub</a>
            <a href="https://taohq.org" target="_blank" class="hover:text-[var(--color-liquid-lava)] transition-colors" title="A product by TheAlphaOnes">TheAlphaOnes</a>
          </div>
          <div class="text-xs uppercase tracking-widest font-mono opacity-60">
            v1.6.4 &copy; TheAlphaOnes
          </div>
        </div>
      </footer>
      
    </div>
  </div>
</template>


<style scoped>
html {
  scroll-behavior: smooth;
}
</style>
