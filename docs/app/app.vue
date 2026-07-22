<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import {
  configureUISounds,
  playUISound,
  startLoop,
  stopLoop,
  warmUpAudio,
  setMasterVolume,
  bindUISounds
} from '@thenormvg/web-have-sounds'

const activeUsageTab = ref('Vanilla')

// Define the available sounds
const sounds = [
  { id: 'click', label: 'CLICK' },
  { id: 'pop', label: 'POP' },
  { id: 'hover', label: 'HOVER' },
  { id: 'tick', label: 'TICK' },
  { id: 'success', label: 'SUCC' },
  { id: 'error', label: 'ERR' },
  { id: 'drop', label: 'DROP' },
  { id: 'keystroke', label: 'KEY' },
]

const loops = [
  { id: 'loading', label: 'LOAD', active: ref(false) },
  { id: 'pulse', label: 'PULSE', active: ref(false) },
  { id: 'hum', label: 'HUM', active: ref(false) },
]

// Feel Presets
const availableFeels = ['aero', 'arcade', 'industrial', 'glass', 'organic', 'retro', 'soft', 'crisp', 'minimal']
const currentFeel = ref(availableFeels[0])

// Volume State
const volume = ref(0.8)

// Visualizer State (16 columns, value 0-30)
const TOTAL_ROWS = 30
const activeBands = ref<number[]>(Array(16).fill(0))
let decayInterval: any = null
let unbindDomSounds: any = null

onMounted(() => {
  configureUISounds({
    feel: currentFeel.value as any,
    volume: volume.value,
  })
  
  // Bind declarative data-uisound attributes
  unbindDomSounds = bindUISounds()
  
  document.addEventListener('pointerdown', warmUpAudio, { once: true })
  
  // Decay visualizer bars naturally
  decayInterval = setInterval(() => {
    // If any loop is active, keep some bars bouncing
    const isLooping = loops.some(l => l.active.value)
    
    activeBands.value = activeBands.value.map(val => {
      if (isLooping && Math.random() > 0.8) {
        return Math.floor(Math.random() * 12) + 4
      }
      return Math.max(0, val - 1)
    })
  }, 40) // slightly faster decay for taller bars
})

onUnmounted(() => {
  loops.forEach(l => {
    if (l.active.value) {
      stopLoop(l.id as any)
    }
  })
  if (decayInterval) clearInterval(decayInterval)
  if (unbindDomSounds) unbindDomSounds()
})

const triggerVisualizer = () => {
  // Spike random bands when a sound is played
  activeBands.value = activeBands.value.map(val => {
    if (Math.random() > 0.3) {
      return Math.floor(Math.random() * 20) + 10 // Spike between 10 and 30
    }
    return val
  })
}

const handlePlay = (id: string) => {
  playUISound(id as any)
  triggerVisualizer()
}

const toggleLoop = (loop: any) => {
  loop.active.value = !loop.active.value
  if (loop.active.value) {
    startLoop(loop.id as any)
    triggerVisualizer()
  } else {
    stopLoop(loop.id as any)
  }
}

const cycleFeel = () => {
  const currentIndex = availableFeels.indexOf(currentFeel.value)
  currentFeel.value = availableFeels[(currentIndex + 1) % availableFeels.length]
  
  configureUISounds({ feel: currentFeel.value as any })
  playUISound('tick')
  triggerVisualizer()
}

// Retro Slider Audio Physics
const onSliderDown = () => {
  playUISound('keystroke') // heavy click when grabbing the fader
  triggerVisualizer()
}

const onSliderMove = () => {
  setMasterVolume(volume.value)
  playUISound('tick') // fast clicks like gears when moving
  triggerVisualizer()
}

const onSliderUp = () => {
  playUISound('pop') // satisfying release sound
  triggerVisualizer()
}

const copyInstall = async () => {
  try {
    await navigator.clipboard.writeText('npm i @thenormvg/web-have-sounds')
    playUISound('success')
    triggerVisualizer()
  } catch (e) {
    playUISound('error')
    triggerVisualizer()
  }
}

