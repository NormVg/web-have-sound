import {
  playUISound,
  startLoop,
  stopLoop,
  stopAllLoops,
  setUISoundsEnabled,
  setMasterVolume,
  configureUISounds,
  warmUpAudio,
  isLoopPlaying,
  type FeelId,
  type FeelParams,
  type LoopId,
  type PlayOptions,
  type SoundId,
  type StartLoopOptions,
} from '@thenormvg/web-have-sounds'

/**
 * Thin Nuxt composable around the library.
 * Audio only runs client-side; calls are safe no-ops on SSR.
 */
export function useSounds() {
  const play = (
    type: SoundId,
    feelOrOptions?: FeelId | FeelParams | PlayOptions,
  ) => {
    if (import.meta.server) return { ok: false as const, reason: 'ssr' as const }
    return playUISound(type, feelOrOptions)
  }

  const loop = {
    start: (id: LoopId, options?: StartLoopOptions) => {
      if (import.meta.server) return false
      return startLoop(id, options)
    },
    stop: (id?: LoopId) => {
      if (import.meta.server) return
      stopLoop(id)
    },
    stopAll: () => {
      if (import.meta.server) return
      stopAllLoops()
    },
    isPlaying: (id?: LoopId) => {
      if (import.meta.server) return false
      return isLoopPlaying(id)
    },
  }

  const setEnabled = (value: boolean) => {
    if (import.meta.server) return
    setUISoundsEnabled(value)
  }

  const setVolume = (value: number) => {
    if (import.meta.server) return
    setMasterVolume(value)
  }

  const configure = (
    config: Parameters<typeof configureUISounds>[0],
  ) => {
    if (import.meta.server) return
    configureUISounds(config)
  }

  const warmUp = () => {
    if (import.meta.server) return
    warmUpAudio()
  }

  return {
    play,
    loop,
    setEnabled,
    setVolume,
    configure,
    warmUp,
  }
}
