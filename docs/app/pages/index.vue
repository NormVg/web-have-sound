<template>
  <div>
    <section class="hero">
      <span class="badge">docs + playground</span>
      <h1>Procedural UI sounds for the web</h1>
      <p>
        Zero-dependency Web Audio synthesis — themable Feels, custom catalog,
        multi-loop beds. Design polish lands next; structure is ready.
      </p>
      <div class="btn-row">
        <NuxtLink class="btn btn-primary" to="/docs" @click="play('click')">
          Read the docs
        </NuxtLink>
        <NuxtLink class="btn" to="/playground" @click="play('pop')">
          Open playground
        </NuxtLink>
        <button type="button" class="btn" @click="play('success')">
          Play success
        </button>
      </div>
    </section>

    <div class="card-grid">
      <NuxtLink class="card" to="/docs/getting-started" @click="play('tick')">
        <h3>Getting started</h3>
        <p>Install, configure, warm up audio, first click.</p>
      </NuxtLink>
      <NuxtLink class="card" to="/docs/sounds" @click="play('tick')">
        <h3>Sounds</h3>
        <p>One-shots: click, hover, notify, connect, …</p>
      </NuxtLink>
      <NuxtLink class="card" to="/docs/loops" @click="play('tick')">
        <h3>Loops</h3>
        <p>Long-running beds: loading, processing, hum.</p>
      </NuxtLink>
      <NuxtLink class="card" to="/playground" @click="play('tick')">
        <h3>Playground</h3>
        <p>Try feels, sounds, and loops live in the browser.</p>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const { play } = useSounds()

useSeoMeta({
  title: 'web-have-sounds',
  description: 'Procedural UI sounds — docs and playground',
})
</script>
