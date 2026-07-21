import type { FeelType, FeelParams, SoundType } from '@thenormvg/web-have-sounds'
import { FEEL_PRESETS } from '@thenormvg/web-have-sounds'

/** Allowed pattern lengths (16th-note steps) */
export const STEP_OPTIONS = [8, 16, 32] as const
export type StepCount = (typeof STEP_OPTIONS)[number]

export const MAX_TRACKS = 12

export const DAW_SOUNDS: SoundType[] = [
  'click',
  'pop',
  'toggle',
  'tick',
  'drop',
  'press',
  'release',
  'select',
  'deselect',
  'notify',
  'success',
  'error',
  'warning',
  'keystroke',
  'connect',
  'disconnect',
  'delete',
  'startup',
]

export const DAW_FEELS: FeelType[] = [
  'aero',
  'soft',
  'arcade',
  'organic',
  'glass',
  'industrial',
  'minimal',
  'retro',
  'crisp',
]

const LAYER_DEFAULTS: Array<{ name: string, sound: SoundType, feel: FeelType }> = [
  { name: 'Kick', sound: 'press', feel: 'industrial' },
  { name: 'Hat', sound: 'tick', feel: 'crisp' },
  { name: 'Snare', sound: 'pop', feel: 'arcade' },
  { name: 'Lead', sound: 'notify', feel: 'glass' },
  { name: 'Perc', sound: 'click', feel: 'minimal' },
  { name: 'FX', sound: 'drop', feel: 'soft' },
  { name: 'Tone', sound: 'select', feel: 'aero' },
  { name: 'Pad', sound: 'success', feel: 'organic' },
]

export interface DawTrack {
  id: string
  name: string
  sound: SoundType
  feel: FeelType
  useCustom: boolean
  customParams: FeelParams
  steps: boolean[]
  muted: boolean
}

export interface CustomPreset {
  id: string
  name: string
  sound: SoundType
  params: FeelParams
}

function emptySteps(n: number): boolean[] {
  return Array.from({ length: n }, () => false)
}

function resizeSteps(steps: boolean[], n: number): boolean[] {
  if (steps.length === n) return steps
  if (steps.length > n) return steps.slice(0, n)
  return [...steps, ...emptySteps(n - steps.length)]
}

function cloneParams(p: FeelParams): FeelParams {
  return { ...p }
}

export function defaultParamsForFeel(feel: FeelType): FeelParams {
  return cloneParams(FEEL_PRESETS[feel])
}

