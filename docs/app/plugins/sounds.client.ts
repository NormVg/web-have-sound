import { configureUISounds, warmUpAudio } from '@thenormvg/web-have-sounds'

/**
 * Client-only setup:
 * - sensible site defaults
 * - unlock AudioContext on first pointer/key (autoplay policy)
 */
export default defineNuxtPlugin(() => {
  configureUISounds({
    feel: 'aero',
    volume: 0.85,
    randomize: true,
    debug: import.meta.dev,
  })

  const unlock = () => {
    warmUpAudio()
    window.removeEventListener('pointerdown', unlock)
    window.removeEventListener('keydown', unlock)
  }

  window.addEventListener('pointerdown', unlock, { once: true })
  window.addEventListener('keydown', unlock, { once: true })
})
