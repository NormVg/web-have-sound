<template>
  <div
    v-if="track"
    class="desk-modal-root"
    role="dialog"
    aria-modal="true"
    :aria-labelledby="titleId"
    @click.self="emit('close')"
  >
    <div class="desk-window desk-modal">
      <div class="desk-titlebar">
        <div class="desk-titlebar-left">
          <SlidersHorizontal :size="14" :stroke-width="2" aria-hidden="true" />
          <span :id="titleId">Edit · {{ track.name }}</span>
        </div>
        <div class="desk-titlebar-actions">
          <button type="button" class="desk-title-btn" aria-label="Close" @click="emit('close')">
            <X :size="14" :stroke-width="2.5" />
          </button>
        </div>
      </div>

      <div class="desk-window-body">
        <div class="desk-field">
          <span class="desk-label">Base sound</span>
          <select
            class="desk-select"
            :value="track.sound"
            @change="onSound"
          >
            <option v-for="s in sounds" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>

        <div class="desk-field">
          <span class="desk-label">Feel seed</span>
          <select class="desk-select" :value="track.feel" @change="onFeelSeed">
            <option v-for="f in feels" :key="f" :value="f">{{ f }}</option>
          </select>
        </div>

        <div class="desk-field">
          <span class="desk-label">Wave</span>
          <select class="desk-select" :value="track.customParams.oscType" @change="onOsc">
            <option value="sine">sine</option>
            <option value="triangle">triangle</option>
            <option value="square">square</option>
            <option value="sawtooth">sawtooth</option>
          </select>
        </div>

        <div class="desk-knob-grid">
          <DeskKnob
            label="Pitch"
            :model-value="track.customParams.pitchMult"
            :min="0.4"
            :max="2.2"
            :step="0.05"
            :format="v => v.toFixed(2)"
            @update:model-value="set('pitchMult', $event)"
          />
          <DeskKnob
            label="Filter"
            :model-value="track.customParams.filterFreq"
            :min="400"
            :max="8000"
            :step="50"
            :format="v => `${Math.round(v)}`"
            @update:model-value="set('filterFreq', $event)"
          />
          <DeskKnob
            label="Res Q"
            :model-value="track.customParams.q"
            :min="0.5"
            :max="16"
            :step="0.5"
            :format="v => v.toFixed(1)"
            @update:model-value="set('q', $event)"
          />
          <DeskKnob
            label="Decay"
            :model-value="track.customParams.decayMult"
            :min="0.2"
            :max="2.5"
            :step="0.05"
            :format="v => v.toFixed(2)"
            @update:model-value="set('decayMult', $event)"
          />
          <DeskKnob
            label="Gain"
            :model-value="track.customParams.gainMult"
            :min="0.1"
            :max="1.6"
            :step="0.05"
            :format="v => v.toFixed(2)"
            @update:model-value="set('gainMult', $event)"
          />
          <DeskKnob
            label="Pan"
            :model-value="track.customParams.pan ?? 0"
            :min="-1"
            :max="1"
            :step="0.05"
            :format="v => (v === 0 ? 'C' : v > 0 ? `R${v.toFixed(2)}` : `L${Math.abs(v).toFixed(2)}`)"
            @update:model-value="set('pan', $event)"
          />
          <DeskKnob
            label="Attack"
            :model-value="track.customParams.attackMult ?? 1"
            :min="0.2"
            :max="2.5"
            :step="0.05"
            :format="v => v.toFixed(2)"
            @update:model-value="set('attackMult', $event)"
          />
          <DeskKnob
            label="Release"
            :model-value="track.customParams.releaseMult ?? 1"
            :min="0.2"
            :max="2.5"
            :step="0.05"
            :format="v => v.toFixed(2)"
            @update:model-value="set('releaseMult', $event)"
          />
          <DeskKnob
            label="Sustain"
            :model-value="track.customParams.sustainLevel ?? 0.6"
            :min="0.05"
            :max="1"
            :step="0.05"
            :format="v => v.toFixed(2)"
            @update:model-value="set('sustainLevel', $event)"
          />
        </div>

        <div class="desk-modal-actions">
          <button type="button" class="desk-btn is-primary" @click="emit('preview')">
            <Play :size="14" :stroke-width="2.2" aria-hidden="true" />
            Preview
          </button>
          <button type="button" class="desk-btn" @click="onSave">
            <Save :size="14" :stroke-width="2.2" aria-hidden="true" />
            Save preset
          </button>
        </div>

        <div v-if="presets.length" class="desk-field">
          <span class="desk-label">Your presets</span>
          <div class="desk-chips">
            <button
              v-for="p in presets"
              :key="p.id"
              type="button"
              class="desk-chip"
              @click="emit('apply-preset', p.id)"
            >
              <Bookmark :size="12" :stroke-width="2" aria-hidden="true" />
              {{ p.name }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Bookmark,
  Play,
  Save,
  SlidersHorizontal,
  X,
} from '@lucide/vue'
import type { FeelType, FeelParams, SoundType } from '@thenormvg/web-have-sounds'
import type { CustomPreset, DawTrack } from '~/composables/useDaw'
import { DAW_FEELS, DAW_SOUNDS } from '~/composables/useDaw'
import DeskKnob from '~/components/desk/DeskKnob.vue'

const props = defineProps<{
  track: DawTrack | null
  presets: CustomPreset[]
}>()

const emit = defineEmits<{
  close: []
  preview: []
  'update-sound': [SoundType]
  'update-feel-seed': [FeelType]
  'update-param': [keyof FeelParams, number | OscillatorType]
  'save-preset': [string]
  'apply-preset': [string]
}>()

const titleId = useId()
const sounds = DAW_SOUNDS
const feels = DAW_FEELS

function set(key: keyof FeelParams, value: number) {
  emit('update-param', key, value)
  emit('preview')
}

function onSound(e: Event) {
  emit('update-sound', (e.target as HTMLSelectElement).value as SoundType)
  emit('preview')
}

function onFeelSeed(e: Event) {
  emit('update-feel-seed', (e.target as HTMLSelectElement).value as FeelType)
  emit('preview')
}

function onOsc(e: Event) {
  emit('update-param', 'oscType', (e.target as HTMLSelectElement).value as OscillatorType)
  emit('preview')
}

function onSave() {
  const name = window.prompt('Preset name', props.track?.name ?? 'custom')
  if (name) emit('save-preset', name)
}
</script>
