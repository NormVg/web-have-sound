<template>
  <div class="docs-mono">
    <header class="mono-nav">
      <NuxtLink to="/" class="mono-brand">
        <AudioLines :size="16" :stroke-width="2" aria-hidden="true" />
        web-have-sounds
      </NuxtLink>
      <nav class="mono-nav-links" aria-label="Primary">
        <NuxtLink to="/">Desk</NuxtLink>
        <NuxtLink to="/docs">Docs</NuxtLink>
        <a href="https://github.com/NormVg/web-have-sound" target="_blank" rel="noreferrer">GitHub</a>
      </nav>
    </header>
    <main class="docs-mono-shell" style="padding-top: 28px">
      <div class="docs-mono-main">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { AudioLines } from '@lucide/vue'

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
</script>

<style src="~/assets/css/mono.css"></style>
