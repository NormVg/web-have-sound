<template>
  <div class="docs-mono">
    <header class="mono-nav">
      <NuxtLink to="/" class="mono-brand">
        <AudioLines :size="16" :stroke-width="2" aria-hidden="true" />
        web-have-sounds
      </NuxtLink>
      <nav class="mono-nav-links" aria-label="Primary">
        <NuxtLink to="/">
          <LayoutGrid :size="14" :stroke-width="2" aria-hidden="true" />
          Desk
        </NuxtLink>
        <NuxtLink to="/docs">
          <BookOpen :size="14" :stroke-width="2" aria-hidden="true" />
          Docs
        </NuxtLink>
        <a href="https://github.com/NormVg/web-have-sound" target="_blank" rel="noreferrer">
          <FolderGit2 :size="14" :stroke-width="2" aria-hidden="true" />
          GitHub
        </a>
      </nav>
    </header>

    <div class="docs-mono-shell">
      <div class="docs-mono-layout">
        <aside class="docs-mono-side" aria-label="Docs">
          <span class="group">Start</span>
          <NuxtLink to="/docs">Overview</NuxtLink>
          <NuxtLink to="/docs/getting-started">Getting started</NuxtLink>
          <span class="group">Guide</span>
          <NuxtLink to="/docs/sounds">Sounds</NuxtLink>
          <NuxtLink to="/docs/feels">Feels</NuxtLink>
          <NuxtLink to="/docs/loops">Loops</NuxtLink>
          <NuxtLink to="/docs/custom">Custom</NuxtLink>
          <NuxtLink to="/docs/declarative">Declarative</NuxtLink>
          <span class="group">Reference</span>
          <NuxtLink to="/docs/api">API</NuxtLink>
        </aside>
        <article class="docs-mono-main">
          <slot />
        </article>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AudioLines, BookOpen, FolderGit2, LayoutGrid } from '@lucide/vue'

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
