<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  playUISound,
  startLoop,
  stopLoop,
  configureUISounds,
  FEEL_PRESETS,
  setMasterVolume,
  bindUISounds,
} from '@thenormvg/web-have-sounds'

const agentDocsMarkdown = `
# @thenormvg/web-have-sounds

A high-performance, zero-dependency, procedural audio synthesizer library for UI interactions.

## Installation
\`\`\`bash
npm install @thenormvg/web-have-sounds
\`\`\`

## Quick Start
\`\`\`ts
import { configureUISounds, playUISound } from '@thenormvg/web-have-sounds';

// 1. Configure the engine (optional, defaults are provided)
configureUISounds({
  feel: 'aero', // The global synthesis profile
  volume: 0.8,
});

// 2. Play a sound!
playUISound('click');
\`\`\`

## Feel Presets
The library ships with several procedural synthesis algorithms called "Feels". These dictate the ADSR, filter frequency, oscillator type, and resonance of all sounds.

- \`aero\` - Light, airy, fast. (Default)
- \`arcade\` - Crunchy square waves, retro.
- \`industrial\` - Heavy, distorted, metallic.
- \`organic\` - Soft, sine-wave dominant, natural.
- \`glass\` - High-pitched, resonant, sharp.
- \`minimal\` - Extremely short, quiet ticks.
- \`retro\` - 8-bit game console style.
- \`crisp\` - Sharp attack, bright filters.
- \`soft\` - High damping, muted filters.

## One-Shot Sounds
Trigger these using \`playUISound(id)\` or the \`data-uisound="id"\` attribute.

- \`click\`, \`pop\`, \`tick\`, \`drop\`, \`hover\`
- \`success\`, \`error\`, \`warning\`, \`notify\`
- \`startup\`, \`connect\`, \`disconnect\`
- \`toggle\`, \`press\`, \`release\`, \`select\`, \`deselect\`
- \`delete\`, \`remove\`, \`keystroke\`

## Ambient Beds (Loops)
Trigger continuous, evolving soundscapes.

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

## Framework Usage

### Vue 3
Use declarative HTML attributes and the binding utility.
\`\`\`vue
<script setup>
import { onMounted } from 'vue';
import { bindUISounds } from '@thenormvg/web-have-sounds';

onMounted(() => {
  // Automatically attaches event listeners to all elements with data-uisound
  bindUISounds();
});
<\/script>
<template>
  <button data-uisound="click" data-uisound-hover="hover">Click me</button>
</template>
\`\`\`

### React
\`\`\`jsx
import { useEffect } from 'react';
import { bindUISounds, playUISound } from '@thenormvg/web-have-sounds';

function App() {
  useEffect(() => {
    return bindUISounds();
  }, []);

  return (
    <button data-uisound="click" onMouseEnter={() => playUISound('hover')}>
      Click me
    </button>
  );
}
\`\`\`

## Customization API
You can inject your own synthesis functions to create completely custom sounds.

\`\`\`ts
import { registerSound, registerFeel, registerLoop } from '@thenormvg/web-have-sounds';

// Custom Feel
registerFeel('alien', {
  oscType: 'sawtooth',
  filterFreq: 4000,
  q: 15,
  decayMult: 2.0,
  pitchMult: 0.5,
  gainMult: 1.0,
});

// Custom Sound
registerSound('laser', ({ ctx, time, params, volume, connect }) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = params.oscType;
  osc.frequency.setValueAtTime(800 * params.pitchMult, time);
  osc.frequency.exponentialRampToValueAtTime(100, time + 0.2);
  
  gain.gain.setValueAtTime(volume, time);
  gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
  
  osc.connect(gain);
  connect(gain); // Connects to the master output with spatial panning
  
  osc.start(time);
  osc.stop(time + 0.2);
});

playUISound('laser', 'alien');
\`\`\`
`

const copyStatus = ref('Copy Markdown for Agent')

const copyDocs = () => {
  navigator.clipboard.writeText(agentDocsMarkdown).then(() => {
    copyStatus.value = 'Copied! ✅'
    playUISound('success')
    setTimeout(() => {
      copyStatus.value = 'Copy Markdown for Agent'
    }, 2000)
  })
}

// Local state for interactive docs
const selectedFeel = ref('aero')
const activeLoop = ref<string | null>(null)
const masterVolume = ref(0.8)

const sounds = [
  'click', 'pop', 'tick', 'drop', 'hover',
  'success', 'error', 'warning', 'notify',
  'startup', 'connect', 'disconnect',
  'toggle', 'press', 'release', 'select', 'deselect',
  'delete', 'remove', 'keystroke'
]