function makeTrack(
  stepCount: number,
  partial: { name: string, sound: SoundType, feel: FeelType },
  id?: string,
): DawTrack {
  return {
    id: id ?? `track-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: partial.name,
    sound: partial.sound,
    feel: partial.feel,
    useCustom: false,
    customParams: defaultParamsForFeel(partial.feel),
    steps: emptySteps(stepCount),
    muted: false,
  }
}

export function createDefaultTracks(stepCount: number = 16): DawTrack[] {
  return LAYER_DEFAULTS.slice(0, 4).map((d, i) =>
    makeTrack(stepCount, d, ['kick', 'hat', 'snare', 'lead'][i]),
  )
}

export function applyDemoPattern(tracks: DawTrack[], stepCount: number): DawTrack[] {
  return tracks.map((t) => {
    const steps = emptySteps(stepCount)
    const half = Math.floor(stepCount / 2)
    const q = Math.floor(stepCount / 4)
    if (t.id === 'kick' || t.name === 'Kick') {
      steps[0] = true
      if (half < stepCount) steps[half] = true
    }
    if (t.id === 'hat' || t.name === 'Hat') {
      for (let i = 0; i < stepCount; i += 2) steps[i] = true
    }
    if (t.id === 'snare' || t.name === 'Snare') {
      if (q < stepCount) steps[q] = true
      if (q * 3 < stepCount) steps[q * 3] = true
    }
    if (t.id === 'lead' || t.name === 'Lead') {
      steps[0] = true
      if (Math.floor(stepCount * 0.375) < stepCount) steps[Math.floor(stepCount * 0.375)] = true
      if (Math.floor(stepCount * 0.625) < stepCount) steps[Math.floor(stepCount * 0.625)] = true
      if (Math.floor(stepCount * 0.875) < stepCount) steps[Math.floor(stepCount * 0.875)] = true
    }
    return { ...t, steps }
  })
}

export type PlayVoice = (sound: SoundType, feelOrParams: FeelType | FeelParams) => void

export function useDaw(playVoice: PlayVoice) {
  const playing = ref(false)
  const bpm = ref(120)
  const stepCount = ref<StepCount>(16)
  const step = ref(-1)
  const tracks = ref<DawTrack[]>(applyDemoPattern(createDefaultTracks(16), 16))
  const customPresets = ref<CustomPreset[]>([])
  const editorTrackId = ref<string | null>(null)
  let layerSerial = 5

  let timer: ReturnType<typeof setTimeout> | null = null
  let nextDeadline = 0

  // 16th notes relative to BPM
  const stepMs = computed(() => (60 / bpm.value) * 1000 / 4)

  const editorTrack = computed(() =>
    tracks.value.find(t => t.id === editorTrackId.value) ?? null,
  )

  function voiceFor(track: DawTrack): FeelType | FeelParams {
    if (track.useCustom) return track.customParams
    return track.feel
  }

  function playTrack(track: DawTrack) {
    if (track.muted) return
    playVoice(track.sound, voiceFor(track))
  }

  function clearTimer() {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  function fireStep(index: number) {
    step.value = index
    for (const track of tracks.value) {
      if (track.steps[index]) playTrack(track)
    }
  }

  function scheduleNext() {
    if (!playing.value) return
    const now = performance.now()
    const n = stepCount.value
    while (nextDeadline <= now) {
      const next = (step.value + 1 + n) % n
      fireStep(next)
      nextDeadline += stepMs.value
    }
    timer = setTimeout(scheduleNext, Math.max(0, nextDeadline - performance.now()))
  }

  function play() {
    if (playing.value) return
    playing.value = true
    fireStep(0)
    nextDeadline = performance.now() + stepMs.value
    scheduleNext()
  }

  function stop() {
    playing.value = false
    clearTimer()
    step.value = -1
  }

  function togglePlay() {
    if (playing.value) stop()
    else play()
  }

  function updateTrack(id: string, patch: Partial<DawTrack>) {
    tracks.value = tracks.value.map(t =>
      t.id === id ? { ...t, ...patch } : t,
    )
  }

  function toggleStep(trackId: string, index: number) {
    const track = tracks.value.find(t => t.id === trackId)
    if (!track || index >= track.steps.length) return
    const steps = [...track.steps]
    steps[index] = !steps[index]
    updateTrack(trackId, { steps })
    if (steps[index]) playTrack({ ...track, steps })
  }

  function setTrackSound(trackId: string, sound: SoundType) {
    updateTrack(trackId, { sound })
  }

  function setTrackFeel(trackId: string, feel: FeelType) {
    updateTrack(trackId, {
      feel,
      useCustom: false,
      customParams: defaultParamsForFeel(feel),
    })
  }

  function setStepCount(n: StepCount) {
    if (!STEP_OPTIONS.includes(n)) return
    const wasPlaying = playing.value
    if (wasPlaying) stop()
    stepCount.value = n
    tracks.value = tracks.value.map(t => ({
      ...t,
      steps: resizeSteps(t.steps, n),
    }))
  }

  function addTrack() {
    if (tracks.value.length >= MAX_TRACKS) return
    const preset = LAYER_DEFAULTS[tracks.value.length % LAYER_DEFAULTS.length]
    const name = tracks.value.length < LAYER_DEFAULTS.length
      ? preset.name
      : `Layer ${layerSerial++}`
    const track = makeTrack(stepCount.value, {
      name,
      sound: preset.sound,
      feel: preset.feel,
    })
    tracks.value = [...tracks.value, track]
  }

  function removeTrack(id: string) {
    if (tracks.value.length <= 1) return
    if (editorTrackId.value === id) editorTrackId.value = null
    tracks.value = tracks.value.filter(t => t.id !== id)
  }

  function renameTrack(id: string, name: string) {
    const trimmed = name.trim().slice(0, 18)
    if (!trimmed) return
    updateTrack(id, { name: trimmed })
  }

  function openEditor(trackId: string) {
    editorTrackId.value = trackId
  }

  function closeEditor() {
    editorTrackId.value = null
  }

  function setCustomParam(trackId: string, key: keyof FeelParams, value: number | OscillatorType) {
    const track = tracks.value.find(t => t.id === trackId)
    if (!track) return
    const customParams = { ...track.customParams, [key]: value } as FeelParams
    updateTrack(trackId, { customParams, useCustom: true })
  }

  function previewTrack(trackId: string) {
    const track = tracks.value.find(t => t.id === trackId)
    if (track) playTrack(track)
  }

  function savePreset(trackId: string, name: string) {
    const track = tracks.value.find(t => t.id === trackId)
    if (!track || !name.trim()) return
    customPresets.value = [
      ...customPresets.value,
      {
        id: `preset-${Date.now()}`,
        name: name.trim().slice(0, 24),
        sound: track.sound,
        params: cloneParams(track.customParams),
      },
    ]
  }

  function applyPreset(trackId: string, presetId: string) {
    const preset = customPresets.value.find(p => p.id === presetId)
    if (!preset) return
    updateTrack(trackId, {
      sound: preset.sound,
      useCustom: true,
      customParams: cloneParams(preset.params),
    })
  }

  function loadDemo() {
    tracks.value = applyDemoPattern(createDefaultTracks(stepCount.value), stepCount.value)
  }

  function clearAll() {
    tracks.value = tracks.value.map(t => ({
      ...t,
      steps: emptySteps(stepCount.value),
    }))
  }

  function setBpm(v: number) {
    bpm.value = Math.min(180, Math.max(60, Math.round(v)))
  }

  onBeforeUnmount(stop)

  return {
    playing,
    bpm,
    stepCount,
    step,
    tracks,
    customPresets,
    editorTrackId,
    editorTrack,
    play,
    stop,
    togglePlay,
    toggleStep,
    setTrackSound,
    setTrackFeel,
    updateTrack,
    setStepCount,
    addTrack,
    removeTrack,
    renameTrack,
    openEditor,
    closeEditor,
    setCustomParam,
    previewTrack,
    savePreset,
    applyPreset,
    loadDemo,
    clearAll,
    setBpm,
    playTrack,
    STEP_OPTIONS,
    MAX_TRACKS,
  }
}
