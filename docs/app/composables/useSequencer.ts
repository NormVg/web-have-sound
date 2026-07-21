import type { FeelType, SoundType } from '@thenormvg/web-have-sounds'

export type TrackId = 'kick' | 'hat' | 'snare' | 'lead'

export interface SeqTrack {
  id: TrackId
  name: string
  sound: SoundType
  colorHint: string
}

export const SEQ_STEPS = 16

export const SEQ_TRACKS: SeqTrack[] = [
  { id: 'kick', name: 'Kick', sound: 'press', colorHint: 'low' },
  { id: 'hat', name: 'Hat', sound: 'tick', colorHint: 'high' },
  { id: 'snare', name: 'Snare', sound: 'pop', colorHint: 'mid' },
  { id: 'lead', name: 'Lead', sound: 'notify', colorHint: 'tone' },
]

export type GridState = Record<TrackId, boolean[]>

function emptyRow(): boolean[] {
  return Array.from({ length: SEQ_STEPS }, () => false)
}

export function createEmptyGrid(): GridState {
  return {
    kick: emptyRow(),
    hat: emptyRow(),
    snare: emptyRow(),
    lead: emptyRow(),
  }
}

/** A starter pattern so the studio feels alive on first play */
export function createDemoGrid(): GridState {
  const g = createEmptyGrid()
  // Kick on 1 & 3
  g.kick[0] = true
  g.kick[8] = true
  // Hat on off-beats
  for (let i = 0; i < SEQ_STEPS; i += 2) g.hat[i] = true
  // Snare on 2 & 4
  g.snare[4] = true
  g.snare[12] = true
  // Lead accents
  g.lead[0] = true
  g.lead[6] = true
  g.lead[10] = true
  g.lead[14] = true
  return g
}

export interface SequencerOptions {
  playStep: (sound: SoundType, feel: FeelType) => void
}

/**
 * Drift-corrected 16-step sequencer.
 * Uses performance.now() scheduling so BPM stays steady.
 */
export function useSequencer(options: SequencerOptions) {
  const playing = ref(false)
  const bpm = ref(120)
  const step = ref(-1)
  const feel = ref<FeelType>('arcade')
  const grid = ref<GridState>(createDemoGrid())

  let timer: ReturnType<typeof setTimeout> | null = null
  let nextDeadline = 0

  const stepMs = computed(() => (60 / bpm.value) * 1000 / 4)

  function clearTimer() {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  function fireStep(index: number) {
    step.value = index
    const feelNow = feel.value
    for (const track of SEQ_TRACKS) {
      if (grid.value[track.id][index]) {
        options.playStep(track.sound, feelNow)
      }
    }
  }

  function scheduleNext() {
    if (!playing.value) return
    const now = performance.now()
    // Catch up if tab throttled
    while (nextDeadline <= now) {
      const next = (step.value + 1 + SEQ_STEPS) % SEQ_STEPS
      fireStep(next)
      nextDeadline += stepMs.value
    }
    const delay = Math.max(0, nextDeadline - performance.now())
    timer = setTimeout(scheduleNext, delay)
  }

  function play() {
    if (playing.value) return
    playing.value = true
    nextDeadline = performance.now()
    // Immediately fire step 0
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

  function toggleCell(trackId: TrackId, index: number) {
    const row = [...grid.value[trackId]]
    row[index] = !row[index]
    grid.value = { ...grid.value, [trackId]: row }
  }

  function clearGrid() {
    grid.value = createEmptyGrid()
  }

  function loadDemo() {
    grid.value = createDemoGrid()
  }

  function setFeel(next: FeelType) {
    feel.value = next
  }

  function setBpm(next: number) {
    bpm.value = Math.min(200, Math.max(60, Math.round(next)))
  }

  onBeforeUnmount(() => {
    stop()
  })

  return {
    playing,
    bpm,
    step,
    feel,
    grid,
    tracks: SEQ_TRACKS,
    stepCount: SEQ_STEPS,
    play,
    stop,
    togglePlay,
    toggleCell,
    clearGrid,
    loadDemo,
    setFeel,
    setBpm,
  }
}
