<template>
  <div class="site">
    <header class="site-header">
      <NuxtLink to="/" class="site-brand" @click="ping('click')">
        web-have-sounds
      </NuxtLink>
      <nav class="site-nav" aria-label="Primary">
        <NuxtLink to="/docs" @click="ping('tick')">Docs</NuxtLink>
        <NuxtLink to="/playground" @click="ping('tick')">Playground</NuxtLink>
        <a
          href="https://github.com/NormVg/web-have-sound"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
      </nav>
    </header>

    <main class="site-main">
      <slot />
    </main>

    <footer class="site-footer">
      <span class="muted">@thenormvg/web-have-sounds · MIT</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import type { SoundId } from '@thenormvg/web-have-sounds'

const { play } = useSounds()

function ping(type: SoundId) {
  play(type)
}
</script>
