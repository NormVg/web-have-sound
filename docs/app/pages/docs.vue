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
  <div class="min-h-screen bg-[var(--bg-root)] text-[var(--text-primary)] font-sans flex flex-col md:flex-row selection:bg-[var(--color-liquid-lava)] selection:text-white relative">
    
    <!-- Sidebar Navigation -->
    <aside class="w-full md:w-64 p-6 md:sticky md:top-0 md:h-screen overflow-y-auto glass-panel z-10 flex-shrink-0">
      <h1 class="text-xl font-bold mb-8 flex items-center gap-2 tracking-tight">
        <div class="w-3 h-3 rounded-full bg-[var(--color-liquid-lava)] shadow-[0_0_12px_rgba(245,110,15,0.6)]"></div>
        Web Have Sounds
      </h1>
      
      <nav class="flex flex-col gap-3 text-sm font-sans tracking-wide">
        <a href="#installation" class="text-[var(--text-secondary)] hover:text-[var(--color-liquid-lava)] hover:scale-[0.98] transition-transform origin-left block" data-uisound="hover">1. Installation</a>
        <a href="#quickstart" class="text-[var(--text-secondary)] hover:text-[var(--color-liquid-lava)] hover:scale-[0.98] transition-transform origin-left block" data-uisound="hover">2. Quick Start</a>
        <a href="#feels" class="text-[var(--text-secondary)] hover:text-[var(--color-liquid-lava)] hover:scale-[0.98] transition-transform origin-left block" data-uisound="hover">3. Feels Catalog</a>
        <a href="#oneshots" class="text-[var(--text-secondary)] hover:text-[var(--color-liquid-lava)] hover:scale-[0.98] transition-transform origin-left block" data-uisound="hover">4. One-Shot Sounds</a>
        <a href="#loops" class="text-[var(--text-secondary)] hover:text-[var(--color-liquid-lava)] hover:scale-[0.98] transition-transform origin-left block" data-uisound="hover">5. Ambient Loops</a>
        <a href="#frameworks" class="text-[var(--text-secondary)] hover:text-[var(--color-liquid-lava)] hover:scale-[0.98] transition-transform origin-left block" data-uisound="hover">6. Frameworks</a>
        <a href="#customization" class="text-[var(--text-secondary)] hover:text-[var(--color-liquid-lava)] hover:scale-[0.98] transition-transform origin-left block" data-uisound="hover">7. Custom API</a>
        
        <div class="mt-8 pt-8 border-t border-[var(--border-default)]">
          <button @click="copyDocs" class="w-full text-[10px] uppercase tracking-widest font-bold bg-[var(--bg-surface-2)] border-t border-[var(--border-hover)] hover:bg-[var(--bg-surface-3)] active:bg-[var(--color-liquid-lava)] text-white/90 py-3 px-4 rounded-md chunky-key transition-all text-center" data-uisound="hover">
            {{ copyStatus }}
          </button>
        </div>
        
        <div class="mt-6">
          <NuxtLink to="/" class="flex items-center gap-2 text-xs text-white/35 hover:text-[var(--color-liquid-lava)] transition-colors" data-uisound="hover">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back to Sequencer
          </NuxtLink>
        </div>
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 p-6 md:p-12 lg:p-24 max-w-4xl overflow-y-auto relative z-0">
      
      <!-- Interactive Sandbox Settings (Sticky Header) -->
      <div class="sticky top-4 z-20 glass-panel shadow-high rounded-xl px-6 py-4 mb-16 border-t border-[var(--border-strong)] flex flex-wrap gap-8 items-center justify-between">
        <div class="flex items-center gap-4">
          <label class="text-[11px] font-sans font-medium uppercase tracking-widest text-[var(--text-muted)]">Global Feel</label>
          <div class="flex gap-2">
            <select v-model="selectedFeel" @change="playUISound('select')" class="bg-[var(--bg-surface-2)] border-t border-b-0 border-x-0 border-[var(--border-hover)] text-white text-xs px-4 py-2 rounded-md outline-none focus:border-[var(--color-liquid-lava)] cursor-crosshair font-mono shadow-concave">
              <option v-for="feel in Object.keys(FEEL_PRESETS)" :key="feel" :value="feel">{{ feel }}</option>
            </select>
          </div>
        </div>
        
        <div class="flex items-center gap-4">
          <label class="text-[11px] font-sans font-medium uppercase tracking-widest text-[var(--text-muted)]">Global Vol</label>
          <input type="range" min="0" max="1" step="0.05" v-model.number="masterVolume" @input="setMasterVolume(masterVolume)" class="w-32 accent-[var(--color-liquid-lava)] cursor-crosshair">
        </div>
      </div>

      <div class="max-w-none">
        
        <section id="installation" class="mb-24">
          <h2 class="text-2xl font-bold mb-4 tracking-tight text-white text-balance">1. Installation</h2>
          <p class="text-[var(--text-secondary)] mb-6 leading-relaxed">The library is zero-dependency and uses the native Web Audio API to synthesize all sounds procedurally. There are no MP3/WAV files to load.</p>
          <pre class="bg-[var(--bg-surface-2)] p-6 rounded-lg border-t border-[var(--border-hover)] font-mono text-sm text-[var(--text-primary)] overflow-x-auto shadow-concave">npm install @thenormvg/web-have-sounds</pre>
        </section>

        <section id="quickstart" class="mb-24">
          <h2 class="text-2xl font-bold mb-4 tracking-tight text-white text-balance">2. Quick Start</h2>
          <p class="text-[var(--text-secondary)] mb-6 leading-relaxed">You can trigger sounds manually via code, or declaratively using HTML data attributes.</p>
          <pre class="bg-[var(--bg-surface-2)] p-6 rounded-lg border-t border-[var(--border-hover)] font-mono text-sm text-[var(--text-primary)] overflow-x-auto shadow-concave">
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

        <section id="feels" class="mb-24">
          <h2 class="text-2xl font-bold mb-4 tracking-tight text-white text-balance">3. Feels Catalog</h2>
          <p class="text-[var(--text-secondary)] mb-8 leading-relaxed">"Feels" are synthesizer presets that completely change the aesthetic of all sounds. They dictate the ADSR envelope multipliers, oscillator waveforms, and low-pass filter settings.</p>
          
          <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div v-for="(params, name) in FEEL_PRESETS" :key="name" class="bg-[var(--bg-surface-1)] p-5 rounded-xl border border-[var(--border-default)] hover:border-[var(--border-hover)] transition-colors shadow-high">
              <div class="font-bold mb-2 text-[var(--color-liquid-lava)] capitalize tracking-tight">{{ name }}</div>
              <div class="text-xs font-mono text-[var(--text-muted)] leading-relaxed">
                Osc: {{ params.oscType }}<br>
                Freq: {{ params.filterFreq }}Hz<br>
                Q: {{ params.q }}
              </div>
            </div>
          </div>
        </section>

        <section id="oneshots" class="mb-24">
          <h2 class="text-2xl font-bold mb-4 tracking-tight text-white text-balance">4. One-Shot Sounds</h2>
          <p class="text-[var(--text-secondary)] mb-8 leading-relaxed">Click any of the buttons below to preview the built-in one-shot sounds. The sounds will synthesize according to the "Global Feel" selected at the top of this page.</p>
          
          <div class="grid grid-cols-3 md:grid-cols-5 gap-4">
            <button 
              v-for="sound in sounds" 
              :key="sound"
              @click="playPreview(sound)"
              @mouseenter="playPreview('hover')"
              class="bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] active:bg-[var(--bg-surface-3)] border-t border-[var(--border-hover)] rounded-md px-3 py-3 text-xs font-mono text-center text-white/80 hover:text-white cursor-crosshair truncate chunky-key"
            >
              {{ sound }}
            </button>
          </div>
        </section>

        <section id="loops" class="mb-24">
          <h2 class="text-2xl font-bold mb-4 tracking-tight text-white text-balance">5. Ambient Loops</h2>
          <p class="text-[var(--text-secondary)] mb-8 leading-relaxed">Ambient loops are long-running procedural soundscapes. They automatically fade in and out. You can run multiple loops simultaneously.</p>
          
          <div class="flex flex-wrap gap-6">
            <button 
              v-for="loop in loops" 
              :key="loop"
              @click="toggleDocsLoop(loop)"
              @mouseenter="playPreview('hover')"
              class="rounded-lg px-8 py-5 text-xs font-mono text-center cursor-crosshair chunky-key"
              :class="activeLoop === loop ? 'bg-[var(--color-liquid-lava)] text-[var(--bg-root)] border-none' : 'bg-[var(--bg-surface-2)] border-t border-[var(--border-hover)] text-[var(--text-primary)] hover:text-white'"
            >
              <div class="font-bold mb-1 uppercase tracking-widest">{{ loop }}</div>
              <div class="text-[10px] opacity-70">{{ activeLoop === loop ? 'STOP' : 'START' }}</div>
            </button>
          </div>
        </section>

        <section id="frameworks" class="mb-24">
          <h2 class="text-2xl font-bold mb-4 tracking-tight text-white text-balance">6. Framework Integration</h2>
          <p class="text-[var(--text-secondary)] mb-6 leading-relaxed">The easiest way to use the library is with declarative HTML attributes. Run <code class="bg-[var(--bg-surface-2)] px-1.5 py-0.5 rounded text-[var(--text-primary)] border border-[var(--border-default)]">bindUISounds()</code> when your app mounts.</p>
          
          <pre class="bg-[var(--bg-surface-2)] p-6 rounded-lg border-t border-[var(--border-hover)] font-mono text-sm text-[var(--text-primary)] overflow-x-auto shadow-concave mb-8">
