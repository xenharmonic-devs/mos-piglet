<script setup lang="ts">
import { reactive, watch } from 'vue'
import HarmonicsEditor from '../components/HarmonicsEditor.vue'
import { debounce } from '@/utils'
import { useAudioStore } from '@/stores/audio'

const audio = useAudioStore()

const magnitude = reactive([1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01, 0.03])
const phase = reactive(magnitude.map(() => 0))

function updateMagnitude(index: number, value: number) {
  magnitude[index] = value
}

watch(
  [magnitude, phase],
  debounce(() => {
    if (!audio.context || !audio.synth) {
      return
    }
    const real = new Float32Array(magnitude.length + 1)
    const imag = new Float32Array(magnitude.length + 1)
    for (let i = 0; i < magnitude.length; ++i) {
      real[i + 1] = magnitude[i] * Math.cos(phase[i])
      imag[i + 1] = magnitude[i] * Math.sin(phase[i])
    }
    const wave = audio.context.createPeriodicWave(real, imag)
    audio.synthVoiceParams.periodicWave = wave
    audio.synthVoiceParams.type = 'custom'
  })
)
</script>

<template>
  <main>
    <HarmonicsEditor :magnitude="magnitude" :phase="phase" @update:magnitude="updateMagnitude" />
  </main>
</template>
