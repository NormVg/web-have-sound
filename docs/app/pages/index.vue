<template>
  <div class="desk-os">
    <header class="desk-menubar">
      <NuxtLink to="/" class="desk-menubar-brand">
        <AudioLines :size="16" :stroke-width="2.2" aria-hidden="true" />
        web-have-sounds
      </NuxtLink>
      <nav class="desk-menubar-nav" aria-label="Primary">
        <NuxtLink to="/docs">
          <BookOpen :size="14" :stroke-width="2" aria-hidden="true" />
          Docs
        </NuxtLink>
        <a
          href="https://github.com/NormVg/web-have-sound"
          target="_blank"
          rel="noreferrer"
        >
          <FolderGit2 :size="14" :stroke-width="2" aria-hidden="true" />
          GitHub
        </a>
      </nav>
    </header>

    <div class="desk-desktop">
      <!-- Transport -->
      <section class="desk-window" aria-label="Transport">
        <div class="desk-titlebar">
          <div class="desk-titlebar-left">
            <Gauge :size="14" :stroke-width="2" aria-hidden="true" />
            <span>Transport</span>
          </div>
        </div>
        <div class="desk-window-body">
          <div class="desk-transport">
            <div class="desk-transport-group">
              <button
                type="button"
                class="desk-btn is-primary"
                :class="{ 'is-active': daw.playing.value }"
                :aria-pressed="daw.playing.value"
                @click="onTogglePlay"
              >
                <Pause v-if="daw.playing.value" :size="16" :stroke-width="2.2" aria-hidden="true" />
                <Play v-else :size="16" :stroke-width="2.2" aria-hidden="true" />
                {{ daw.playing.value ? 'Playing' : 'Play' }}
              </button>
              <button type="button" class="desk-btn" @click="daw.stop()">
                <Square :size="14" :stroke-width="2.2" aria-hidden="true" />
                Stop
              </button>
              <button type="button" class="desk-btn" @click="onDemo">
                <Sparkles :size="14" :stroke-width="2" aria-hidden="true" />
                Demo
              </button>
              <button type="button" class="desk-btn is-danger" @click="onClear">
                <Eraser :size="14" :stroke-width="2" aria-hidden="true" />
                Clear
              </button>
            </div>

            <div class="desk-field" style="min-width: 140px">
              <span class="desk-label">BPM</span>
              <div style="display: flex; align-items: center; gap: 8px">
                <input
                  type="range"
                  min="60"
                  max="180"
                  :value="daw.bpm.value"
                  style="accent-color: var(--desk-ink); width: 100px"
                  aria-label="Beats per minute"
                  @input="onBpm"
                >
                <span style="font-family: var(--desk-font); font-variant-numeric: tabular-nums; min-width: 3ch">
                  {{ daw.bpm.value }}
                </span>
              </div>
            </div>

            <div class="desk-field" style="min-width: 120px">
              <span class="desk-label">Master</span>
              <div style="display: flex; align-items: center; gap: 8px">
                <Volume2 :size="14" :stroke-width="2" aria-hidden="true" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  :value="volume"
                  style="accent-color: var(--desk-ink); width: 90px"
                  aria-label="Master volume"
                  @input="onVolume"
                >
              </div>
            </div>

            <div class="desk-step-badge" aria-live="polite">
              {{ daw.step.value < 0 ? '--' : String(daw.step.value + 1).padStart(2, '0') }}
              <span class="desk-step-sub">step / 16</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Sequencer -->
      <section class="desk-window" aria-label="Sequencer">
        <div class="desk-titlebar">
          <div class="desk-titlebar-left">
            <Grid3x3 :size="14" :stroke-width="2" aria-hidden="true" />
            <span>16-step · each track owns sound + feel</span>
          </div>
        </div>
        <div class="desk-window-body">
          <div class="desk-seq-scroll">
            <div class="desk-seq-grid" role="grid">
              <div />
              <div
                v-for="i in daw.DAW_STEPS"
                :key="`h-${i}`"
                class="desk-seq-head"
                :class="{
                  'is-beat': (i - 1) % 4 === 0,
                  'is-play': daw.step.value === i - 1,
                }"
              >
                {{ i }}
              </div>

              <template v-for="track in daw.tracks.value" :key="track.id">
                <div class="desk-track-meta">
                  <div class="desk-track-top">
                    <span class="desk-track-name">{{ track.name }}</span>
                    <button
                      type="button"
                      class="desk-icon-btn"
                      :class="{ 'is-on': track.muted }"
                      :aria-label="track.muted ? 'Unmute' : 'Mute'"
                      @click="toggleMute(track.id)"
                    >
                      <VolumeX v-if="track.muted" :size="14" :stroke-width="2" />
                      <Volume2 v-else :size="14" :stroke-width="2" />
                    </button>
                    <button
                      type="button"
                      class="desk-icon-btn"
                      aria-label="Edit sound"
                      @click="openEditor(track.id)"
                    >
                      <SlidersHorizontal :size="14" :stroke-width="2" />
                    </button>
                  </div>
                  <div class="desk-track-selects">
                    <select
                      class="desk-select"
                      :value="track.sound"
                      :aria-label="`${track.name} sound`"
                      @change="onTrackSound(track.id, $event)"
                    >
                      <option v-for="s in sounds" :key="s" :value="s">{{ s }}</option>
                    </select>
                    <select
                      class="desk-select"
                      :value="track.useCustom ? '__custom__' : track.feel"
                      :aria-label="`${track.name} feel`"
                      @change="onTrackFeel(track.id, $event)"
                    >
                      <option v-for="f in feels" :key="f" :value="f">{{ f }}</option>
                      <option v-if="track.useCustom" value="__custom__">custom</option>
                    </select>
                    <button
                      type="button"
                      class="desk-icon-btn"
                      aria-label="Preview track"
                      @click="preview(track.id)"
                    >
                      <Play :size="14" :stroke-width="2.2" />
                    </button>
                  </div>
                </div>

                <button
                  v-for="(on, i) in track.steps"
                  :key="`${track.id}-${i}`"
                  type="button"
                  class="desk-cell"
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
        </div>
      </section>

      <div class="desk-split">
        <!-- Pads -->
        <section class="desk-window" aria-label="Live pads">
          <div class="desk-titlebar">
            <div class="desk-titlebar-left">
              <Hand :size="14" :stroke-width="2" aria-hidden="true" />
              <span>Live pads</span>
            </div>
          </div>
          <div class="desk-window-body">
            <div class="desk-pads">
              <button
                v-for="track in daw.tracks.value"
                :key="`pad-${track.id}`"
                type="button"
                class="desk-pad"
                :class="{ 'is-hit': hitId === track.id }"
                @pointerdown.prevent="onPad(track.id)"
              >
                <span class="desk-pad-name">{{ track.name }}</span>
                <span class="desk-pad-meta">
                  {{ track.sound }} · {{ track.useCustom ? 'custom' : track.feel }}
                </span>
              </button>
            </div>
          </div>
        </section>

        <!-- Ambient -->
        <section class="desk-window" aria-label="Ambient beds">
          <div class="desk-titlebar">
            <div class="desk-titlebar-left">
              <Waves :size="14" :stroke-width="2" aria-hidden="true" />
              <span>Ambient beds</span>
            </div>
          </div>
          <div class="desk-window-body">
            <p style="font-size: 12px; margin-bottom: 10px; opacity: 0.8">
              Long-running loops. Independent of the step grid.
            </p>
            <div class="desk-chips">
              <button
                v-for="bed in beds"
                :key="bed"
                type="button"
                class="desk-chip"
                :class="{ 'is-on': ambientOn[bed] }"
                @click="toggleBed(bed)"
              >
                <Circle v-if="!ambientOn[bed]" :size="10" :stroke-width="2.5" aria-hidden="true" />
                <CircleDot v-else :size="10" :stroke-width="2.5" aria-hidden="true" />
                {{ bed }}
              </button>
              <button type="button" class="desk-chip" @click="stopBeds">
                <Square :size="10" :stroke-width="2.5" aria-hidden="true" />
                stop
              </button>
            </div>
          </div>
        </section>
      </div>

      <footer class="desk-footer">
        <span>Procedural Web Audio · no samples</span>
        <NuxtLink to="/docs/getting-started">Ship this in your app</NuxtLink>
      </footer>
    </div>

    <!-- Sound editor -->
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

    <!-- Unlock gate -->
    <div v-if="!unlocked" class="desk-gate" role="dialog" aria-modal="true" aria-labelledby="gate-title">
      <div class="desk-window">
        <div class="desk-titlebar">
          <div class="desk-titlebar-left">
            <Volume2 :size="14" :stroke-width="2" aria-hidden="true" />
            <span id="gate-title">Audio locked</span>
          </div>
        </div>
        <div class="desk-window-body desk-gate-body">
          <p>
            Browsers keep Web Audio suspended until a gesture. Click once to unlock
            the engine and open the desk.
          </p>
          <button type="button" class="desk-btn is-primary" @click="unlock">
            <Power :size="14" :stroke-width="2.2" aria-hidden="true" />
            Unlock audio
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  AudioLines,
  BookOpen,
  Circle,
  CircleDot,
  Eraser,
  Gauge,
  FolderGit2,
  Grid3x3,
  Hand,
  Pause,
  Play,
  Power,
  SlidersHorizontal,
  Sparkles,
  Square,
  Volume2,
  VolumeX,
  Waves,
} from '@lucide/vue'
import type { BuiltInLoopType, FeelParams, FeelType, SoundType } from '@thenormvg/web-have-sounds'
import { DAW_FEELS, DAW_SOUNDS } from '~/composables/useDaw'
import DeskSoundEditor from '~/components/desk/SoundEditor.vue'

definePageMeta({ layout: false })

useSeoMeta({
  title: 'web-have-sounds · Desk',
  description: '16-step procedural sound desk. Per-track feel and custom knobs.',
})

useHead({
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap',
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

function preview(trackId: string) {
  ensure()
  daw.previewTrack(trackId)
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
    loop.start(id, { volume: 0.4 })
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

<style src="~/assets/css/desk-os.css"></style>
