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

const highlightedCode = computed(() => {
  let code = props.code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  const tokens = []
  let tokenId = 0
  
  const saveToken = (html) => {
    const placeholder = `__TOKEN_${tokenId++}__`
    tokens.push({ placeholder, html })
    return placeholder
  }

  // 1. Comments
  code = code.replace(/(\/\/.*)/g, match => saveToken(`<span class="text-black/40 italic">${match}</span>`))
  
  // 2. Strings
  code = code.replace(/(['"`])([^'"`\\]*(\\.[^'"`\\]*)*)\1/g, match => saveToken(`<span class="text-[#d95d39]">${match}</span>`))

  // 3. Keywords
  const keywords = ['import', 'from', 'const', 'let', 'function', 'return', 'export', 'default', 'await', 'async']
  const kwRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g')
  code = code.replace(kwRegex, match => saveToken(`<span class="text-blue-600 font-medium">${match}</span>`))

  // 4. Function calls
  code = code.replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)(?=\s*\()/g, (match, p1) => {
    if (keywords.includes(p1) || p1.startsWith('__TOKEN_')) return match
    return saveToken(`<span class="text-purple-600">${p1}</span>`)
  })

  // Restore tokens
  tokens.forEach(token => {
    code = code.replace(token.placeholder, token.html)
  })

  return code
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
