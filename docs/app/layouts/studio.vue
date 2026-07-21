<template>
  <div class="studio-root">
    <slot />
  </div>
</template>

<script setup lang="ts">
useHead({
  htmlAttrs: { class: 'studio-html' },
  bodyAttrs: { class: 'studio-body' },
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=JetBrains+Mono:wght@400;500&family=Syne:wght@500;600;700&display=swap',
    },
  ],
})
</script>

<style>
html.studio-html,
body.studio-body {
  margin: 0;
  background: #0a0a0a;
  color: #efefef;
}
</style>
