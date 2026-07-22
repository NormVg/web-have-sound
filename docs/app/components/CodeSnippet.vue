<script setup lang="ts">
import { ref, computed } from 'vue'
import { Copy, Check } from '@lucide/vue'

const props = defineProps<{
  code: string
}>()

const copied = ref(false)

const copyToClipboard = () => {
  navigator.clipboard.writeText(props.code).then(() => {
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  })
}

// Ultra-lightweight custom syntax highlighter for a light theme
const highlightedCode = computed(() => {
  let html = props.code
    // Escape HTML first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  const tokens: string[] = []
  const pushToken = (content: string, className: string) => {
    const id = `___TOKEN${tokens.length}___`
    tokens.push(`<span class="${className}">${content}</span>`)
    return id
  }

  // Strings (single and double quotes)
  html = html.replace(/('[^']*'|"[^"]*")/g, (m) => pushToken(m, 'text-[#032f62]'))
  
  // Single-line Comments
  html = html.replace(/(\/\/.*)/g, (m) => pushToken(m, 'text-black/40 italic'))

  // HTML Tags (already escaped, so match &lt;...&gt;)
  html = html.replace(/(&lt;\/?[\w-]+.*?&gt;)/g, (m) => pushToken(m, 'text-[#22863a]'))
  
  // Keywords
  const keywords = ['import', 'from', 'export', 'default', 'const', 'let', 'var', 'function', 'return', 'setup']
  const keywordRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g')
  html = html.replace(keywordRegex, (m) => pushToken(m, 'text-[#d73a49]'))
  
  // Function calls
  html = html.replace(/(\w+)(?=\()/g, (m) => pushToken(m, 'text-[#6f42c1]'))

  // Restore tokens
  tokens.forEach((token, i) => {
    html = html.replace(`___TOKEN${i}___`, token)
  })

  return html
})
</script>

<template>
  <div class="relative group mt-2 mb-6 h-full">
    <button 
      @click="copyToClipboard" 
      class="absolute top-2 right-2 p-1.5 rounded bg-black/5 hover:bg-black/10 border border-black/5 text-black/50 hover:text-black/80 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer shadow-sm"
      title="Copy snippet"
    >
      <Check v-if="copied" class="w-3.5 h-3.5 text-emerald-500" />
      <Copy v-else class="w-3.5 h-3.5" />
    </button>
    <pre class="bg-[#f5f5f5] p-4 rounded border border-black/5 font-mono text-[13px] leading-relaxed overflow-x-auto m-0 h-full" v-html="highlightedCode"></pre>
  </div>
</template>
