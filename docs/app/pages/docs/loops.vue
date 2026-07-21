<template>
  <div>
    <h1>Loops</h1>
    <p>
      Long-running beds for loading, sync, focus. Use
      <code>startLoop</code>
      /
      <code>stopLoop</code>
      — multiple can run at once.
    </p>

    <div class="btn-row" style="margin-top: 1rem">
      <button
        v-for="l in loops"
        :key="l"
        type="button"
        class="btn"
        @click="toggle(l)"
      >
        {{ active[l] ? 'Stop' : 'Start' }} {{ l }}
      </button>
      <button type="button" class="btn btn-primary" @click="stopAll">
        Stop all
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BuiltInLoopType } from '@thenormvg/web-have-sounds'

definePageMeta({ layout: 'docs' })
const { loop } = useSounds()

const loops: BuiltInLoopType[] = ['loading', 'processing', 'pulse', 'hum']
const active = reactive<Record<string, boolean>>({})

function toggle(id: BuiltInLoopType) {
  if (active[id]) {
    loop.stop(id)
    active[id] = false
  }
  else {
    loop.start(id)
    active[id] = true
  }
}

function stopAll() {
  loop.stopAll()
  for (const k of Object.keys(active)) active[k] = false
}

useSeoMeta({ title: 'Loops · web-have-sounds' })
</script>
