import { reactive, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { UnisonSynth, type UnisonVoiceParams } from 'sw-synth'

const audioDelay = navigator.userAgent.includes('Chrome') ? 0.001 : 0.03

export const useAudioStore = defineStore('audio', () => {
  const context = ref<AudioContext | null>(null)
  // Chromium has some issues with audio nodes as props
  // so we need this extra ref and the associated watcher.
  const mainVolume = ref(0.175)
  // Protect the user's audio system by limiting
  // the gain and frequency response.
  const mainGain = ref<GainNode | null>(null)
  const mainLowpass = ref<BiquadFilterNode | null>(null)
  const mainHighpass = ref<BiquadFilterNode | null>(null)
  const synth = ref<UnisonSynth | null>(null)

  // Synth params
  const maxPolyphony = ref(6)
  // const synthVoiceParams = reactive<AperiodicVoiceParams>({
  const synthVoiceParams = reactive<UnisonVoiceParams>({
    audioDelay,
    attackTime: 0.01,
    decayTime: 0.3,
    sustainLevel: 0.8,
    releaseTime: 0.01,
    spread: 3,
    stackSize: 5,
    type: 'sawtooth'
  })

  // Fetch synth max polyphony
  if ('maxPolyphony' in window.localStorage) {
    maxPolyphony.value = parseInt(window.localStorage.getItem('maxPolyphony')!)
  }

  function initialize() {
    if (context.value) {
      context.value.resume()
      return
    }
    context.value = new AudioContext({ latencyHint: 'interactive' })

    const gain = context.value.createGain()
    gain.gain.setValueAtTime(mainVolume.value, context.value.currentTime)
    gain.connect(context.value.destination)
    mainGain.value = gain

    const lowpass = context.value.createBiquadFilter()
    lowpass.frequency.setValueAtTime(5000, context.value.currentTime)
    lowpass.Q.setValueAtTime(Math.sqrt(0.5), context.value.currentTime)
    lowpass.type = 'lowpass'
    lowpass.connect(gain)
    mainLowpass.value = lowpass

    const highpass = context.value.createBiquadFilter()
    highpass.frequency.setValueAtTime(30, context.value.currentTime)
    highpass.Q.setValueAtTime(Math.sqrt(0.5), context.value.currentTime)
    highpass.type = 'highpass'
    highpass.connect(lowpass)
    mainHighpass.value = highpass

    // Intended point of audio connection
    const audioDestination = highpass

    synth.value = new UnisonSynth(context.value, audioDestination)
    synth.value.voiceParams = synthVoiceParams
    synth.value.maxPolyphony = maxPolyphony.value
  }

  async function unintialize() {
    if (!context.value) {
      return
    }
    if (mainGain.value) {
      mainGain.value.disconnect()
    }
    if (mainLowpass.value) {
      mainLowpass.value.disconnect()
    }
    if (mainHighpass.value) {
      mainHighpass.value.disconnect()
    }
    if (synth.value) {
      synth.value.setPolyphony(0)
    }
    await context.value.close()
    context.value = null
  }

  watch(mainVolume, (newValue) => {
    if (!context.value || !mainGain.value) {
      return
    }
    mainGain.value.gain.setValueAtTime(newValue, context.value.currentTime)
  })

  watch(maxPolyphony, (newValue) => {
    localStorage.setItem('maxPolyphony', newValue.toString())
    if (!synth.value) {
      return
    }
    synth.value.setPolyphony(newValue)
  })

  return {
    initialize,
    unintialize,
    context,
    mainVolume,
    maxPolyphony,
    synthVoiceParams,
    synth,

    // Add to state but not intended for mutation
    mainGain,
    mainLowpass,
    mainHighpass
  }
})