const copyCode = async () => {
  let code = ''
  if (activeUsageTab.value === 'Vanilla') {
    code = `import { playUISound } from '@thenormvg/web-have-sounds'\n\nbtn.addEventListener('click', () => {\n  playUISound('pop')\n})`
  } else if (activeUsageTab.value === 'React') {
    code = `import { playUISound } from '@thenormvg/web-have-sounds'\n\nexport function Button() {\n  return (\n    <button onClick={() => playUISound('pop')}>\n      Save\n    </button>\n  )\n}`
  } else {
    code = `<script setup>\nimport { playUISound } from '@thenormvg/web-have-sounds'\n<\/script>\n\n<template>\n  <button @click="playUISound('pop')">\n    Save\n  </button>\n</template>`
  }
  
  try {
    await navigator.clipboard.writeText(code)
    playUISound('success')
    triggerVisualizer()
  } catch (e) {
    playUISound('error')
    triggerVisualizer()
  }
}
</script>

<template>
  <!-- Neutral physical desk background outside the narrow column -->
  <div class="min-h-[100dvh] bg-[#d4d4d4] font-mono">
    
    <!-- THE NARROW CENTERED COLUMN (Infinite Hardware Strip) -->
    <!-- Added thick side borders and heavy drop shadow to make it feel like a physical unit -->
    <div class="w-full max-w-[500px] mx-auto min-h-[100dvh] flex flex-col shadow-[0_0_60px_rgba(0,0,0,0.25)] border-l-[6px] border-r-[6px] border-[#1a1a1a] relative">
      
      <!-- Inner chamfer highlights (left and right) for 3D bevel effect -->
      <div class="absolute inset-y-0 left-0 w-[1px] bg-white/10 z-10 pointer-events-none"></div>
      <div class="absolute inset-y-0 right-0 w-[1px] bg-white/5 z-10 pointer-events-none"></div>
      
      <!-- TOP HALF: DARK INTERFACE -->
      <main class="w-full bg-[var(--color-dark-void)] text-[var(--color-snow)] flex-none relative">
        <div class="p-6 pt-12 md:pt-20">
          
          <!-- Header -->
          <header class="flex justify-between items-center mb-10">
            <div class="text-[var(--color-liquid-lava)] font-sans text-2xl font-medium tracking-tight">
              WHS <span class="text-[var(--color-snow)]">1.6.2</span>
            </div>
            
            <div class="flex items-center gap-4">
              <!-- Icons -->
              <div class="flex items-center gap-3 text-[var(--color-dusty-grey)]">
                <a href="https://github.com/thenormvg/web-have-sound" target="_blank" class="hover:text-[var(--color-snow)] transition-colors active:scale-95" @pointerdown="playUISound('click')" title="GitHub">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                </a>
                <a href="https://www.npmjs.com/package/@thenormvg/web-have-sounds" target="_blank" class="hover:text-[var(--color-snow)] transition-colors active:scale-95" @pointerdown="playUISound('click')" title="NPM">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                </a>
              </div>
              
              <!-- Text -->
              <div class="text-[9px] tracking-widest text-right uppercase text-[var(--color-dusty-grey)] border-l border-[#333] pl-4">
                Procedural<br>Audio Engine
              </div>
            </div>
          </header>

          <!-- Intro & Install -->
          <div class="mb-10 text-[13px] font-sans text-[var(--color-dusty-grey)] leading-relaxed space-y-5">
            <p>
              A zero-dependency, procedural audio engine for the web. Synthesize tactile UI sounds and ambient loops in real-time using the Web Audio API.
            </p>
            <div class="w-full bg-[#181818] border border-[#2a2a2a] hover:border-[#333] transition-colors p-3 rounded flex justify-between items-center text-[var(--color-snow)] font-mono text-xs group">
              <code class="text-left select-text">npm i @thenormvg/web-have-sounds</code>
              <button 
                @pointerdown="copyInstall" 
                class="text-[var(--color-dusty-grey)] hover:text-white transition-all cursor-pointer active:scale-[0.85] active:brightness-90 select-none p-1 -m-1"
                title="Copy to clipboard"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              </button>
            </div>
          </div>

          <!-- Hardware Audio Visualizer (Horizontal Stacks) -->
          <div class="h-36 w-full flex items-end gap-[4px] mb-8 border-b border-[var(--color-slate-grey)] pb-3">
            <div 
              v-for="(col, i) in 16" 
              :key="'col'+i"
              class="flex-1 h-full flex flex-col justify-end gap-[2px]"
            >
              <div 
                v-for="(row, j) in TOTAL_ROWS" 
                :key="'row'+j"
                :class="[
                  'flex-1 min-h-[2px] w-full transition-colors duration-75', 
                  (TOTAL_ROWS - j) <= activeBands[i] ? 'bg-[var(--color-liquid-lava)]' : 'bg-[#2a2a2a]'
                ]"
              ></div>
            </div>
          </div>

          <!-- Controls row -->
          <div class="flex justify-between items-center gap-4 mb-8">
            <!-- Volume Slider -->
            <div class="flex-1 relative flex items-center bg-[#181818] border border-[#2a2a2a] rounded h-[38px] group overflow-hidden">
              
              <!-- Visual Fill Bar -->
              <div 
                class="absolute left-0 top-0 bottom-0 bg-[#333] transition-transform duration-75 origin-left" 
                :style="{ width: '100%', transform: `scaleX(${volume})` }"
              ></div>
              
              <!-- LCD Text (Pointer Events None to let slider catch clicks) -->
              <div class="relative w-full flex justify-between items-center px-3 pointer-events-none text-[10px] uppercase tracking-widest text-[var(--color-dusty-grey)] group-hover:text-white transition-colors">
                <span>VOL</span>
                <span class="text-[var(--color-snow)]">{{ Math.round(volume * 100) }}%</span>
              </div>
              
              <!-- Invisible Range Input overlay -->
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05" 
                v-model.number="volume" 
                @pointerdown="onSliderDown"
                @input="onSliderMove"
                @pointerup="onSliderUp"
                @pointercancel="onSliderUp"
                class="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize m-0"
              />
            </div>

            <!-- Feel Cycle Button -->
            <button 
              @pointerdown="cycleFeel" 
              class="flex-1 flex justify-between items-center bg-[#181818] border border-[#2a2a2a] hover:border-white/30 rounded px-3 h-[38px] text-[10px] uppercase tracking-widest text-[var(--color-dusty-grey)] hover:text-white transition-all cursor-pointer select-none active:scale-[0.98] active:brightness-90"
            >
              <span>FEEL</span>
              <span class="text-[var(--color-liquid-lava)]">{{ currentFeel }}</span>
            </button>
          </div>

          <!-- SOUNDBOARD GRID -->
          <div class="grid grid-cols-4 gap-3 mb-6">
            <button
              v-for="sound in sounds"
              :key="sound.id"
              @pointerdown="handlePlay(sound.id)"
              class="chunky-key aspect-square bg-[var(--color-slate-grey)] rounded-lg flex items-center justify-center cursor-pointer select-none"
            >
              <span class="text-[10px] uppercase tracking-wider font-bold">{{ sound.label }}</span>
            </button>
          </div>

          <!-- LOOPS GRID -->
          <div class="grid grid-cols-3 gap-3 pb-12">
            <button
              v-for="loop in loops"
              :key="loop.id"
              @pointerdown="toggleLoop(loop)"
              :class="[
                'chunky-key h-14 rounded-lg flex items-center justify-center cursor-pointer select-none',
                loop.active.value ? 'bg-[var(--color-liquid-lava)] text-black active-loop' : 'bg-[var(--color-slate-grey)]'
              ]"
            >
              <span class="text-[10px] uppercase tracking-wider font-bold">{{ loop.label }}</span>
            </button>
          </div>
        </div>
      </main>

      <!-- BOTTOM HALF: STARK WHITE DOCS -->
      <div class="flex-1 w-full bg-[var(--color-snow)] text-[var(--color-dark-void)] border-t border-black overflow-hidden relative">
        <div class="p-6 pt-8 pb-20 relative">
          
          <!-- Hardware Speaker Grill -->
          <div class="w-full h-6 rounded-full bg-black/5 border border-black/10 shadow-[inset_0_2px_5px_rgba(0,0,0,0.1)] mb-10 overflow-hidden flex items-center justify-center">
            <div class="w-full h-full opacity-40" style="background-image: radial-gradient(circle, #000 1px, transparent 1px); background-size: 3px 3px; background-position: center;"></div>
          </div>
          
          <div class="flex items-center gap-3 mb-4 border-b border-black/20 pb-3">
            <h2 class="text-[11px] font-bold uppercase tracking-widest m-0">Architecture</h2>
          </div>

          <div class="grid grid-cols-2 gap-px bg-black/20 border border-black/20 mb-12">
            <!-- Cell 1: Procedural -->
            <div 
              class="bg-[var(--color-snow)] hover:bg-[#f5f5f5] transition-colors p-4 flex flex-col justify-between cursor-crosshair group"
              data-uisound="hover"
            >
              <div class="text-[var(--color-liquid-lava)] font-mono text-sm mb-6 flex gap-1 items-end h-4">
                <div class="w-1.5 h-2 bg-current transition-all duration-150 group-hover:h-4 group-active:h-3"></div>
                <div class="w-1.5 h-4 bg-current transition-all duration-150 delay-75 group-hover:h-2 group-active:h-1"></div>
                <div class="w-1.5 h-3 bg-current transition-all duration-150 delay-150 group-hover:h-1 group-active:h-2"></div>
                <div class="w-1.5 h-1 bg-current transition-all duration-150 delay-75 group-hover:h-3 group-active:h-4"></div>
              </div>
              <div>
                <h3 class="text-[10px] font-bold uppercase tracking-widest mb-1.5">Procedural</h3>
                <p class="text-[11px] text-black/60 leading-relaxed font-sans">Pure algorithmic synthesis. Zero MP3s or network requests. Generates waveforms natively in the browser.</p>
              </div>
            </div>
            
            <!-- Cell 2: Materials -->
            <div 
              class="bg-[var(--color-snow)] hover:bg-[#f5f5f5] transition-colors p-4 flex flex-col justify-between cursor-crosshair group"
              data-uisound="hover"
            >
              <div class="text-[var(--color-liquid-lava)] font-mono text-sm mb-6 flex gap-1.5 h-4 items-center">
                <div class="w-2 h-2 rounded-full bg-current transition-all duration-150 group-hover:opacity-30 group-hover:scale-75"></div>
                <div class="w-2 h-2 rounded-full bg-current transition-all duration-150 group-hover:scale-110"></div>
                <div class="w-2 h-2 rounded-full bg-current opacity-30 transition-all duration-150 group-hover:opacity-100 group-hover:scale-110"></div>
              </div>
              <div>
                <h3 class="text-[10px] font-bold uppercase tracking-widest mb-1.5">Materials</h3>
                <p class="text-[11px] text-black/60 leading-relaxed font-sans">9 physical presets including Glass, Arcade, and Industrial. Hot-swap the 'feel' of your entire interface.</p>
              </div>
            </div>

            <!-- Cell 3: Delegation -->
            <div 
              class="bg-[var(--color-snow)] hover:bg-[#f5f5f5] transition-colors p-4 flex flex-col justify-between cursor-crosshair group"
              data-uisound="hover"
            >
              <div class="text-[var(--color-liquid-lava)] font-mono text-[10px] mb-6 h-4 flex items-center">
                <span class="border border-[var(--color-liquid-lava)] px-1 leading-none py-0.5 transition-colors duration-150 group-hover:bg-[var(--color-liquid-lava)] group-hover:text-white">DOM</span>
              </div>
              <div>
                <h3 class="text-[10px] font-bold uppercase tracking-widest mb-1.5">Delegation</h3>
                <p class="text-[11px] text-black/60 leading-relaxed font-sans">Single-listener architecture. One call wires up the entire DOM. Highly optimized for massive applications.</p>
              </div>
            </div>

            <!-- Cell 4: Kinetic -->
            <div 
              class="bg-[var(--color-snow)] hover:bg-[#f5f5f5] transition-colors p-4 flex flex-col justify-between cursor-crosshair group"
              data-uisound="hover"
            >
              <div class="text-[var(--color-liquid-lava)] font-mono text-sm mb-6 flex gap-1.5 h-4 items-center">
                <div class="w-3 h-0.5 bg-current relative"><div class="absolute w-1 h-2 bg-current top-1/2 -translate-y-1/2 left-0 transition-all duration-150 group-hover:left-2 group-active:left-1"></div></div>
                <div class="w-3 h-0.5 bg-current relative"><div class="absolute w-1 h-2 bg-current top-1/2 -translate-y-1/2 right-0 transition-all duration-150 group-hover:right-2 group-active:right-1"></div></div>
              </div>
              <div>
                <h3 class="text-[10px] font-bold uppercase tracking-widest mb-1.5">Kinetic</h3>
                <p class="text-[11px] text-black/60 leading-relaxed font-sans">Full ADSR envelope control, 3D panning, and volume management via HTML attributes or JS.</p>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between mb-4 border-b border-black/20 pb-3">
            <h2 class="text-[11px] font-bold uppercase tracking-widest m-0">Usage</h2>
            <div class="flex gap-4">
              <button @click="activeUsageTab = 'Vanilla'" :class="{'text-[var(--color-liquid-lava)] border-[var(--color-liquid-lava)]': activeUsageTab === 'Vanilla', 'text-black/40 border-transparent hover:text-black': activeUsageTab !== 'Vanilla'}" class="text-[9px] uppercase tracking-widest font-bold border-b-2 pb-1 transition-colors cursor-crosshair" data-uisound="tick">Vanilla</button>
              <button @click="activeUsageTab = 'React'" :class="{'text-[var(--color-liquid-lava)] border-[var(--color-liquid-lava)]': activeUsageTab === 'React', 'text-black/40 border-transparent hover:text-black': activeUsageTab !== 'React'}" class="text-[9px] uppercase tracking-widest font-bold border-b-2 pb-1 transition-colors cursor-crosshair" data-uisound="tick">React</button>
              <button @click="activeUsageTab = 'Vue'" :class="{'text-[var(--color-liquid-lava)] border-[var(--color-liquid-lava)]': activeUsageTab === 'Vue', 'text-black/40 border-transparent hover:text-black': activeUsageTab !== 'Vue'}" class="text-[9px] uppercase tracking-widest font-bold border-b-2 pb-1 transition-colors cursor-crosshair" data-uisound="tick">Vue</button>
            </div>
          </div>
          <div class="bg-[var(--color-te-silver)] p-5 rounded border border-black/10 min-h-[140px] flex items-center relative group">
            <!-- Copy button -->
            <button 
              @click="copyCode" 
              class="absolute top-3 right-3 text-black/30 hover:text-black transition-colors opacity-0 group-hover:opacity-100 cursor-pointer p-2 active:scale-90"
              title="Copy code"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
            
            <pre v-if="activeUsageTab === 'Vanilla'" class="text-[11px] leading-relaxed m-0 text-black/80 font-mono"><code class="block"><span class="font-bold">import</span> { playUISound } <span class="font-bold">from</span> <span class="text-[var(--color-liquid-lava)]">'@thenormvg/web-have-sounds'</span>

