<template>
  <div class="site">
    <header class="site-header">
      <NuxtLink to="/" class="site-brand">web-have-sounds</NuxtLink>
      <nav class="site-nav" aria-label="Primary">
        <NuxtLink to="/docs">Docs</NuxtLink>
        <NuxtLink to="/playground">Playground</NuxtLink>
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
      <div class="docs-layout">
        <aside class="docs-sidebar" aria-label="Docs navigation">
          <span class="group-label">Start</span>
          <NuxtLink to="/docs">Overview</NuxtLink>
          <NuxtLink to="/docs/getting-started">Getting started</NuxtLink>

          <span class="group-label">Guide</span>
          <NuxtLink to="/docs/sounds">Sounds</NuxtLink>
          <NuxtLink to="/docs/feels">Feels</NuxtLink>
          <NuxtLink to="/docs/loops">Loops</NuxtLink>
          <NuxtLink to="/docs/custom">Custom catalog</NuxtLink>
          <NuxtLink to="/docs/declarative">Declarative</NuxtLink>

          <span class="group-label">Reference</span>
          <NuxtLink to="/docs/api">API</NuxtLink>
        </aside>

        <article class="docs-content">
          <slot />
        </article>
      </div>
    </main>

    <footer class="site-footer">
      <span class="muted">@thenormvg/web-have-sounds · MIT</span>
    </footer>
  </div>
</template>
