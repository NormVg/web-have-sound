<template>
  <div class="home">
    <header class="home-nav">
      <span class="home-logo">web-have-sounds</span>
      <nav>
        <NuxtLink to="/docs">Docs</NuxtLink>
        <NuxtLink to="/playground" class="home-cta-link">Studio</NuxtLink>
      </nav>
    </header>

    <section class="home-hero">
      <p class="home-kicker">Procedural UI audio</p>
      <h1>Make beats with the same library your product will ship.</h1>
      <p class="home-lede">
        Zero samples. Pure Web Audio. A 16-step looper playground where Feels
        become kits and loops become beds.
      </p>
      <div class="home-actions">
        <NuxtLink class="home-btn primary" to="/playground">
          Open Pulse Studio
        </NuxtLink>
        <NuxtLink class="home-btn" to="/docs/getting-started">
          Read the docs
        </NuxtLink>
      </div>
    </section>

    <section class="home-features">
      <article>
        <h2>One-shots</h2>
        <p>Clicks, pads, notifies, and more. Throttled, muted, SSR-safe.</p>
      </article>
      <article>
        <h2>Feels</h2>
        <p>Nine sonic palettes, or register your own brand kit once.</p>
      </article>
      <article>
        <h2>Loops</h2>
        <p>Long-running beds with fade in/out for loading and focus states.</p>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

useSeoMeta({
  title: 'web-have-sounds',
  description:
    'Procedural UI sounds for the web. Interactive looper playground and docs.',
})

useHead({
  htmlAttrs: { class: 'studio-html' },
  bodyAttrs: { class: 'studio-body' },
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Syne:wght@600;700&display=swap',
    },
  ],
})
</script>

<style>
html.studio-html,
body.studio-body {
  margin: 0;
  background: #0a0a0a;
}
</style>

<style scoped>
.home {
  --bg: #0a0a0a;
  --surface: #141414;
  --border: rgba(255, 255, 255, 0.08);
  --text: #efefef;
  --muted: rgba(255, 255, 255, 0.55);
  --accent: #c4783a;
  min-height: 100dvh;
  background: var(--bg);
  color: var(--text);
  font-family: 'DM Sans', system-ui, sans-serif;
  padding: 0 24px 64px;
}

.home-nav {
  max-width: 1080px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 64px;
  border-bottom: 1px solid var(--border);
}

.home-logo {
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.home-nav nav {
  display: flex;
  gap: 16px;
  align-items: center;
}

.home-nav a {
  color: var(--muted);
  text-decoration: none;
  font-size: 14px;
}

.home-nav a:hover {
  color: var(--text);
}

.home-cta-link {
  color: var(--accent) !important;
  font-weight: 600;
}

.home-hero {
  max-width: 720px;
  margin: 0 auto;
  padding: 64px 0 48px;
}

.home-kicker {
  margin: 0 0 12px;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
  font-family: ui-monospace, monospace;
}

.home-hero h1 {
  margin: 0 0 16px;
  font-family: 'Syne', sans-serif;
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1.1;
  text-wrap: balance;
}

.home-lede {
  margin: 0 0 28px;
  color: var(--muted);
  font-size: 17px;
  line-height: 1.65;
  max-width: 48ch;
}

.home-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.home-btn {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 20px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  text-decoration: none;
  font-weight: 500;
  font-size: 14px;
  transition:
    transform 140ms cubic-bezier(0.34, 1.56, 0.64, 1),
    background 140ms ease,
    border-color 140ms ease;
}

.home-btn:hover {
  border-color: rgba(255, 255, 255, 0.22);
  text-decoration: none;
}

.home-btn:active {
  transform: scale(0.96);
}

.home-btn.primary {
  background: var(--accent);
  border-color: var(--accent);
  color: #0a0a0a;
  font-weight: 600;
}

.home-btn.primary:hover {
  background: #d4894a;
  border-color: #d4894a;
}

.home-features {
  max-width: 1080px;
  margin: 0 auto;
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr;
}

@media (min-width: 800px) {
  .home-features {
    grid-template-columns: repeat(3, 1fr);
  }
}

.home-features article {
  padding: 24px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--surface);
}

.home-features h2 {
  margin: 0 0 8px;
  font-family: 'Syne', sans-serif;
  font-size: 17px;
  font-weight: 600;
}

.home-features p {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.55;
}
</style>
