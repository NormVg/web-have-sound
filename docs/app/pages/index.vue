<template>
  <div class="mono-app">
    <header class="mono-nav">
      <NuxtLink to="/" class="mono-brand">
        <AudioLines :size="16" :stroke-width="2" aria-hidden="true" />
        web-have-sounds
      </NuxtLink>
      <nav class="mono-nav-links" aria-label="Primary">
        <NuxtLink to="/docs">
          <BookOpen :size="14" :stroke-width="2" aria-hidden="true" />
          Docs
        </NuxtLink>
        <a href="https://github.com/NormVg/web-have-sound" target="_blank" rel="noreferrer">
          <FolderGit2 :size="14" :stroke-width="2" aria-hidden="true" />
          GitHub
        </a>
      </nav>
    </header>

    <div class="mono-shell">
      <!-- Transport -->
      <div class="mono-bar" aria-label="Transport">
        <div class="mono-bar-group">
          <button
            type="button"
            class="mono-btn is-primary"
            :class="{ 'is-active': daw.playing.value }"
            :aria-pressed="daw.playing.value"
            @click="onTogglePlay"
          >
            <Pause v-if="daw.playing.value" :size="15" :stroke-width="2" aria-hidden="true" />
            <Play v-else :size="15" :stroke-width="2" aria-hidden="true" />
            {{ daw.playing.value ? 'Playing' : 'Play' }}
          </button>
          <button type="button" class="mono-btn" @click="daw.stop()">
            <Square :size="14" :stroke-width="2" aria-hidden="true" />
            Stop
          </button>
          <button type="button" class="mono-btn is-ghost" @click="onDemo">Demo</button>
          <button type="button" class="mono-btn is-ghost" @click="onClear">Clear</button>
        </div>

        <div class="mono-field">
          <span class="mono-label">BPM</span>
          <div style="display: flex; align-items: center; gap: 8px">
            <input
              class="mono-range"
              type="range"
              min="60"
              max="180"
              :value="daw.bpm.value"
              aria-label="BPM"
              @input="onBpm"
            >
            <span class="mono-mono" style="min-width: 3ch">{{ daw.bpm.value }}</span>
          </div>
        </div>

        <div class="mono-field">
          <span class="mono-label">Steps</span>
          <select
            class="mono-select"
            :value="daw.stepCount.value"
            aria-label="Step count"
            @change="onSteps"
          >
            <option v-for="n in daw.STEP_OPTIONS" :key="n" :value="n">{{ n }}</option>
          </select>
        </div>

        <div class="mono-field">
          <span class="mono-label">Master</span>
          <div style="display: flex; align-items: center; gap: 8px">
            <Volume2 :size="14" :stroke-width="2" aria-hidden="true" />
            <input
              class="mono-range"
              type="range"
              min="0"
              max="1"
              step="0.05"
              :value="volume"
              aria-label="Master volume"
              @input="onVolume"
            >
          </div>
        </div>

        <div class="mono-bar-end">
          <div class="mono-step-read" aria-live="polite">
            {{ daw.step.value < 0 ? '--' : String(daw.step.value + 1).padStart(2, '0') }}
            <small>step / {{ daw.stepCount.value }}</small>
          </div>
        </div>
      </div>

      <!-- Sequencer -->
      <section class="mono-panel" aria-label="Sequencer">
        <div class="mono-panel-head">
          <div>
            <h1 class="mono-panel-title">Pattern</h1>
            <p class="mono-panel-meta">
              {{ daw.tracks.value.length }} layers · {{ daw.stepCount.value }} steps · each layer has its own sound & feel
            </p>
          </div>
          <div class="mono-bar-group">
            <button
              type="button"
              class="mono-btn"
              :disabled="daw.tracks.value.length >= daw.MAX_TRACKS"
              @click="onAddLayer"
            >
              <Plus :size="15" :stroke-width="2" aria-hidden="true" />
              Add layer
            </button>
          </div>
        </div>

        <div class="mono-seq-scroll">
          <div
            class="mono-seq-grid"
            role="grid"
            :style="gridStyle"
          >
            <!-- header -->
            <div class="mono-track-meta" style="border: none; min-height: 0; padding-bottom: 0" />
            <div
              v-for="i in daw.stepCount.value"
              :key="`h-${i}`"
              class="mono-seq-hcell"
              :class="{
                'is-beat': (i - 1) % 4 === 0,
                'is-play': daw.step.value === i - 1,
              }"
            >
              {{ i }}
            </div>

            <!-- tracks -->
            <template v-for="track in daw.tracks.value" :key="track.id">
              <div class="mono-track-meta">
                <div class="mono-track-top">
                  <input
                    class="mono-track-name"
                    :value="track.name"
                    :aria-label="`Rename ${track.name}`"
                    @change="onRename(track.id, $event)"
                  >
                  <button
                    type="button"
                    class="mono-icon-btn"
                    :class="{ 'is-on': track.muted }"
                    :aria-label="track.muted ? 'Unmute' : 'Mute'"
                    @click="toggleMute(track.id)"
                  >
                    <VolumeX v-if="track.muted" :size="14" :stroke-width="2" />
                    <Volume2 v-else :size="14" :stroke-width="2" />
                  </button>
                  <button
                    type="button"
                    class="mono-icon-btn"
                    aria-label="Edit sound"
                    @click="openEditor(track.id)"
                  >
                    <SlidersHorizontal :size="14" :stroke-width="2" />
                  </button>
                  <button
                    type="button"
                    class="mono-icon-btn"
                    aria-label="Remove layer"
                    :disabled="daw.tracks.value.length <= 1"
                    @click="onRemoveLayer(track.id)"
                  >
                    <Trash2 :size="14" :stroke-width="2" />
                  </button>
                </div>
                <div class="mono-track-controls">
                  <select
                    class="mono-select"
                    :value="track.sound"
                    :aria-label="`${track.name} sound`"
                    @change="onTrackSound(track.id, $event)"
                  >
                    <option v-for="s in sounds" :key="s" :value="s">{{ s }}</option>
                  </select>
                  <select
                    class="mono-select"
                    :value="track.useCustom ? '__custom__' : track.feel"
                    :aria-label="`${track.name} feel`"
                    @change="onTrackFeel(track.id, $event)"
                  >
                    <option v-for="f in feels" :key="f" :value="f">{{ f }}</option>
                    <option v-if="track.useCustom" value="__custom__">custom</option>
                  </select>
                </div>
              </div>

              <button
                v-for="(on, i) in track.steps"
                :key="`${track.id}-${i}`"
                type="button"
                class="mono-cell"
                role="gridcell"
                :class="{
                  'is-on': on,
                  'is-playhead': daw.step.value === i,
                }"
                :aria-pressed="on"
                :aria-label="`${track.name} step ${i + 1}`"
                @click="onCell(track.id, i)"
              />
            </template>
          </div>
        </div>
      </section>

      <div class="mono-split">
        <section class="mono-panel" aria-label="Live pads">
          <div class="mono-panel-head">
            <h2 class="mono-panel-title">Pads</h2>
          </div>
          <div class="mono-pads">
            <button
              v-for="track in daw.tracks.value"
              :key="`pad-${track.id}`"
              type="button"
              class="mono-pad"
              :class="{ 'is-hit': hitId === track.id }"
              @pointerdown.prevent="onPad(track.id)"
            >
              <span class="mono-pad-name">{{ track.name }}</span>
              <span class="mono-pad-meta">
                {{ track.sound }} · {{ track.useCustom ? 'custom' : track.feel }}
              </span>
            </button>
          </div>
        </section>

        <section class="mono-panel" aria-label="Ambient beds">
          <div class="mono-panel-head">
            <h2 class="mono-panel-title">Ambient</h2>
          </div>
          <div class="mono-chips">
            <button
              v-for="bed in beds"
              :key="bed"
              type="button"
              class="mono-chip"
              :class="{ 'is-on': ambientOn[bed] }"
              @click="toggleBed(bed)"
            >
              {{ bed }}
            </button>
            <button type="button" class="mono-chip" @click="stopBeds">
              stop
            </button>
          </div>
        </section>
      </div>

      <footer class="mono-footer">
        <span>Procedural Web Audio · no samples</span>
        <NuxtLink to="/docs/getting-started">Use in your app</NuxtLink>
      </footer>
    </div>

    <DeskSoundEditor
      :track="daw.editorTrack.value"
      :presets="daw.customPresets.value"
      @close="daw.closeEditor()"
      @preview="onEditorPreview"
      @update-sound="onEditorSound"
      @update-feel-seed="onEditorFeel"
      @update-param="onEditorParam"
      @save-preset="onEditorSave"
      @apply-preset="onEditorApply"
    />

    <div v-if="!unlocked" class="mono-gate" role="dialog" aria-modal="true" aria-labelledby="gate-title">
      <div class="mono-gate-card">
        <h2 id="gate-title">Enable audio</h2>
        <p>
          One click unlocks the Web Audio engine so play, pads, and layers can sound.
        </p>
        <button type="button" class="mono-btn is-primary" @click="unlock">
          <Power :size="14" :stroke-width="2" aria-hidden="true" />
          Start
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  AudioLines,
  BookOpen,
  FolderGit2,
  Pause,
  Play,
  Plus,
  Power,
  SlidersHorizontal,
  Square,
  Trash2,
  Volume2,
  VolumeX,
} from '@lucide/vue'
import type { BuiltInLoopType, FeelParams, FeelType, SoundType } from '@thenormvg/web-have-sounds'
import {
  DAW_FEELS,
  DAW_SOUNDS,
  type StepCount,
} from '~/composables/useDaw'
import DeskSoundEditor from '~/components/desk/SoundEditor.vue'

