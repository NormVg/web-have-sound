<template>
  <div class="desk-knob">
    <div
      class="desk-knob-dial"
      role="slider"
      tabindex="0"
      :aria-label="label"
      :aria-valuemin="min"
      :aria-valuemax="max"
      :aria-valuenow="rounded"
      :style="dialStyle"
      @pointerdown="onDown"
      @keydown="onKey"
    />
    <span class="desk-knob-name">{{ label }}</span>
    <span class="desk-knob-val">{{ display }}</span>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label: string
    modelValue: number
    min?: number
    max?: number
    step?: number
    /** Format shown under knob */
    format?: (v: number) => string
  }>(),
  {
    min: 0,
    max: 1,
    step: 0.01,
  },
)

const emit = defineEmits<{
  'update:modelValue': [number]
}>()

const rounded = computed(() => {
  const s = props.step
  return Math.round(props.modelValue / s) * s
})

const display = computed(() =>
  props.format ? props.format(rounded.value) : String(Number(rounded.value.toFixed(2))),
)

/** Map value to dial rotation -120deg … 120deg */
const dialStyle = computed(() => {
  const t = (props.modelValue - props.min) / (props.max - props.min || 1)
  const clamped = Math.min(1, Math.max(0, t))
  const rot = -120 + clamped * 240
  const angle = clamped * 240
  return {
    '--knob-rot': `${rot}deg`,
    '--knob-angle': `${angle}deg`,
  }
})

let startY = 0
let startVal = 0

function clamp(v: number) {
  const stepped = Math.round(v / props.step) * props.step
  return Math.min(props.max, Math.max(props.min, stepped))
}

function onDown(e: PointerEvent) {
  const el = e.currentTarget as HTMLElement
  el.setPointerCapture(e.pointerId)
  startY = e.clientY
  startVal = props.modelValue

  const onMove = (ev: PointerEvent) => {
    const dy = startY - ev.clientY
    const range = props.max - props.min
    const next = clamp(startVal + (dy / 100) * range)
    emit('update:modelValue', next)
  }
  const onUp = (ev: PointerEvent) => {
    el.releasePointerCapture(ev.pointerId)
    el.removeEventListener('pointermove', onMove)
    el.removeEventListener('pointerup', onUp)
  }
  el.addEventListener('pointermove', onMove)
  el.addEventListener('pointerup', onUp)
}

function onKey(e: KeyboardEvent) {
  const dir = e.key === 'ArrowUp' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowDown' || e.key === 'ArrowLeft' ? -1 : 0
  if (!dir) return
  e.preventDefault()
  emit('update:modelValue', clamp(props.modelValue + dir * props.step))
}
</script>