btn.addEventListener(<span class="text-[var(--color-liquid-lava)]">'click'</span>, () => {
  playUISound(<span class="text-[var(--color-liquid-lava)]">'pop'</span>)
})</code></pre>
            <pre v-if="activeUsageTab === 'React'" class="text-[11px] leading-relaxed m-0 text-black/80 font-mono"><code class="block"><span class="font-bold">import</span> { playUISound } <span class="font-bold">from</span> <span class="text-[var(--color-liquid-lava)]">'@thenormvg/web-have-sounds'</span>

<span class="font-bold">export function</span> Button() {
  <span class="font-bold">return</span> (
    &lt;<span class="font-bold">button</span> onClick={() => playUISound(<span class="text-[var(--color-liquid-lava)]">'pop'</span>)}&gt;
      Save
    &lt;/<span class="font-bold">button</span>&gt;
  )
}</code></pre>
            <pre v-if="activeUsageTab === 'Vue'" class="text-[11px] leading-relaxed m-0 text-black/80 font-mono"><code class="block">&lt;<span class="font-bold">script</span> setup&gt;
<span class="font-bold">import</span> { playUISound } <span class="font-bold">from</span> <span class="text-[var(--color-liquid-lava)]">'@thenormvg/web-have-sounds'</span>
&lt;/<span class="font-bold">script</span>&gt;

