import type { FeelType, FeelParams, SoundType } from '@thenormvg/web-have-sounds'
import { FEEL_PRESETS } from '@thenormvg/web-have-sounds'

export const DAW_STEPS = 16

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

export interface DawTrack {
  id: string
  name: string
  sound: SoundType
  /** Named feel, or use customParams when useCustom is true */
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

function emptySteps(): boolean[] {
  return Array.from({ length: DAW_STEPS }, () => false)
}

function cloneParams(p: FeelParams): FeelParams {
  return { ...p }
}

export function defaultParamsForFeel(feel: FeelType): FeelParams {
  return cloneParams(FEEL_PRESETS[feel])
}

export function createDefaultTracks(): DawTrack[] {
  return [
    {
      id: 'kick',
      name: 'Kick',
      sound: 'press',
      feel: 'industrial',
      useCustom: false,
      customParams: defaultParamsForFeel('industrial'),
      steps: emptySteps(),
      muted: false,
    },
    {
      id: 'hat',
      name: 'Hat',
      sound: 'tick',
      feel: 'crisp',
      useCustom: false,
      customParams: defaultParamsForFeel('crisp'),
      steps: emptySteps(),
      muted: false,
    },
    {
      id: 'snare',
      name: 'Snare',
      sound: 'pop',
      feel: 'arcade',
      useCustom: false,
      customParams: defaultParamsForFeel('arcade'),
      steps: emptySteps(),
      muted: false,
    },
    {
      id: 'lead',
      name: 'Lead',
      sound: 'notify',
      feel: 'glass',
      useCustom: false,
      customParams: defaultParamsForFeel('glass'),
      steps: emptySteps(),
      muted: false,
    },
  ]
}

export function applyDemoPattern(tracks: DawTrack[]): DawTrack[] {
  return tracks.map((t) => {
    const steps = emptySteps()
    if (t.id === 'kick') {
      steps[0] = steps[8] = true
    }
    if (t.id === 'hat') {
      for (let i = 0; i < DAW_STEPS; i += 2) steps[i] = true
    }
    if (t.id === 'snare') {
      steps[4] = steps[12] = true
    }
    if (t.id === 'lead') {
      steps[0] = steps[6] = steps[10] = steps[14] = true
    }
    return { ...t, steps }
  })
}

export type PlayVoice = (sound: SoundType, feelOrParams: FeelType | FeelParams) => void

export function useDaw(playVoice: PlayVoice) {
  const playing = ref(false)
  const bpm = ref(120)
  const step = ref(-1)
  const tracks = ref<DawTrack[]>(applyDemoPattern(createDefaultTracks()))
  const customPresets = ref<CustomPreset[]>([])
  const editorTrackId = ref<string | null>(null)

  let timer: ReturnType<typeof setTimeout> | null = null
  let nextDeadline = 0

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
    while (nextDeadline <= now) {
      const next = (step.value + 1 + DAW_STEPS) % DAW_STEPS
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
    if (!track) return
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
    const preset: CustomPreset = {
      id: `preset-${Date.now()}`,
      name: name.trim().slice(0, 24),
      sound: track.sound,
      params: cloneParams(track.customParams),
    }
    customPresets.value = [...customPresets.value, preset]
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
    tracks.value = applyDemoPattern(createDefaultTracks())
  }

  function clearAll() {
    tracks.value = tracks.value.map(t => ({ ...t, steps: emptySteps() }))
  }

  function setBpm(v: number) {
    bpm.value = Math.min(180, Math.max(60, Math.round(v)))
  }

  onBeforeUnmount(stop)

  return {
    playing,
    bpm,
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
    DAW_STEPS,
  }
}
