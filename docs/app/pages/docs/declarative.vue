<template>
  <div>
    <h1>Declarative binding</h1>
    <p>
      Call
      <code>bindUISounds()</code>
      once, then mark elements with
      <code>data-uisound</code>
      .
    </p>
    <pre>&lt;button data-uisound="click"&gt;Save&lt;/button&gt;
&lt;button data-uisound="success" data-uisound-feel="arcade"&gt;Win&lt;/button&gt;
&lt;div data-uisound="hover" data-uisound-feel="soft"&gt;Hover me&lt;/div&gt;</pre>

    <p class="muted">Live demo block (wired via bind on mount):</p>
    <div class="btn-row" style="margin-top: 0.75rem">
      <button type="button" data-uisound="click" data-uisound-feel="crisp">
        data-uisound="click"
      </button>
      <button type="button" data-uisound="notify" data-uisound-feel="glass">
        notify + glass
      </button>
      <button type="button" data-uisound="delete" data-uisound-feel="industrial">
        delete
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { bindUISounds } from '@thenormvg/web-have-sounds'

definePageMeta({ layout: 'docs' })

onMounted(() => {
  const unbind = bindUISounds()
  onBeforeUnmount(() => unbind())
})

useSeoMeta({ title: 'Declarative · web-have-sounds' })
</script>