// HTML syntax
&lt;button data-uisound="click" data-uisound-hover="hover"&gt;
  Submit
&lt;/button&gt;
          </pre>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 class="text-xs font-bold text-[var(--color-liquid-lava)] mb-3 uppercase tracking-widest">Vue / Nuxt</h3>
              <pre class="bg-[var(--bg-surface-2)] p-5 rounded-lg border-t border-[var(--border-hover)] font-mono text-[11px] text-[var(--text-primary)] overflow-x-auto shadow-concave h-full">
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
              <h3 class="text-xs font-bold text-[var(--color-liquid-lava)] mb-3 uppercase tracking-widest">React / Next.js</h3>
              <pre class="bg-[var(--bg-surface-2)] p-5 rounded-lg border-t border-[var(--border-hover)] font-mono text-[11px] text-[var(--text-primary)] overflow-x-auto shadow-concave h-full">
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

        <section id="customization" class="mb-24">
          <h2 class="text-2xl font-bold mb-4 tracking-tight text-white text-balance">7. Custom API</h2>
          <p class="text-[var(--text-secondary)] mb-6 leading-relaxed">For advanced users, you can write your own Web Audio API nodes and register them as sounds or feels into the catalog.</p>
          
          <pre class="bg-[var(--bg-surface-2)] p-6 rounded-lg border-t border-[var(--border-hover)] font-mono text-sm text-[var(--text-primary)] overflow-x-auto shadow-concave">
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
/* Smooth scrolling for anchor links */
main {
  scroll-behavior: smooth;
}
</style>
