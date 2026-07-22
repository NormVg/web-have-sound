<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
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
  { id: 'thud', label: 'THUD' },
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

// --- TOY SEQUENCER STATE ---
const defaultGrid = [
  [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
  [false, true, true, false, true, false, false, true, false, true, false, false, true, false, true, false],
  [true, false, false, true, false, true, false, true, false, true, false, true, false, true, false, false],
  [false, true, false, true, true, false, true, false, true, true, true, true, true, false, true, false],
  [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false]
]
const defaultTracks = ['thud', 'drop', 'pop', 'tick', 'click']
const defaultFeels = ['industrial', 'arcade', 'minimal', 'aero', 'soft']

interface SequencerLayer {
  id: number
  sound: string
  feel: string
  steps: boolean[]
}

let nextLayerId = 5

const createDefaultLayers = (): SequencerLayer[] => {
  return defaultTracks.map((sound, i) => ({
    id: i + 1,
    sound,
    feel: defaultFeels[i],
    steps: [...defaultGrid[i]]
  }))
}

const sequencerLayers = ref<SequencerLayer[]>(createDefaultLayers())
const currentStep = ref(0)
const isPlaying = ref(false)
const bpm = ref(120)
let sequencerInterval: any = null

const saveSequencerState = () => {
  if (typeof window === 'undefined') return
  localStorage.setItem('te-sequencer-state', JSON.stringify({
    layers: sequencerLayers.value,
    bpm: bpm.value
  }))
}

const loadSequencerState = () => {
  try {
    const saved = localStorage.getItem('te-sequencer-state')
    if (saved) {
      const data = JSON.parse(saved)
      if (data.layers && Array.isArray(data.layers)) {
        // Merge saved layers into default layers so we don't lose new tracks
        const defaults = createDefaultLayers()
        data.layers.forEach((savedLayer: any, i: number) => {
          if (defaults[i]) {
            defaults[i].sound = savedLayer.sound || defaults[i].sound
            defaults[i].feel = savedLayer.feel || defaults[i].feel
            if (Array.isArray(savedLayer.steps) && savedLayer.steps.length === 16) {
              defaults[i].steps = savedLayer.steps
            }
          }
        })
        sequencerLayers.value = defaults
      }
      if (data.bpm) bpm.value = data.bpm
      return
    }
  } catch (e) {
    console.error('Failed to load sequencer state:', e)
  }
  
  resetSequencer(false)
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

const resetSequencer = (playSound = true) => {
  sequencerLayers.value = createDefaultLayers()
  bpm.value = 120
  if (playSound) playUISound('pop')
}

const clearSequencer = () => {
  sequencerLayers.value.forEach(layer => {
    layer.steps = Array(16).fill(false)
  })
  playUISound('tick')
}

watch(sequencerLayers, saveSequencerState, { deep: true })
watch(bpm, saveSequencerState)

const cycleTrackSound = (idx: number) => {
  const allSounds = ['thud', 'click', 'pop', 'hover', 'tick', 'success', 'error', 'drop']
  const layer = sequencerLayers.value[idx]
  const next = allSounds[(allSounds.indexOf(layer.sound) + 1) % allSounds.length]
  layer.sound = next
  playUISound(next as any)
}

const cycleTrackFeel = (idx: number) => {
  const availableFeels = ['aero', 'arcade', 'industrial', 'glass', 'organic', 'retro', 'soft', 'crisp', 'minimal']
  const layer = sequencerLayers.value[idx]
  const next = availableFeels[(availableFeels.indexOf(layer.feel) + 1) % availableFeels.length]
  layer.feel = next
  playUISound(layer.sound as any)
}

const toggleStep = (trackIdx: number, stepIdx: number) => {
  sequencerLayers.value[trackIdx].steps[stepIdx] = !sequencerLayers.value[trackIdx].steps[stepIdx]
  if (sequencerLayers.value[trackIdx].steps[stepIdx]) {
    playUISound(sequencerLayers.value[trackIdx].sound as any)
  }
}

const addLayer = () => {
  sequencerLayers.value.push({
    id: nextLayerId++,
    sound: 'click',
    feel: 'aero',
    steps: Array(16).fill(false)
  })
  playUISound('pop')
}

const removeLayer = (idx: number) => {
  sequencerLayers.value.splice(idx, 1)
  playUISound('tick')
}

const runSequencer = () => {
  if (sequencerInterval) clearInterval(sequencerInterval)
  const msPerBeat = 60000 / bpm.value
  const msPerStep = msPerBeat / 4 // 16th notes
  
  sequencerInterval = setInterval(() => {
    // Play sounds for current step
    let played = false
    sequencerLayers.value.forEach((layer) => {
      if (layer.steps[currentStep.value]) {
        triggerOscilloscope(layer.sound)
        playUISound(layer.sound as any)
        played = true
      }
    })
    
    // Advance step
    currentStep.value = (currentStep.value + 1) % 16
  }, msPerStep)
}

const togglePlay = () => {
  isPlaying.value = !isPlaying.value
  if (isPlaying.value) {
    playUISound('pop')
    runSequencer()
  } else {
    if (sequencerInterval) clearInterval(sequencerInterval)
    currentStep.value = 0
    playUISound('tick')
  }
}

watch(bpm, () => {
  if (isPlaying.value) {
    runSequencer()
  }
})
// ---------------------------

onMounted(() => {
  configureUISounds({
    feel: currentFeel.value as any,
    volume: volume.value,
    ambient: 'quiet'
  })
  
  loadSequencerState()
  drawOscilloscope()
  
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
  if (oscFrame) cancelAnimationFrame(oscFrame)
  if (unbindDomSounds) unbindDomSounds()
  if (sequencerInterval) clearInterval(sequencerInterval)
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

const copySkillInstall = async () => {
  try {
    await navigator.clipboard.writeText('npx skills add https://github.com/normvg/web-have-sound --skill web-have-sounds')
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
              WHS <span class="text-[var(--color-snow)]">1.6.4</span>
            </div>
            
            <div class="flex items-center gap-4">
              <!-- Icons -->
              <div class="flex items-center gap-3 text-[var(--color-dusty-grey)]">
                <NuxtLink to="/docs" class="hover:text-[var(--color-liquid-lava)] transition-colors active:scale-95 flex items-center gap-1.5" @pointerdown="playUISound('click')" title="Documentation">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                  <span class="text-[10px] uppercase font-bold tracking-widest hidden sm:inline-block">Docs</span>
                </NuxtLink>
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
            
            <p class="pt-2 text-[11px] uppercase tracking-widest text-white/40 font-bold border-t border-white/5">Install Agent Skill</p>
            <div class="w-full bg-[#181818] border border-[#2a2a2a] hover:border-[#333] transition-colors p-3 rounded flex justify-between items-center text-[var(--color-snow)] font-mono text-xs group">
              <code class="text-left select-text whitespace-nowrap overflow-x-auto no-scrollbar">npx skills add https://github.com/normvg/web-have-sound --skill web-have-sounds</code>
              <button 
                @pointerdown="copySkillInstall" 
                class="text-[var(--color-dusty-grey)] hover:text-white transition-all cursor-pointer active:scale-[0.85] active:brightness-90 select-none p-1 -m-1 ml-2 shrink-0"
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
        <div class="px-5 sm:px-6 pt-8 pb-20 relative">
          
          <!-- SPEAKER MESH GRILL -->
          <div class="w-full max-w-sm mx-auto h-4 rounded-full mb-8" 
               style="background-image: radial-gradient(#000 15%, transparent 16%); background-size: 4px 4px; background-position: center; box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);">
          </div>
          
          <!-- HARDWARE CHASSIS -->
          <div class="w-full flex flex-col gap-1 max-w-3xl mx-auto mb-10">
            
            <!-- Oscilloscope Screen (Top Half) -->
            <div class="bg-white rounded-t-xl rounded-b-[4px] p-5 relative overflow-hidden border border-black/10 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col">
              <div class="flex justify-between items-baseline mb-2 relative z-10">
                <div class="flex items-baseline gap-3">
                  <span class="text-[13px] font-bold text-black/90">Sound palette</span> 
                  <span class="text-[10px] text-black/40 font-mono">oscilloscope output</span>
                </div>
                <div class="text-[10px] font-mono text-black/40 bg-black/5 px-2 py-0.5 rounded-sm">{{ oscData.activeSound }} &nbsp;{{ oscData.freq }} Hz &middot; {{ oscData.time.toFixed(2) }} s</div>
              </div>
              <canvas ref="oscCanvas" class="w-full h-[40px] relative z-0"></canvas>
            </div>
            
            <!-- TOY SEQUENCER MODULE (Bottom Half) -->
            <div class="bg-[var(--color-dark-void)] rounded-t-[4px] rounded-b-xl p-4 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.25)] border border-black/10">
            
            <!-- Transport Controls -->
            <div class="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
              <div class="flex items-center gap-4">
                <button 
                  @click="togglePlay"
                  class="w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-90 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_2px_4px_rgba(0,0,0,0.5)]"
                  :class="isPlaying ? 'bg-[var(--color-liquid-lava)] text-black border border-[#c34300]' : 'bg-white text-black hover:bg-[#e0e0e0] border border-black/20'"
                >
                  <svg v-if="!isPlaying" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="ml-1"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                  <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5" width="14" height="14"></rect></svg>
                </button>
                <div class="font-mono text-[10px] tracking-widest uppercase">
                  <div>SEQ_16</div>
                  <div :class="isPlaying ? 'text-[var(--color-liquid-lava)]' : 'text-white/50'">{{ isPlaying ? 'RUN' : 'RDY' }}</div>
                </div>
              </div>
              
              <!-- BPM Slider -->
              <div class="flex items-center gap-3">
                <div class="text-[10px] font-mono uppercase tracking-widest text-white/50">BPM <span class="text-white">{{ bpm }}</span></div>
                <input type="range" min="60" max="200" step="1" v-model.number="bpm" class="w-24 accent-[var(--color-liquid-lava)] cursor-crosshair">
              </div>
            </div>

            <!-- 16-Step Grid with Track Controls -->
            <div class="flex gap-3">
              
              <!-- Track Controls Column -->
              <div class="flex flex-col gap-2 w-[48px] flex-shrink-0 pt-[2px]">
                <div v-for="(layer, tIndex) in sequencerLayers" :key="'control-'+layer.id" class="h-10 flex flex-col justify-center gap-0.5 relative group">
                  <button @click="cycleTrackSound(tIndex)" class="text-[9px] font-bold text-white text-left uppercase truncate hover:text-[var(--color-liquid-lava)] transition-colors active:scale-95 origin-left tracking-widest cursor-crosshair">{{ layer.sound }}</button>
                  <button @click="cycleTrackFeel(tIndex)" class="text-[8px] font-mono text-white/40 text-left uppercase truncate hover:text-[var(--color-liquid-lava)] transition-colors active:scale-95 origin-left cursor-crosshair">{{ layer.feel }}</button>
                  <button @click="removeLayer(tIndex)" class="absolute -left-[22px] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-white/40 hover:text-white hover:bg-red-500 w-5 h-5 rounded-full flex items-center justify-center transition-all cursor-crosshair hover:scale-110" aria-label="Remove layer">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              </div>

              <!-- Grid -->
              <TransitionGroup name="layer-list" tag="div" class="flex flex-col gap-2 flex-1 w-full overflow-hidden">
                <div v-for="(layer, tIndex) in sequencerLayers" :key="'track-'+layer.id" class="flex gap-[2px] h-10 w-full layer-item">
                  <div 
                    v-for="step in 16" 
                    :key="'step-'+step"
                    @pointerdown="toggleStep(tIndex, step - 1)"
                    class="flex-1 rounded-[2px] cursor-crosshair transition-all duration-75 relative"
                    :class="[
                      layer.steps[step - 1] ? 'bg-[var(--color-liquid-lava)] shadow-[0_0_8px_rgba(255,107,53,0.5)] border border-[#ff8855]' : 'bg-[#1a1a1a] hover:bg-[#2a2a2a] shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] border border-black/50',
                      currentStep === step - 1 && isPlaying ? 'after:absolute after:inset-0 after:bg-white/30 after:rounded-[2px] after:shadow-[0_0_10px_rgba(255,255,255,0.5)]' : ''
                    ]"
                  ></div>
                </div>
              </TransitionGroup>
            </div>
          </div>
          </div>
          
          <!-- Sequencer Footer Controls (Outside, Below) -->
          <div class="flex justify-between items-center max-w-3xl mx-auto px-2 sm:px-4 mt-4 mb-6">
            <button @click="resetSequencer(true)" class="text-[9px] sm:text-[11px] uppercase tracking-widest font-bold text-black/40 hover:text-[var(--color-liquid-lava)] transition-colors cursor-crosshair">Default Beat</button>
            <button @click="addLayer" class="text-[10px] sm:text-[12px] font-bold tracking-widest text-black/40 hover:text-black transition-colors flex items-center gap-1 sm:gap-2 cursor-crosshair">
              <span class="text-[14px] sm:text-[16px] font-normal leading-none sm:mb-[2px]">+</span> ADD LAYER
            </button>
            <div class="flex items-center gap-4">
              <button @click="clearSequencer" class="text-[9px] sm:text-[11px] uppercase tracking-widest font-bold text-black/40 hover:text-black transition-colors cursor-crosshair">Clear Grid</button>
              <NuxtLink to="/docs" class="text-[9px] sm:text-[11px] uppercase tracking-widest font-bold text-[var(--color-liquid-lava)] hover:text-black transition-colors cursor-crosshair">Docs</NuxtLink>
            </div>
          </div>
          
          <div class="flex items-center gap-3 mb-4 mt-12 border-b border-black/20 pb-3">
            <h2 class="text-[11px] font-bold uppercase tracking-widest m-0">Architecture</h2>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-px bg-black/20 border border-black/20 mb-12">
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
