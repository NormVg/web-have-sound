<template>
  <div class="mono-knob">
    <div
      class="mono-knob-dial"
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
    <span class="mono-knob-name">{{ label }}</span>
    <span class="mono-knob-val">{{ display }}</span>
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
    format?: (v: number) => string
  }>(),
  { min: 0, max: 1, step: 0.01 },
)

const emit = defineEmits<{ 'update:modelValue': [number] }>()

const rounded = computed(() => Math.round(props.modelValue / props.step) * props.step)
const display = computed(() =>
  props.format ? props.format(rounded.value) : String(Number(rounded.value.toFixed(2))),
)
const dialStyle = computed(() => {
  const t = Math.min(1, Math.max(0, (props.modelValue - props.min) / (props.max - props.min || 1)))
  return {
    '--knob-rot': `${-120 + t * 240}deg`,
    '--knob-angle': `${t * 240}deg`,
  }
})

let startY = 0
let startVal = 0

function clamp(v: number) {
  return Math.min(props.max, Math.max(props.min, Math.round(v / props.step) * props.step))
}

function onDown(e: PointerEvent) {
  const el = e.currentTarget as HTMLElement
  el.setPointerCapture(e.pointerId)
  startY = e.clientY
  startVal = props.modelValue
  const onMove = (ev: PointerEvent) => {
    const range = props.max - props.min
    emit('update:modelValue', clamp(startVal + ((startY - ev.clientY) / 100) * range))
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