definePageMeta({ layout: false })

useSeoMeta({
  title: 'web-have-sounds',
  description: 'Minimal procedural sound desk. Layers, steps, custom knobs.',
})

useHead({
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap',
    },
  ],
})

const { play, loop, setVolume, configure, warmUp } = useSounds()

const unlocked = ref(false)
const volume = ref(0.85)
const hitId = ref<string | null>(null)
const ambientOn = reactive<Record<string, boolean>>({})

const sounds = DAW_SOUNDS
const feels = DAW_FEELS
const beds: BuiltInLoopType[] = ['loading', 'processing', 'pulse', 'hum']

const daw = useDaw((sound, feelOrParams) => {
  play(sound, feelOrParams)
})

const gridStyle = computed(() => ({
  gridTemplateColumns: `minmax(220px, 240px) repeat(${daw.stepCount.value}, 28px)`,
}))

function unlock() {
  warmUp()
  configure({ volume: volume.value, randomize: false, debug: import.meta.dev })
  unlocked.value = true
  play('startup', 'aero')
}

function ensure() {
  if (!unlocked.value) unlock()
}

function onTogglePlay() {
  ensure()
  daw.togglePlay()
}

function onDemo() {
  ensure()
  daw.loadDemo()
  play('select', 'aero')
}

