<template>
  <div>
    <h1>API reference</h1>
    <p class="muted">Scaffold of the public surface — expand with full signatures later.</p>

    <h2>Playback</h2>
    <pre>playUISound(type, feelOrOptions?)
warmUpAudio()
getAudioContext()</pre>

    <h2>Config</h2>
    <pre>configureUISounds({ feel, volume, enabled, randomize, throttleMs, debug })
setUISoundsEnabled(boolean)
setMasterVolume(0–1)</pre>

    <h2>Catalog</h2>
    <pre>registerFeel / unregisterFeel / hasFeel / listCustomFeels
registerSound / unregisterSound / hasSound / listCustomSounds
registerLoop / unregisterLoop / hasLoop / listLoops</pre>

    <h2>Loops</h2>
    <pre>startLoop(id, options?)
stopLoop(id?)
stopAllLoops()
isLoopPlaying(id?)
getActiveLoops()
setLoopVolume(id, volume)</pre>

    <h2>Declarative</h2>
    <pre>bindUISounds({ root?, capture? }) → unbind</pre>

    <h2>Advanced</h2>
    <pre>createUISounds()  // isolated engine
synthHelpers      // tone, noiseBurst, chord, envelope
FEEL_PRESETS</pre>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'docs' })
useSeoMeta({ title: 'API · web-have-sounds' })
</script>
