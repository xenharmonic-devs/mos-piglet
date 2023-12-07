<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

const props = defineProps<{
  magnitude: number[]
  phase: number[]
}>()

const emit = defineEmits(['update:magnitude'])

const editing = ref(false)
const svg = ref<SVGSVGElement | null>(null)

const dx = computed(() => 1 / props.magnitude.length)

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

function onMouseMove(event: MouseEvent) {
  if (!editing.value) {
    return
  }
  const { x, y } = svgCoords(event.x, event.y)
  const index = Math.max(0, Math.min(props.magnitude.length - 1, Math.floor(x / dx.value)))
  const value = Math.max(0, Math.min(1, 1 - y))
  emit('update:magnitude', index, value)
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
</script>

<template>
  <svg
    width="100%"
    height="100%"
    viewBox="-0.01 -0.01 1.02 1.02"
    xmlns="http://www.w3.org/2000/svg"
    ref="svg"
    @mousedown="editing = true"
    @mousemove="onMouseMove"
  >
    <g v-for="(m, i) of magnitude" :key="i">
      <rect :x="i * dx" :y="1 - m" :width="0.9 * dx" :height="m"></rect>
      <text :x="(i + 0.5) * dx" y="0.95">{{ i + 1 }}</text>
    </g>
  </svg>
</template>

<style scoped>
rect {
  fill: white;
  stroke: gray;
  stroke-width: 0.01;
}

rect:hover {
  fill: lightgreen;
}

text {
  user-select: none;
  font-size: 0.1px;
  text-anchor: middle;
  fill: #53a;
}
</style>
