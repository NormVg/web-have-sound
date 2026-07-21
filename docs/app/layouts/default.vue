<template>
  <div class="site site-docs-chrome">
    <header class="site-header">
      <NuxtLink to="/" class="site-brand">
        web-have-sounds
      </NuxtLink>
      <nav class="site-nav" aria-label="Primary">
        <NuxtLink to="/docs">Docs</NuxtLink>
        <NuxtLink to="/playground">Studio</NuxtLink>
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
