<script setup lang="ts">
import { ref, computed } from 'vue'
import { Copy, Check } from '@lucide/vue'
import { playUISound } from '@thenormvg/web-have-sounds'

const props = defineProps<{
  code: string
}>()

const copied = ref(false)

const copyToClipboard = () => {
  navigator.clipboard.writeText(props.code).then(() => {
    playUISound('success')
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  })
}

// Simply escape HTML to render raw text with no syntax highlighting
const highlightedCode = computed(() => {
  return props.code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
})
</script>

<template>
  <div class="relative group mt-2 mb-6 h-full">
    <button 
      @click="copyToClipboard" 
      @mouseenter="playUISound('hover')"
      @pointerdown="playUISound('click')"
      class="absolute top-2 right-2 p-1.5 rounded bg-black/5 hover:bg-black/10 border border-black/5 text-black/50 hover:text-black/80 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer shadow-sm"
      title="Copy snippet"
    >
      <Check v-if="copied" class="w-3.5 h-3.5 text-emerald-500" />
      <Copy v-else class="w-3.5 h-3.5" />
    </button>
    <pre class="bg-[#f5f5f5] p-4 rounded border border-black/5 font-mono text-[13px] leading-relaxed overflow-x-auto m-0 h-full" v-html="highlightedCode"></pre>
  </div>
</template>
