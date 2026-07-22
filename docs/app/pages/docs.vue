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
  <div class="min-h-screen bg-[var(--color-dark-void)] text-[var(--color-snow)] font-sans flex flex-col md:flex-row selection:bg-[var(--color-liquid-lava)] selection:text-white">
    
    <!-- Sidebar Navigation -->
    <aside class="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/10 p-6 md:sticky md:top-0 md:h-screen overflow-y-auto bg-black/20">
      <h1 class="text-xl font-bold mb-8 flex items-center gap-2">
        <div class="w-3 h-3 rounded-full bg-[var(--color-liquid-lava)]"></div>
        Web Have Sounds
      </h1>
      
      <nav class="flex flex-col gap-4 text-sm font-mono">
        <a href="#installation" class="text-white/60 hover:text-[var(--color-liquid-lava)] transition-colors" data-uisound="hover">1. Installation</a>
        <a href="#quickstart" class="text-white/60 hover:text-[var(--color-liquid-lava)] transition-colors" data-uisound="hover">2. Quick Start</a>
        <a href="#feels" class="text-white/60 hover:text-[var(--color-liquid-lava)] transition-colors" data-uisound="hover">3. Feels Catalog</a>
        <a href="#oneshots" class="text-white/60 hover:text-[var(--color-liquid-lava)] transition-colors" data-uisound="hover">4. One-Shot Sounds</a>
        <a href="#loops" class="text-white/60 hover:text-[var(--color-liquid-lava)] transition-colors" data-uisound="hover">5. Ambient Loops</a>
        <a href="#frameworks" class="text-white/60 hover:text-[var(--color-liquid-lava)] transition-colors" data-uisound="hover">6. Frameworks</a>
        <a href="#customization" class="text-white/60 hover:text-[var(--color-liquid-lava)] transition-colors" data-uisound="hover">7. Custom API</a>
        
        <div class="mt-8 pt-8 border-t border-white/10">
          <button @click="copyDocs" class="w-full text-[10px] uppercase tracking-widest font-bold bg-white/10 hover:bg-white/20 active:bg-[var(--color-liquid-lava)] text-white py-3 px-4 rounded transition-colors text-center" data-uisound="hover">
            {{ copyStatus }}
          </button>
        </div>
        
        <div class="mt-4">
          <NuxtLink to="/" class="flex items-center gap-2 text-xs text-white/40 hover:text-white transition-colors" data-uisound="hover">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back to Sequencer
          </NuxtLink>
        </div>
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 p-6 md:p-12 lg:p-24 max-w-5xl overflow-y-auto">
      
      <!-- Interactive Sandbox Settings (Sticky Header) -->
      <div class="sticky top-0 z-20 bg-black/80 backdrop-blur-md p-4 mb-12 rounded-xl border border-white/10 shadow-2xl flex flex-wrap gap-6 items-center justify-between">
        <div class="flex items-center gap-4">
          <label class="text-[10px] font-mono uppercase tracking-widest text-white/50">Global Feel</label>
          <div class="flex gap-2">
            <select v-model="selectedFeel" @change="playUISound('select')" class="bg-[#181818] border border-white/20 text-white text-xs px-3 py-1.5 rounded outline-none focus:border-[var(--color-liquid-lava)] cursor-crosshair font-mono">
              <option v-for="feel in Object.keys(FEEL_PRESETS)" :key="feel" :value="feel">{{ feel }}</option>
            </select>
          </div>
        </div>
        
        <div class="flex items-center gap-4">
          <label class="text-[10px] font-mono uppercase tracking-widest text-white/50">Global Vol</label>
          <input type="range" min="0" max="1" step="0.05" v-model.number="masterVolume" @input="setMasterVolume(masterVolume)" class="w-24 accent-[var(--color-liquid-lava)] cursor-crosshair">
        </div>
      </div>

      <div class="prose prose-invert prose-orange max-w-none">
        
        <section id="installation" class="mb-16">
          <h2 class="text-3xl font-bold mb-6 tracking-tight">1. Installation</h2>
          <p class="text-white/70 mb-4">The library is zero-dependency and uses the native Web Audio API to synthesize all sounds procedurally. There are no MP3/WAV files to load.</p>
          <div class="bg-[#111] p-4 rounded-lg border border-white/10 font-mono text-sm text-white/80 overflow-x-auto">
            npm install @thenormvg/web-have-sounds
          </div>
        </section>

        <section id="quickstart" class="mb-16">
          <h2 class="text-3xl font-bold mb-6 tracking-tight">2. Quick Start</h2>
          <p class="text-white/70 mb-4">You can trigger sounds manually via code, or declaratively using HTML data attributes.</p>
          <div class="bg-[#111] p-6 rounded-lg border border-white/10 font-mono text-xs text-white/80 overflow-x-auto whitespace-pre">
import { configureUISounds, playUISound } from '@thenormvg/web-have-sounds';

// Initialize the global engine
configureUISounds({
  feel: 'aero', // Try 'arcade', 'industrial', 'glass'...
  volume: 0.8,
});