const loops = ['loading', 'processing', 'pulse', 'hum']

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
}

onMounted(() => {
  configureUISounds({
    feel: selectedFeel.value,
    volume: masterVolume.value
  })
  bindUISounds()
})
</script>

<template>
  <div class="min-h-screen bg-[var(--bg-root)] text-[var(--text-primary)] font-sans selection:bg-white selection:text-black">
    
    <!-- Minimal Top Nav -->
    <header class="border-b border-white/10 sticky top-0 bg-[var(--bg-root)]/90 backdrop-blur-md z-50">
      <div class="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <NuxtLink to="/" class="text-white/40 hover:text-white transition-colors" title="Back to Sequencer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </NuxtLink>
          <h1 class="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-white"></div>
            Web Have Sounds
          </h1>
        </div>
        
        <div class="flex items-center gap-6 text-sm">
          <a href="#installation" class="hidden sm:block text-white/50 hover:text-white transition-colors">Install</a>
          <a href="#quickstart" class="hidden sm:block text-white/50 hover:text-white transition-colors">Usage</a>
          <a href="#customization" class="hidden sm:block text-white/50 hover:text-white transition-colors">API</a>
          <button @click="copyDocs" class="text-xs font-mono bg-white text-black px-3 py-1.5 rounded hover:bg-white/90 transition-colors">
            {{ copyStatus === 'Copy Markdown for Agent' ? 'Copy MD' : copyStatus }}
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-3xl mx-auto px-6 py-16 md:py-24">
      
      <!-- DX Sandbox Controls -->
      <div class="bg-[var(--bg-surface-1)] border border-white/10 rounded-lg p-6 mb-16 flex flex-col sm:flex-row gap-6 sm:items-center justify-between">
        <div>
          <h2 class="text-sm font-semibold text-white mb-1">Interactive Sandbox</h2>
          <p class="text-xs text-white/50">Change the global feel to preview how the library renders audio below.</p>
        </div>
        
        <div class="flex items-center gap-6">
          <div class="flex items-center gap-3">
            <label class="text-xs text-white/50 font-mono">Feel</label>
            <select v-model="selectedFeel" @change="playUISound('select')" class="bg-black border border-white/20 text-white text-xs px-2 py-1 rounded outline-none focus:border-white font-mono min-w-24">
              <option v-for="feel in Object.keys(FEEL_PRESETS)" :key="feel" :value="feel">{{ feel }}</option>
            </select>
          </div>
          
          <div class="flex items-center gap-3">
            <label class="text-xs text-white/50 font-mono">Vol</label>
            <input type="range" min="0" max="1" step="0.05" v-model.number="masterVolume" @input="setMasterVolume(masterVolume)" class="w-20 accent-white">
          </div>
        </div>
      </div>

      <div class="prose prose-invert prose-p:text-white/70 prose-headings:text-white prose-a:text-white prose-code:text-white/90 prose-pre:bg-[#111] prose-pre:border prose-pre:border-white/10 max-w-none">
        
        <section id="installation" class="mb-20">
          <h2 class="text-xl font-semibold mb-4 tracking-tight">1. Installation</h2>
          <p class="mb-4">The library is zero-dependency and uses the native Web Audio API to synthesize all sounds procedurally. There are no MP3/WAV files to load.</p>
          <pre class="bg-[#111] p-4 rounded border border-white/10 font-mono text-xs overflow-x-auto">npm install @thenormvg/web-have-sounds</pre>
        </section>

        <section id="quickstart" class="mb-20">
          <h2 class="text-xl font-semibold mb-4 tracking-tight">2. Quick Start</h2>
          <p class="mb-4">You can trigger sounds manually via code, or declaratively using HTML data attributes.</p>
          <pre class="bg-[#111] p-4 rounded border border-white/10 font-mono text-xs overflow-x-auto">
import { configureUISounds, playUISound } from '@thenormvg/web-have-sounds';

// Initialize the global engine
configureUISounds({
  feel: 'aero', // Try 'arcade', 'industrial', 'glass'...
  volume: 0.8,
});

