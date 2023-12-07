<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

const props = defineProps<{
  waveform: number[]
}>()

const emit = defineEmits(['update:waveform'])

const editing = ref(false)
const svg = ref<SVGSVGElement | null>(null)

const dx = computed(() => 1 / props.waveform.length)

const points = computed(() => {
  const ps: string[] = []
  for (let i = 0; i < props.waveform.length; ++i) {
    ps.push(`${i * dx.value},${-props.waveform[i]}`)
  }
  return ps.join(' ')
})

let pt: DOMPoint | null = null

function svgCoords(x: number, y: number) {
  if (svg.value === null) {
    throw new Error('Missing SVG element')
  }
  if (pt === null) {
    pt = svg.value.createSVGPoint()
  }
  pt.x = x
  pt.y = y
  const ctm = svg.value.getScreenCTM()
  if (!ctm) {
    throw new Error('Unable to calculate coordinates')
  }
  return pt.matrixTransform(ctm.inverse())
}

// TODO: Affect everything on a line from last point
function onMouseMove(event: MouseEvent) {
  if (!editing.value) {
    return
  }
  const { x, y } = svgCoords(event.x, event.y)
  const index = Math.max(0, Math.min(props.waveform.length - 1, Math.floor(x / dx.value)))
  const value = -y
  emit('update:waveform', index, value)
}

function stopEditing() {
  editing.value = false
}

onMounted(() => {
  window.addEventListener('mouseup', stopEditing)
})

onUnmounted(() => {
  window.removeEventListener('mouseup', stopEditing)
})

// TODO: Preserve aspect ratio so that the lines don't look horrible.
</script>

<template>
  <svg
    width="100%"
    height="100%"
    viewBox="-0.01 -1.5 1.02 3"
    preserveAspectRatio="none"
    xmlns="http://www.w3.org/2000/svg"
    ref="svg"
    @mousedown="editing = true"
    @mousemove="onMouseMove"
  >
    <line x1="0" y1="0" x2="1" y2="0"></line>
    <line x1="0" y1="1" x2="1" y2="1"></line>
    <line x1="0" y1="-1" x2="1" y2="-1"></line>
    <polyline :points="points"></polyline>
  </svg>
</template>

<style scoped>
line {
  fill: none;
  stroke: green;
  stroke-width: 0.01;
}
polyline {
  fill: none;
  stroke: red;
  stroke-width: 0.02;
}
</style>
