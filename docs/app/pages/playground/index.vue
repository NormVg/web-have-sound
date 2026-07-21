<template>
  <div>
    <h1>Playground</h1>
    <p class="muted">
      Interactive lab for sounds, feels, and loops. Visual design TBD — controls work now.
    </p>

    <section style="margin-top: 2rem">
      <h2>Global</h2>
      <div class="btn-row" style="margin: 0.75rem 0">
        <label class="muted">
          Feel
          <select v-model="feel" style="margin-left: 0.5rem">
            <option v-for="f in feels" :key="f" :value="f">{{ f }}</option>
          </select>
        </label>
        <label class="muted">
          Volume
          <input
            v-model.number="volume"
            type="range"
            min="0"
            max="1"
            step="0.05"
            style="vertical-align: middle; margin-left: 0.5rem"
            @input="onVolume"
          >
        </label>
        <label class="muted">
          <input v-model="enabled" type="checkbox" @change="onEnabled">
          Enabled
        </label>
      </div>
    </section>

    <section style="margin-top: 1.5rem">
      <h2>One-shots</h2>
      <div class="btn-row" style="margin-top: 0.75rem">
        <button
          v-for="s in sounds"
          :key="s"
          type="button"
          class="btn"
          @click="play(s, feel)"
        >
          {{ s }}
        </button>
      </div>
    </section>

    <section style="margin-top: 1.5rem">
      <h2>Loops</h2>
      <div class="btn-row" style="margin-top: 0.75rem">
        <button
          v-for="l in loops"
          :key="l"
          type="button"
          class="btn"
          @click="toggleLoop(l)"
        >
          {{ active[l] ? 'Stop' : 'Start' }} {{ l }}
        </button>
        <button type="button" class="btn btn-primary" @click="stopAll">
          Stop all
        </button>
      </div>
      <p class="muted" style="margin-top: 0.75rem">
        Active: {{ activeList.length ? activeList.join(', ') : 'none' }}
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { BuiltInLoopType, FeelType, SoundType } from '@thenormvg/web-have-sounds'

const { play, loop, setEnabled, setVolume, configure } = useSounds()

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

const sounds: SoundType[] = [
  'click',
  'pop',
  'toggle',
  'tick',
  'drop',
  'success',
  'error',
  'warning',
  'startup',
  'hover',
  'press',
  'release',
  'select',
  'deselect',
  'delete',
  'notify',
  'keystroke',
  'connect',
  'disconnect',
]

const loops: BuiltInLoopType[] = ['loading', 'processing', 'pulse', 'hum']

const feel = ref<FeelType>('aero')
const volume = ref(0.85)
const enabled = ref(true)
const active = reactive<Record<string, boolean>>({})

const activeList = computed(() =>
  Object.entries(active)
    .filter(([, v]) => v)
    .map(([k]) => k),
)

watch(feel, (f) => {
  configure({ feel: f })
})

function onVolume() {
  setVolume(volume.value)
}

function onEnabled() {
  setEnabled(enabled.value)
  if (!enabled.value) {
    for (const k of Object.keys(active)) active[k] = false
  }
}

function toggleLoop(id: BuiltInLoopType) {
  if (active[id]) {
    loop.stop(id)
    active[id] = false
  }
  else {
    loop.start(id, { feel: feel.value })
    active[id] = true
  }
}

function stopAll() {
  loop.stopAll()
  for (const k of Object.keys(active)) active[k] = false
}

useSeoMeta({
  title: 'Playground · web-have-sounds',
})
</script>