// Trigger a sound
playUISound('click');
playUISound('error', 'industrial'); // Override the global feel for a specific event
          </div>
        </section>

        <section id="feels" class="mb-16">
          <h2 class="text-3xl font-bold mb-6 tracking-tight">3. Feels Catalog</h2>
          <p class="text-white/70 mb-6">"Feels" are synthesizer presets that completely change the aesthetic of all sounds. They dictate the ADSR envelope multipliers, oscillator waveforms, and low-pass filter settings.</p>
          
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div v-for="(params, name) in FEEL_PRESETS" :key="name" class="bg-black/40 p-4 rounded-lg border border-white/5 hover:border-white/20 transition-colors">
              <div class="font-bold mb-1 text-[var(--color-liquid-lava)] capitalize">{{ name }}</div>
              <div class="text-[10px] font-mono text-white/40">
                Osc: {{ params.oscType }}<br>
                Freq: {{ params.filterFreq }}Hz<br>
                Q: {{ params.q }}
              </div>
            </div>
          </div>
        </section>

        <section id="oneshots" class="mb-16">
          <h2 class="text-3xl font-bold mb-6 tracking-tight">4. One-Shot Sounds</h2>
          <p class="text-white/70 mb-6">Click any of the buttons below to preview the built-in one-shot sounds. The sounds will synthesize according to the "Global Feel" selected at the top of this page.</p>
          
          <div class="grid grid-cols-3 md:grid-cols-5 gap-3">
            <button 
              v-for="sound in sounds" 
              :key="sound"
              @click="playPreview(sound)"
              @mouseenter="playPreview('hover')"
              class="bg-white/5 hover:bg-white/10 active:bg-white/20 border border-white/10 rounded px-3 py-3 text-xs font-mono text-center transition-colors cursor-crosshair truncate"
            >
              {{ sound }}
            </button>
          </div>
        </section>

        <section id="loops" class="mb-16">
          <h2 class="text-3xl font-bold mb-6 tracking-tight">5. Ambient Loops</h2>
          <p class="text-white/70 mb-6">Ambient loops are long-running procedural soundscapes. They automatically fade in and out. You can run multiple loops simultaneously.</p>
          
          <div class="flex flex-wrap gap-4">
            <button 
              v-for="loop in loops" 
              :key="loop"
              @click="toggleDocsLoop(loop)"
              @mouseenter="playPreview('hover')"
              class="border rounded px-6 py-4 text-xs font-mono text-center transition-colors cursor-crosshair"
              :class="activeLoop === loop ? 'bg-[var(--color-liquid-lava)] text-black border-[var(--color-liquid-lava)] shadow-[0_0_20px_rgba(245,110,15,0.3)]' : 'bg-black border-white/20 text-white/80 hover:border-white/50'"
            >
              <div class="font-bold mb-1 uppercase tracking-widest">{{ loop }}</div>
              <div class="text-[9px] opacity-70">{{ activeLoop === loop ? 'STOP' : 'START' }}</div>
            </button>
          </div>
        </section>

        <section id="frameworks" class="mb-16">
          <h2 class="text-3xl font-bold mb-6 tracking-tight">6. Framework Integration</h2>
          <p class="text-white/70 mb-4">The easiest way to use the library is with declarative HTML attributes. Run <code>bindUISounds()</code> when your app mounts.</p>
          
          <div class="bg-[#111] p-6 rounded-lg border border-white/10 font-mono text-xs text-white/80 overflow-x-auto whitespace-pre mb-4">
// HTML syntax
&lt;button data-uisound="click" data-uisound-hover="hover"&gt;
  Submit
&lt;/button&gt;
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 class="text-sm font-bold text-[var(--color-liquid-lava)] mb-2 uppercase tracking-widest">Vue / Nuxt</h3>
              <div class="bg-[#111] p-4 rounded-lg border border-white/10 font-mono text-[10px] text-white/80 overflow-x-auto whitespace-pre">
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
              </div>
            </div>
            
            <div>
              <h3 class="text-sm font-bold text-[var(--color-liquid-lava)] mb-2 uppercase tracking-widest">React / Next.js</h3>
              <div class="bg-[#111] p-4 rounded-lg border border-white/10 font-mono text-[10px] text-white/80 overflow-x-auto whitespace-pre">
import { useEffect } from 'react';
import { bindUISounds } from '@thenormvg/web-have-sounds';

function App() {
  useEffect(() => {
    return bindUISounds();
  }, []);
  return &lt;div&gt;...&lt;/div&gt;;
}
              </div>
            </div>
          </div>
        </section>

        <section id="customization" class="mb-16">
          <h2 class="text-3xl font-bold mb-6 tracking-tight">7. Custom API</h2>
          <p class="text-white/70 mb-6">For advanced users, you can write your own Web Audio API nodes and register them as sounds or feels into the catalog.</p>
          
          <div class="bg-[#111] p-6 rounded-lg border border-white/10 font-mono text-xs text-white/80 overflow-x-auto whitespace-pre">
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
          </div>
        </section>

      </div>
    </main>
  </div>
</template>

<style scoped>
/* Smooth scrolling for anchor links */
main {
  scroll-behavior: smooth;
}
</style>
