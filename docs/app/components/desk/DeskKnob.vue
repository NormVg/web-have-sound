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
      @pointerdown="onDown"
      @keydown="onKey"
    >
      <svg class="mono-knob-svg" viewBox="0 0 48 48" aria-hidden="true">
        <!-- inactive track -->
        <path
          class="mono-knob-track"
          :d="trackPath"
          fill="none"
          stroke-width="3.5"
          stroke-linecap="round"
        />
        <!-- active value arc -->
        <path
          class="mono-knob-value"
          :d="valuePath"
          fill="none"
          stroke-width="3.5"
          stroke-linecap="round"
        />
      </svg>
      <div class="mono-knob-cap">
        <span class="mono-knob-pointer" :style="pointerStyle" />
      </div>
    </div>
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

/** Sweep: -120° … +120° from 12 o'clock (240° total) */
const START = -120
const SWEEP = 240
const CX = 24
const CY = 24
const R = 16

const t = computed(() => {
  const span = props.max - props.min || 1
  return Math.min(1, Math.max(0, (props.modelValue - props.min) / span))
})

const rounded = computed(() => Math.round(props.modelValue / props.step) * props.step)

const display = computed(() =>
  props.format ? props.format(rounded.value) : String(Number(rounded.value.toFixed(2))),
)

const pointerStyle = computed(() => ({
  transform: `translateX(-50%) rotate(${START + t.value * SWEEP}deg)`,
}))

function polar(angleDeg: number): [number, number] {
  // 0° = 12 o'clock, clockwise positive
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return [CX + R * Math.cos(rad), CY + R * Math.sin(rad)]
}

function arcPath(fromDeg: number, toDeg: number): string {
  if (Math.abs(toDeg - fromDeg) < 0.5) {
    const [x, y] = polar(fromDeg)
    return `M ${x} ${y}`
  }
  const [x1, y1] = polar(fromDeg)
  const [x2, y2] = polar(toDeg)
  const large = Math.abs(toDeg - fromDeg) > 180 ? 1 : 0
  // sweep-flag 1 = clockwise
  return `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`
}

const trackPath = computed(() => arcPath(START, START + SWEEP))
const valuePath = computed(() => {
  const end = START + t.value * SWEEP
  return arcPath(START, end)
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
    emit('update:modelValue', clamp(startVal + ((startY - ev.clientY) / 110) * range))
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
  const dir =
    e.key === 'ArrowUp' || e.key === 'ArrowRight'
      ? 1
      : e.key === 'ArrowDown' || e.key === 'ArrowLeft'
        ? -1
        : 0
  if (!dir) return
  e.preventDefault()
  emit('update:modelValue', clamp(props.modelValue + dir * props.step))
}
</script>

<style scoped>
.mono-knob {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  user-select: none;
  touch-action: none;
}

.mono-knob-dial {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  cursor: ns-resize;
  display: grid;
  place-items: center;
}

.mono-knob-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.mono-knob-track {
  stroke: rgba(255, 255, 255, 0.1);
}

.mono-knob-value {
  stroke: #e8e4dc;
  filter: drop-shadow(0 0 4px rgba(232, 228, 220, 0.25));
}

.mono-knob-cap {
  position: relative;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: linear-gradient(165deg, #2a2a30 0%, #16161a 55%, #101014 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.5) inset,
    0 4px 12px rgba(0, 0, 0, 0.5),
    0 1px 0 rgba(255, 255, 255, 0.06);
  z-index: 1;
}

.mono-knob-pointer {
  position: absolute;
  left: 50%;
  top: 6px;
  width: 2px;
  height: 11px;
  margin: 0;
  border-radius: 1px;
  background: #e8e4dc;
  transform-origin: 50% 11px; /* center of cap: 17px from top of 34px cap; pointer top at 6px so origin at 6+11=17 */
  box-shadow: 0 0 6px rgba(232, 228, 220, 0.35);
  pointer-events: none;
}

.mono-knob-name {
  font-size: 10px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #71717a;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}

.mono-knob-val {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: #a1a1aa;
}

.mono-knob-dial:focus-visible {
  outline: 2px solid rgba(232, 228, 220, 0.45);
  outline-offset: 2px;
  border-radius: 50%;
}
</style>
