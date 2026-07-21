<template>
  <div>
    <h1>Documentation</h1>
    <p>
      Guides for
      <code>@thenormvg/web-have-sounds</code>
      - procedural UI sounds, Feels, loops, and a custom catalog.
    </p>
    <p>
      Prefer hands-on?
      <NuxtLink to="/">Open the desk</NuxtLink>
      on the home page.
    </p>

    <div class="docs-cards">
      <NuxtLink class="docs-card" to="/docs/getting-started">
        <h3>Getting started</h3>
        <p>Install, configure, first sound.</p>
      </NuxtLink>
      <NuxtLink class="docs-card" to="/docs/sounds">
        <h3>Sounds</h3>
        <p>One-shot catalog.</p>
      </NuxtLink>
      <NuxtLink class="docs-card" to="/docs/feels">
        <h3>Feels</h3>
        <p>Sonic palettes.</p>
      </NuxtLink>
      <NuxtLink class="docs-card" to="/docs/loops">
        <h3>Loops</h3>
        <p>Long-running beds.</p>
      </NuxtLink>
      <NuxtLink class="docs-card" to="/docs/custom">
        <h3>Custom</h3>
        <p>registerFeel / registerSound.</p>
      </NuxtLink>
      <NuxtLink class="docs-card" to="/docs/api">
        <h3>API</h3>
        <p>Reference surface.</p>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'docs' })
useSeoMeta({ title: 'Docs · web-have-sounds' })
</script>
