<template>
  <div class="studio-shell">
    <!-- Top bar -->
    <header class="studio-topbar">
      <div class="studio-brand">
        <span class="studio-brand-kicker">web-have-sounds</span>
        <span class="studio-brand-title">Pulse Studio</span>
      </div>
      <nav class="studio-top-links" aria-label="Studio navigation">
        <NuxtLink class="studio-link" to="/">Home</NuxtLink>
        <NuxtLink class="studio-link" to="/docs">Docs</NuxtLink>
        <a
          class="studio-link"
          href="https://github.com/NormVg/web-have-sound"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
      </nav>
    </header>

    <!-- Transport -->
    <section class="studio-transport" aria-label="Transport">
      <div class="transport-controls">
        <button
          type="button"
          class="transport-btn is-play"
          :class="{ 'is-active': seq.playing.value }"
          :aria-pressed="seq.playing.value"
          @click="onTogglePlay"
        >
          <span class="transport-glyph" aria-hidden="true">{{ seq.playing.value ? '||' : '>' }}</span>
          {{ seq.playing.value ? 'Playing' : 'Play' }}
        </button>
        <button type="button" class="transport-btn is-stop" @click="onStop">
          Stop
        </button>
        <button type="button" class="transport-btn" @click="onDemo">
          Load demo
        </button>
        <button type="button" class="transport-btn" @click="onClear">
          Clear
        </button>
      </div>

      <div class="transport-meta">
        <div class="field">
          <span class="field-label">Tempo</span>
          <div class="field-control">
            <input
              class="studio-range"
              type="range"
              min="60"
              max="180"
              step="1"
              :value="seq.bpm.value"
              aria-label="Beats per minute"
              @input="onBpm"
            >
            <span class="field-value">{{ seq.bpm.value }}</span>
          </div>
        </div>

        <div class="field">
          <span class="field-label">Kit / Feel</span>
          <div class="field-control">
            <select
              class="studio-select"
              :value="seq.feel.value"
              aria-label="Sound kit feel"
              @change="onFeel"
            >
              <option v-for="f in feels" :key="f" :value="f">
                {{ kitLabels[f] }}
              </option>
            </select>
          </div>
        </div>

        <div class="field">
          <span class="field-label">Master</span>
          <div class="field-control">
            <input
              class="studio-range"
              type="range"
              min="0"
              max="1"
              step="0.05"
              :value="volume"
              aria-label="Master volume"
              @input="onVolume"
            >
            <span class="field-value">{{ Math.round(volume * 100) }}</span>
          </div>
        </div>
      </div>

      <div class="step-readout" aria-live="polite">
        <span class="step-readout-main">
          {{ seq.step.value < 0 ? '--' : String(seq.step.value + 1).padStart(2, '0') }}
        </span>
        <span class="step-readout-sub">step / 16</span>
      </div>
    </section>

    <!-- Sequencer -->
    <section class="studio-sequencer" aria-label="Step sequencer">
      <div class="seq-header">
        <h1 class="seq-title">16-step looper</h1>
        <p class="seq-hint">
          Tap cells to program hits. Powered by procedural Web Audio, not sample packs.
        </p>
      </div>

      <div class="seq-scroll">
        <div
          class="seq-grid"
          role="grid"
          :aria-label="`Sequencer grid, kit ${seq.feel.value}`"
        >
          <div class="seq-corner" role="columnheader" />
          <div
            v-for="i in seq.stepCount"
            :key="`h-${i}`"
            class="seq-step-label"
            :class="{
              'is-beat': (i - 1) % 4 === 0,
              'is-playhead': seq.step.value === i - 1,
            }"
            role="columnheader"
          >
            {{ i }}
          </div>

          <template v-for="track in seq.tracks" :key="track.id">
            <div class="seq-track-label" role="rowheader">
              <span class="seq-track-name">{{ track.name }}</span>
              <span class="seq-track-sound">{{ track.sound }}</span>
            </div>
            <button
              v-for="(_, i) in seq.grid.value[track.id]"
              :key="`${track.id}-${i}`"
              type="button"
              class="seq-cell"
              role="gridcell"
              :class="{
                'is-on': seq.grid.value[track.id][i],
                'is-playhead': seq.step.value === i,
              }"
              :aria-label="`${track.name} step ${i + 1}, ${seq.grid.value[track.id][i] ? 'on' : 'off'}`"
              :aria-pressed="seq.grid.value[track.id][i]"
              @click="onCell(track.id, i)"
            />
          </template>
        </div>
      </div>
    </section>

    <!-- Pads + ambient -->
    <div class="studio-lower">
      <section class="studio-panel" aria-label="Live pads">
        <h2 class="panel-title">Live pads</h2>
        <p class="panel-desc">
          Free-play the same hits the grid uses. Good for testing a Feel before you sequence it.
        </p>
        <div class="pad-grid">
          <button
            v-for="track in seq.tracks"
            :key="`pad-${track.id}`"
            type="button"
            class="pad"
            :class="{ 'is-hit': hitPad === track.id }"
            @pointerdown.prevent="onPad(track)"
          >
            <span class="pad-name">{{ track.name }}</span>
            <span class="pad-meta">{{ track.sound }}</span>
          </button>
        </div>
      </section>

      <section class="studio-panel" aria-label="Ambient beds">
        <h2 class="panel-title">Ambient beds</h2>
        <p class="panel-desc">
          Long-running loops from the library. Layer under your pattern.
        </p>
        <div class="ambient-row">
          <button
            v-for="bed in beds"
            :key="bed"
            type="button"
            class="chip"
            :class="{ 'is-on': ambientOn[bed] }"
            :aria-pressed="ambientOn[bed]"
            @click="toggleBed(bed)"
          >
            {{ bed }}
          </button>
          <button type="button" class="chip" @click="stopBeds">
            stop beds
          </button>
        </div>
      </section>
    </div>

    <footer class="studio-footer">
      <span>All sound is synthesized in the browser via @thenormvg/web-have-sounds</span>
      <NuxtLink to="/docs/getting-started">How to use this in your app</NuxtLink>
    </footer>

    <!-- Audio unlock gate -->
    <div
      v-if="!unlocked"
      class="studio-gate"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gate-title"
    >
      <div class="studio-gate-card">
        <h2 id="gate-title">Unlock audio</h2>
        <p>
          Browsers block sound until you interact. Tap once to open the studio
          and arm the Web Audio engine.
        </p>
        <button type="button" class="transport-btn" @click="unlock">
          Enter studio
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BuiltInLoopType, FeelType, SoundType } from '@thenormvg/web-have-sounds'
import type { SeqTrack, TrackId } from '~/composables/useSequencer'

