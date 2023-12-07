<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import HarmonicsEditor from '../components/HarmonicsEditor.vue'
import WaveformEditor from '../components/WaveformEditor.vue'
import { debounce } from '@/utils'
import { useAudioStore } from '@/stores/audio'
import { fft, ifft } from 'frost-fft'

const EPSILON = 1e-6

const audio = useAudioStore()

// Real signal for one period. Length = power of 2.
const waveform = reactive([0, 0.5, 1, 0.5, 0, -0.5, -1, -0.5])

const coefs = computed(() => {
  const wave = new Float64Array(waveform)
  const [real, imag] = fft(
    wave,
    wave.map(() => 0)
  )
  const inorm = 1 / real.length
  return [real.map((r) => r * inorm), imag.map((i) => i * inorm)]
})

const magnitude = computed(() => {
  const [real, imag] = coefs.value

  const N = real.length
  const M = N / 2
  // DC
  const result = [Math.abs(real[0])]
  // Positive frequencies
  for (let i = 1; i < M; ++i) {
    result.push(Math.hypot(real[i], imag[i]) * 2)
  }
  // Nyqyist
  result.push(Math.abs(real[M]))
  return result
})

function updateWaveform(index: number, value: number) {
  waveform[index] = value
}

function updateMagnitude(index: number, value: number) {
  const [real, imag] = coefs.value
  const N = real.length
  const M = N / 2

  if (index === 0 || index === M) {
    real[index] = (Math.sign(real[index]) || 1) * value
    imag[index] = 0
  } else {
    const mag = Math.hypot(real[index], imag[index]) * 2
    if (mag < EPSILON) {
      real[index] = value / 2
      imag[index] = 0
      real[N - index] = value / 2
      imag[N - index] = 0
    } else {
      real[index] = (real[index] / mag) * value
      real[N - index] = (real[N - index] / mag) * value
      imag[index] = (imag[index] / mag) * value
      imag[N - index] = (imag[N - index] / mag) * value
    }
  }
  const wave = ifft(real, imag)[0]
  for (let i = 0; i < waveform.length; ++i) {
    waveform[i] = wave[i]
  }
}

function doubleLength() {
  const [real, imag] = coefs.value
  const N = real.length
  const M = N / 2
  const realDoubled = new Float64Array(2 * N)
  const imagDoubled = new Float64Array(2 * N)
  realDoubled[0] = real[0]
  realDoubled[M] = real[M]
  for (let i = 1; i < M + 1; ++i) {
    realDoubled[i] = real[i] * 2
    imagDoubled[i] = imag[i] * 2
  }
  const wave = ifft(realDoubled, imagDoubled)[0]
  waveform.length = 2 * N
  for (let i = 0; i < waveform.length; ++i) {
    waveform[i] = wave[i]
  }
}

watch(
  waveform,
  debounce(() => {
    if (!audio.context || !audio.synth) {
      return
    }
    const [real, imag] = coefs.value
    const N = real.length
    const M = N / 2
    const cosines = new Float64Array(M + 1)
    const sines = new Float64Array(M + 1)
    // DC
    cosines[0] = real[0]
    // Positive frequencies
    for (let i = 1; i < M; ++i) {
      cosines[i] = real[i] * 2
      sines[i] = imag[i] * 2
    }
    // Nyquist
    cosines[M] = real[M]

    const wave = audio.context.createPeriodicWave(cosines, sines)
    audio.synthVoiceParams.periodicWave = wave
    audio.synthVoiceParams.type = 'custom'
  })
)
</script>

<template>
  <main>
    <div class="editor">
      <HarmonicsEditor :magnitude="magnitude" @update:magnitude="updateMagnitude" />
    </div>
    <div class="editor">
      <WaveformEditor :waveform="waveform" @update:waveform="updateWaveform" />
    </div>
    <button @click="doubleLength">2x</button>
  </main>
</template>

<style scoped>
.editor {
  margin-top: 2%;
  margin-bottom: 2%;
  height: 400px;
  width: 500px;
}
.spacer {
  margin-top: 2%;
  margin-bottom: 2%;
}
</style>