function onClear() {
  daw.clearAll()
  play('deselect', 'minimal')
}

function onBpm(e: Event) {
  daw.setBpm(Number((e.target as HTMLInputElement).value))
}

function onSteps(e: Event) {
  const n = Number((e.target as HTMLSelectElement).value) as StepCount
  daw.setStepCount(n)
}

function onVolume(e: Event) {
  volume.value = Number((e.target as HTMLInputElement).value)
  setVolume(volume.value)
}

function onCell(trackId: string, index: number) {
  ensure()
  daw.toggleStep(trackId, index)
}

function onTrackSound(trackId: string, e: Event) {
  ensure()
  daw.setTrackSound(trackId, (e.target as HTMLSelectElement).value as SoundType)
  daw.previewTrack(trackId)
}

function onTrackFeel(trackId: string, e: Event) {
  ensure()
  const v = (e.target as HTMLSelectElement).value
  if (v === '__custom__') return
  daw.setTrackFeel(trackId, v as FeelType)
  daw.previewTrack(trackId)
}

function toggleMute(trackId: string) {
  const t = daw.tracks.value.find(x => x.id === trackId)
  if (!t) return
  daw.updateTrack(trackId, { muted: !t.muted })
}

function openEditor(trackId: string) {
  ensure()
  daw.openEditor(trackId)
}

function onAddLayer() {
  ensure()
  daw.addTrack()
  play('tick', 'minimal')
}

function onRemoveLayer(id: string) {
  daw.removeTrack(id)
  play('tick', 'minimal')
}

function onRename(id: string, e: Event) {
  daw.renameTrack(id, (e.target as HTMLInputElement).value)
}

function onPad(trackId: string) {
  ensure()
  hitId.value = trackId
  daw.previewTrack(trackId)
  window.setTimeout(() => {
    if (hitId.value === trackId) hitId.value = null
  }, 120)
}

function toggleBed(id: BuiltInLoopType) {
  ensure()
  if (ambientOn[id]) {
    loop.stop(id)
    ambientOn[id] = false
  }
  else {
    loop.start(id, { volume: 0.85 })
    ambientOn[id] = true
  }
}

function stopBeds() {
  loop.stopAll()
  for (const k of Object.keys(ambientOn)) ambientOn[k] = false
}

function onEditorPreview() {
  if (daw.editorTrackId.value) daw.previewTrack(daw.editorTrackId.value)
}

function onEditorSound(s: SoundType) {
  if (!daw.editorTrackId.value) return
  daw.setTrackSound(daw.editorTrackId.value, s)
}

function onEditorFeel(f: FeelType) {
  if (!daw.editorTrackId.value) return
  daw.setTrackFeel(daw.editorTrackId.value, f)
}

function onEditorParam(key: keyof FeelParams, value: number | OscillatorType) {
  if (!daw.editorTrackId.value) return
  daw.setCustomParam(daw.editorTrackId.value, key, value)
}

function onEditorSave(name: string) {
  if (!daw.editorTrackId.value) return
  daw.savePreset(daw.editorTrackId.value, name)
  play('success', 'soft')
}

function onEditorApply(presetId: string) {
  if (!daw.editorTrackId.value) return
  daw.applyPreset(daw.editorTrackId.value, presetId)
  daw.previewTrack(daw.editorTrackId.value)
}

onBeforeUnmount(() => {
  daw.stop()
  stopBeds()
})
</script>

<style src="~/assets/css/mono.css"></style>
