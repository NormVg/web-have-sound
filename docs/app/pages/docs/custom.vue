<template>
  <div>
    <h1>Custom catalog</h1>
    <p>
      Register named feels, one-shots, and loops once — reuse app-wide, including
      <code>data-uisound</code>
      .
    </p>

    <h2>registerFeel</h2>
    <pre>registerFeel('brand', {
  filterFreq: 4200,
  q: 6,
  oscType: 'triangle',
  decayMult: 0.7,
  gainMult: 0.9,
  pitchMult: 1.15,
})

configureUISounds({ feel: 'brand' })</pre>

    <h2>registerSound</h2>
    <pre>registerSound('whoosh', (s) => {
  synthHelpers.tone(s, {
    freq: 900 * s.params.pitchMult,
    endFreq: 100,
    duration: 0.22,
    peak: 0.28 * s.volume,
  })
})</pre>

    <h2>registerLoop</h2>
    <pre>registerLoop('upload', ({ ctx, time, params, volume, connect }) => {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.frequency.value = 220 * params.pitchMult
  gain.gain.value = 0.06 * volume
  osc.connect(gain)
  connect(gain)
  osc.start(time)
  return { sources: [osc] }
})</pre>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'docs' })
useSeoMeta({ title: 'Custom catalog · web-have-sounds' })
</script>
