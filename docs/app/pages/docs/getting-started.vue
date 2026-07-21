<template>
  <div>
    <h1>Getting started</h1>
    <p>Install the package and play a sound from a user gesture.</p>

    <h2>Install</h2>
    <pre>npm install @thenormvg/web-have-sounds</pre>

    <h2>Minimal usage</h2>
    <pre>import { playUISound, warmUpAudio, configureUISounds } from '@thenormvg/web-have-sounds'

configureUISounds({ feel: 'glass', volume: 0.8 })

document.addEventListener('pointerdown', () => warmUpAudio(), { once: true })

button.addEventListener('click', () => {
  playUISound('pop')
})</pre>

    <h2>In this Nuxt site</h2>
    <p>
      The library is linked from monorepo source via Nuxt alias. Use the
      <code>useSounds()</code>
      composable and the client plugin that warms audio on first interaction.
    </p>

    <div class="btn-row">
      <button type="button" class="btn btn-primary" @click="play('success', 'glass')">
        Try success + glass
      </button>
      <NuxtLink class="btn" to="/playground">Open playground</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'docs' })
const { play } = useSounds()

useSeoMeta({ title: 'Getting started · web-have-sounds' })
</script>
