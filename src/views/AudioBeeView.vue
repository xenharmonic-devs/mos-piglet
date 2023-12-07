<script setup lang="ts">
import { useAudioStore } from '@/stores/audio'
import type { BufferSourceFactory } from 'audio-bee'
import { evalSource } from 'audio-bee'
import { ref } from 'vue'

class BufferProvider {
  factories: BufferSourceFactory[]
  constructor(factories: BufferSourceFactory[]) {
    this.factories = factories
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  provide(context: BaseAudioContext, frequency: number, velocity: number) {
    this.factories.sort(
      (a, b) =>
        Math.abs(Math.log(a.frequency / frequency)) - Math.abs(Math.log(b.frequency / frequency))
    )
    return this.factories[0].makeBufferSource(context, frequency)
  }
}

const audio = useAudioStore()

const source = ref('tanh(2 * sin(TAU * f * t) * exp(-10*t)) * exp(-5*t)')
const progress = ref(0)
const error = ref('')

async function evaluate() {
  if (!audio.context) {
    return
  }
  const sampleRate = audio.context.sampleRate
  const locals = new Map()
  try {
    error.value = ''
    const factories = await evalSource(source.value, {
      quantizePeriod: true,
      quantizeLoopEnd: true,
      sampleRate,
      length: sampleRate,
      frequencies: [220, 440, 880],
      velocities: [0.8],
      numberOfChannels: 1,
      loopStartT: 0,
      loopEndT: 0,
      locals,
      reportProgress: (value: number) => (progress.value = value)
    })
    const provider = new BufferProvider(factories)
    audio.bufferFactory = provider.provide.bind(provider)
    audio.synth = audio.bufferSynth
  } catch (e) {
    if (e instanceof Error) {
      error.value = e.message
    }
  }
}
</script>

<template>
  <div>
    <textarea cols="30" rows="10" v-model="source"></textarea>
    <br />
    <p>{{ error }}</p>
    <progress :value="progress"></progress>
    <br />
    <button @click="evaluate">Evaluate</button>
  </div>
</template>
