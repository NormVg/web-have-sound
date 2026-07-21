<template>
  <div>
    <h1>Sounds</h1>
    <p>
      One-shots for UI interactions. Call
      <code>playUISound(type)</code>
      or use
      <code>useSounds().play</code>
      .
    </p>
    <p class="muted">Full list and copy — design pass later. Preview grid below.</p>

    <div class="btn-row" style="margin-top: 1rem">
      <button
        v-for="s in sounds"
        :key="s"
        type="button"
        class="btn"
        @click="play(s)"
      >
        {{ s }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SoundType } from '@thenormvg/web-have-sounds'

definePageMeta({ layout: 'docs' })
const { play } = useSounds()

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
  'remove',
  'notify',
  'keystroke',
  'connect',
  'disconnect',
]

useSeoMeta({ title: 'Sounds · web-have-sounds' })
</script>