&lt;<span class="font-bold">template</span>&gt;
  &lt;<span class="font-bold">button</span> @click="playUISound(<span class="text-[var(--color-liquid-lava)]">'pop'</span>)"&gt;
    Save
  &lt;/<span class="font-bold">button</span>&gt;
&lt;/<span class="font-bold">template</span>&gt;</code></pre>
          </div>

          <!-- DOM BINDINGS -->
          <div class="flex items-center gap-3 mb-2 mt-12 border-b border-black/20 pb-3">
            <h2 class="text-[11px] font-bold uppercase tracking-widest m-0">DOM Bindings</h2>
          </div>
          
          <div class="flex flex-col text-sm font-sans divide-y divide-black/10">
            <!-- Pattern 1: Hover -->
            <div class="flex justify-between items-center py-5">
              <div>
                <code class="text-[11px] font-mono font-bold tracking-tight">data-uisound="hover"</code>
                <div class="text-[10px] text-black/50 mt-1 uppercase tracking-widest">fine-pointer hover</div>
              </div>
              <div class="flex gap-3 text-[10px] font-bold tracking-widest uppercase text-[var(--color-liquid-lava)]">
                <a href="#" class="border border-current px-2.5 py-1 hover:bg-[var(--color-liquid-lava)] hover:text-white transition-colors cursor-crosshair" data-uisound="hover" @click.prevent>ATTACK</a>
                <a href="#" class="border border-current px-2.5 py-1 hover:bg-[var(--color-liquid-lava)] hover:text-white transition-colors cursor-crosshair" data-uisound="hover" @click.prevent>DECAY</a>
                <a href="#" class="border border-current px-2.5 py-1 hover:bg-[var(--color-liquid-lava)] hover:text-white transition-colors cursor-crosshair" data-uisound="hover" @click.prevent>SUSTAIN</a>
              </div>
            </div>

            <!-- Pattern 2: Press -->
            <div class="flex items-center py-5 relative">
              <div class="flex-1">
                <code class="text-[11px] font-mono font-bold tracking-tight">data-uisound="pop"</code>
                <div class="text-[10px] text-black/50 mt-1 uppercase tracking-widest">click or press</div>
              </div>
              <button class="w-8 h-8 rounded-full bg-[var(--color-liquid-lava)] border border-[#c34300] shadow-[inset_0_2px_2px_rgba(255,255,255,0.4),inset_0_-2px_4px_rgba(0,0,0,0.2),0_2px_4px_rgba(0,0,0,0.3)] hover:brightness-110 active:shadow-[inset_0_3px_6px_rgba(0,0,0,0.5),0_1px_1px_rgba(0,0,0,0.1)] active:translate-y-[1px] transition-all cursor-crosshair" aria-label="Trigger" data-uisound="pop"></button>
            </div>

            <!-- Pattern 3: Toggle -->
            <div class="flex items-center py-5 relative">
              <div class="flex-1">
                <code class="text-[11px] font-mono font-bold tracking-tight">data-uisound="tick"</code>
                <div class="text-[10px] text-black/50 mt-1 uppercase tracking-widest">toggle switch state</div>
              </div>
              <label class="relative inline-flex items-center cursor-crosshair group">
                <input type="checkbox" value="" class="sr-only peer" data-uisound="tick">
                <!-- Track is exactly 36x20px. 4px padding on all sides. -->
                <div class="w-9 h-5 bg-black/20 group-hover:bg-black/30 peer-checked:bg-black transition-colors rounded-full peer peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-transform"></div>
              </label>
            </div>
          </div>
          
          <div class="mt-12 pt-6 border-t border-black/10 flex justify-between items-end">
            <div class="text-[10px] uppercase tracking-widest opacity-50">
              Web Audio API<br>Engine v1.6.2
            </div>
            <!-- Hardware mic decoration -->
            <div class="w-20 h-5 flex gap-[3px]">
              <div v-for="i in 10" :key="i" class="flex-1 bg-black/20 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  </div>
</template>

<style>
/* Nuxt specific resets */
html, body {
  margin: 0;
  padding: 0;
  background-color: #d4d4d4;
}
</style>
