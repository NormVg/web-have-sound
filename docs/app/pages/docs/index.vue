<template>
  <div>
    <h1>Documentation</h1>
    <p>
      Guides and API for
      <code>@thenormvg/web-have-sounds</code>
      — procedural UI sounds with full parameterization, Feels, and multi-loop
      beds.
    </p>
    <p class="muted">
      Content is scaffolded; polish and design land when you’re ready.
    </p>

    <div class="card-grid" style="margin-top: 1.5rem">
      <NuxtLink class="card" to="/docs/getting-started">
        <h3>Getting started</h3>
        <p>Install, configure, first sound.</p>
      </NuxtLink>
      <NuxtLink class="card" to="/docs/sounds">
        <h3>Sounds</h3>
        <p>One-shot interaction catalog.</p>
      </NuxtLink>
      <NuxtLink class="card" to="/docs/feels">
        <h3>Feels</h3>
        <p>Sonic palettes and when to use them.</p>
      </NuxtLink>
      <NuxtLink class="card" to="/docs/loops">
        <h3>Loops</h3>
        <p>Long-running ambient beds.</p>
      </NuxtLink>
      <NuxtLink class="card" to="/docs/custom">
        <h3>Custom catalog</h3>
        <p>registerFeel / registerSound / registerLoop.</p>
      </NuxtLink>
      <NuxtLink class="card" to="/docs/api">
        <h3>API</h3>
        <p>Full reference surface.</p>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'docs' })

useSeoMeta({
  title: 'Docs · web-have-sounds',
})
</script>
