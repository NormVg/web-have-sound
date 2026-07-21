<template>
  <div>
    <h1>Feels</h1>
    <p>
      A Feel is a sonic palette (oscillator, filter, timing, pitch). Set globally
      with
      <code>configureUISounds({ feel })</code>
      or per call.
    </p>

    <div class="card-grid" style="margin-top: 1rem">
      <button
        v-for="f in feels"
        :key="f"
        type="button"
        class="card"
        style="cursor: pointer; text-align: left"
        @click="play('success', f)"
      >
        <h3>{{ f }}</h3>
        <p>{{ blurbs[f] }}</p>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FeelType } from '@thenormvg/web-have-sounds'

definePageMeta({ layout: 'docs' })
const { play } = useSounds()

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

const blurbs: Record<FeelType, string> = {
  aero: 'Clean modern default',
  soft: 'Gentle, longer decay',
  arcade: '8-bit square, snappy',
  organic: 'Warm triangle',
  glass: 'High, resonant, premium',
  industrial: 'Heavy saw, weighty',
  minimal: 'Quiet, restrained',
  retro: 'Soft square, nostalgic',
  crisp: 'Bright, quick triangle',
}

useSeoMeta({ title: 'Feels · web-have-sounds' })
</script>
