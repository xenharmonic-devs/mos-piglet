import { reactive, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import {
  UnisonSynth,
  type UnisonVoiceParams,
  type BufferVoiceParams,
  BufferSynth,
  type VoiceBaseParams,
  type BufferFactory,
  Synth
} from 'sw-synth'

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
  const unisonSynth = ref<UnisonSynth | null>(null)
  const bufferSynth = ref<BufferSynth | null>(null)

  const synth = ref<Synth | null>(null)

  // Synth params
  const maxPolyphony = ref(6)
  // const synthVoiceParams = reactive<AperiodicVoiceParams>({
  const synthVoiceParams = reactive<VoiceBaseParams>({
    audioDelay,
    attackTime: 0.01,
    decayTime: 0.3,
    sustainLevel: 0.8,
    releaseTime: 0.01
  })

  const oscillatorType = ref<OscillatorType>('sawtooth')
  const oscillatorPeriodicWave = ref<PeriodicWave | undefined>(undefined)

  const unisonSpread = ref(3)
  const unisonStackSize = ref(5)

  const bufferFactory = ref<BufferFactory>(() => {
    throw new Error('No factory available')
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

    unisonSynth.value = new UnisonSynth(context.value, audioDestination)
    unisonSynth.value.maxPolyphony = maxPolyphony.value
    synth.value = unisonSynth.value

    bufferSynth.value = new BufferSynth(context.value, audioDestination)
    // TODO: Negotiate voice allocation based on active synth
    bufferSynth.value.maxPolyphony = maxPolyphony.value
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

  watch(
    [unisonSynth, oscillatorType, oscillatorPeriodicWave, unisonSpread, unisonStackSize],
    ([unison, type, periodicWave, spread, stackSize]) => {
      if (!unison) {
        return
      }
      const voiceParams: UnisonVoiceParams = {
        ...synthVoiceParams,
        type,
        periodicWave,
        spread,
        stackSize
      }
      unison.voiceParams = voiceParams
    }
  )

  watch([bufferSynth, bufferFactory], ([bs, factory]) => {
    if (!bs) {
      return
    }
    const voiceParams: BufferVoiceParams = { ...synthVoiceParams, factory }
    bs.voiceParams = voiceParams
  })

  return {
    initialize,
    unintialize,
    context,
    mainVolume,
    maxPolyphony,
    synthVoiceParams,
    oscillatorType,
    oscillatorPeriodicWave,
    unisonSpread,
    unisonStackSize,
    bufferFactory,
    synth,

    // Add to state but not intended for mutation
    mainGain,
    mainLowpass,
    mainHighpass,
    unisonSynth,
    bufferSynth
  }
})
