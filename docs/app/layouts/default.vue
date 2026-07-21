<template>
  <div class="docs-os">
    <header class="desk-menubar">
      <NuxtLink to="/" class="desk-menubar-brand">
        <AudioLines :size="16" :stroke-width="2.2" aria-hidden="true" />
        web-have-sounds
      </NuxtLink>
      <nav class="desk-menubar-nav" aria-label="Primary">
        <NuxtLink to="/">
          <LayoutGrid :size="14" :stroke-width="2" aria-hidden="true" />
          Desk
        </NuxtLink>
        <NuxtLink to="/docs">
          <BookOpen :size="14" :stroke-width="2" aria-hidden="true" />
          Docs
        </NuxtLink>
        <a
          href="https://github.com/NormVg/web-have-sound"
          target="_blank"
          rel="noreferrer"
        >
          <FolderGit2 :size="14" :stroke-width="2" aria-hidden="true" />
          GitHub
        </a>
      </nav>
    </header>
    <main class="docs-shell" style="padding-top: 24px">
      <slot />
    </main>
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
      href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap',
    },
  ],
})
</script>

<style src="~/assets/css/desk-os.css"></style>