definePageMeta({ layout: 'studio' })

useSeoMeta({
  title: 'Pulse Studio · web-have-sounds',
  description:
    'Interactive 16-step looper playground for procedural UI sounds. No samples, pure Web Audio.',
})

const { play, loop, setVolume, configure, warmUp } = useSounds()

const unlocked = ref(false)
const volume = ref(0.85)
const hitPad = ref<TrackId | null>(null)
const ambientOn = reactive<Record<string, boolean>>({})

const feels: FeelType[] = [
  'aero',
  'soft',
  'arcade',
  'organic',
  'glass',
  'industrial',
  'minimal',
  'retro',
  'crisp',
]

const kitLabels: Record<FeelType, string> = {
  aero: 'Aero (clean)',
  soft: 'Soft',
  arcade: 'Arcade',
  organic: 'Organic',
  glass: 'Glass',
  industrial: 'Industrial',
  minimal: 'Minimal',
  retro: 'Retro',
  crisp: 'Crisp',
}

const beds: BuiltInLoopType[] = ['loading', 'processing', 'pulse', 'hum']

const seq = useSequencer({
  playStep: (sound: SoundType, feel: FeelType) => {
    play(sound, feel)
  },
})

function unlock() {
  warmUp()
  configure({
    feel: seq.feel.value,
    volume: volume.value,
    randomize: true,
    debug: import.meta.dev,
  })
  unlocked.value = true
  play('startup', seq.feel.value)
}

function ensureUnlocked() {
  if (!unlocked.value) unlock()
}

function onTogglePlay() {
  ensureUnlocked()
  seq.togglePlay()
}

function onStop() {
  seq.stop()
}

function onDemo() {
  ensureUnlocked()
  seq.loadDemo()
  play('select', seq.feel.value)
}

function onClear() {
  seq.clearGrid()
  play('deselect', seq.feel.value)
}

function onBpm(e: Event) {
  const v = Number((e.target as HTMLInputElement).value)
  seq.setBpm(v)
}

function onFeel(e: Event) {
  const v = (e.target as HTMLSelectElement).value as FeelType
  seq.setFeel(v)
  configure({ feel: v })
  play('tick', v)
}

function onVolume(e: Event) {
  const v = Number((e.target as HTMLInputElement).value)
  volume.value = v
  setVolume(v)
}

function onCell(trackId: TrackId, index: number) {
  ensureUnlocked()
  seq.toggleCell(trackId, index)
  const on = seq.grid.value[trackId][index]
  if (on) {
    const track = seq.tracks.find(t => t.id === trackId)
    if (track) play(track.sound, seq.feel.value)
  }
  else {
    play('tick', 'minimal')
  }
}

function onPad(track: SeqTrack) {
  ensureUnlocked()
  hitPad.value = track.id
  play(track.sound, seq.feel.value)
  window.setTimeout(() => {
    if (hitPad.value === track.id) hitPad.value = null
  }, 140)
}

function toggleBed(id: BuiltInLoopType) {
  ensureUnlocked()
  if (ambientOn[id]) {
    loop.stop(id)
    ambientOn[id] = false
  }
  else {
    loop.start(id, { feel: seq.feel.value, volume: 0.45 })
    ambientOn[id] = true
  }
}

function stopBeds() {
  loop.stopAll()
  for (const k of Object.keys(ambientOn)) ambientOn[k] = false
}

onBeforeUnmount(() => {
  seq.stop()
  stopBeds()
})
</script>

<style src="~/assets/css/studio.css"></style>