// Trigger a sound
playUISound('click');
playUISound('error', 'industrial'); // Override the global feel for a specific event
          </pre>
        </section>

        <section id="feels" class="mb-20">
          <h2 class="text-xl font-semibold mb-4 tracking-tight">3. Feels Catalog</h2>
          <p class="mb-6">"Feels" are synthesizer presets that completely change the aesthetic of all sounds. They dictate the ADSR envelope multipliers, oscillator waveforms, and low-pass filter settings.</p>
          
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div v-for="(params, name) in FEEL_PRESETS" :key="name" class="bg-[var(--bg-surface-1)] p-3 rounded border border-white/10 hover:border-white/30 transition-colors">
              <div class="font-semibold text-sm mb-1 capitalize">{{ name }}</div>
              <div class="text-[10px] font-mono text-white/40">
                Osc: {{ params.oscType }}<br>
                Freq: {{ params.filterFreq }}Hz<br>
                Q: {{ params.q }}
              </div>
            </div>
          </div>
        </section>

        <section id="oneshots" class="mb-20">
          <h2 class="text-xl font-semibold mb-4 tracking-tight">4. One-Shot Sounds</h2>
          <p class="mb-6">Click any of the buttons below to preview the built-in one-shot sounds. The sounds will synthesize according to the "Global Feel" selected at the top of this page.</p>
          
          <div class="flex flex-wrap gap-2">
            <button 
              v-for="sound in sounds" 
              :key="sound"
              @click="playPreview(sound)"
              @mouseenter="playPreview('hover')"
              class="bg-[var(--bg-surface-1)] hover:bg-white/10 border border-white/10 rounded px-3 py-1.5 text-xs font-mono text-white/70 hover:text-white transition-colors"
            >
              {{ sound }}
            </button>
          </div>
        </section>

        <section id="loops" class="mb-20">
          <h2 class="text-xl font-semibold mb-4 tracking-tight">5. Ambient Loops</h2>
          <p class="mb-6">Ambient loops are long-running procedural soundscapes. They automatically fade in and out. You can run multiple loops simultaneously.</p>
          
          <div class="flex flex-wrap gap-3">
            <button 
              v-for="loop in loops" 
              :key="loop"
              @click="toggleDocsLoop(loop)"
              @mouseenter="playPreview('hover')"
              class="border rounded px-4 py-2 text-xs font-mono transition-colors flex items-center gap-2"
              :class="activeLoop === loop ? 'bg-white text-black border-white' : 'bg-[var(--bg-surface-1)] border-white/10 text-white/70 hover:text-white hover:border-white/30'"
            >
              <span class="w-1.5 h-1.5 rounded-full" :class="activeLoop === loop ? 'bg-red-500 animate-pulse' : 'bg-white/20'"></span>
              <span class="uppercase">{{ loop }}</span>
            </button>
          </div>
        </section>

        <section id="frameworks" class="mb-20">
          <h2 class="text-xl font-semibold mb-4 tracking-tight">6. Framework Integration</h2>
          <p class="mb-4">The easiest way to use the library is with declarative HTML attributes. Run <code class="bg-[var(--bg-surface-1)] px-1.5 py-0.5 rounded text-white border border-white/10">bindUISounds()</code> when your app mounts.</p>
          
          <pre class="bg-[#111] p-4 rounded border border-white/10 font-mono text-xs overflow-x-auto mb-6">
// HTML syntax
&lt;button data-uisound="click" data-uisound-hover="hover"&gt;
  Submit
&lt;/button&gt;
          </pre>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h3 class="text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">Vue / Nuxt</h3>
              <pre class="bg-[#111] p-4 rounded border border-white/10 font-mono text-[10px] overflow-x-auto h-full">
import { onMounted, onUnmounted } from 'vue';
import { bindUISounds } from '@thenormvg/web-have-sounds';

export default {
  setup() {
    onMounted(() => {
      const unbind = bindUISounds();
      onUnmounted(unbind);
    });
  }
}
              </pre>
            </div>
            
            <div>
              <h3 class="text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">React / Next.js</h3>
              <pre class="bg-[#111] p-4 rounded border border-white/10 font-mono text-[10px] overflow-x-auto h-full">
import { useEffect } from 'react';
import { bindUISounds } from '@thenormvg/web-have-sounds';

function App() {
  useEffect(() => {
    return bindUISounds();
  }, []);
  return &lt;div&gt;...&lt;/div&gt;;
}
              </pre>
            </div>
          </div>
        </section>

        <section id="customization" class="mb-20">
          <h2 class="text-xl font-semibold mb-4 tracking-tight">7. Custom API</h2>
          <p class="mb-6">For advanced users, you can write your own Web Audio API nodes and register them as sounds or feels into the catalog.</p>
          
          <pre class="bg-[#111] p-4 rounded border border-white/10 font-mono text-xs overflow-x-auto">
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
          </pre>
        </section>

      </div>
    </main>
  </div>
</template>

<style scoped>
html {
  scroll-behavior: smooth;
}
</style>
