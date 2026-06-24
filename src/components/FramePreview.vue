<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useFrameRenderer } from '../composables/useFrameRenderer'
import type { FetchedFrame, OutputOptions, Extent, CanvasDimensions } from '../types'

const props = defineProps<{
  frames: FetchedFrame[]
  opts: OutputOptions
  drawnExtent: Extent
  bufferedExtent: Extent
  dims: CanvasDimensions
}>()

const canvasEl = ref<HTMLCanvasElement | null>(null)
const { renderFrame } = useFrameRenderer(canvasEl)
const currentIndex = ref(0)

function render() {
  if (!props.frames.length) return
  renderFrame(
    props.frames[currentIndex.value],
    props.opts,
    props.drawnExtent,
    props.bufferedExtent,
    props.dims,
  )
}

watch(currentIndex, render)
watch(() => props.frames, () => { currentIndex.value = 0; render() }, { flush: 'post' })

onMounted(render)
</script>

<template>
  <div class="preview-wrapper">
    <canvas ref="canvasEl" class="preview-canvas"></canvas>
    <div class="nav">
      <button @click="currentIndex--" :disabled="currentIndex === 0" class="btn">←</button>
      <span class="year-label">{{ frames[currentIndex]?.year }} &nbsp;({{ currentIndex + 1 }} / {{ frames.length }})</span>
      <button @click="currentIndex++" :disabled="currentIndex === frames.length - 1" class="btn">→</button>
    </div>
  </div>
</template>

<style scoped>
.preview-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px;
}
.preview-canvas {
  max-width: 100%;
  height: auto;
  border: 1px solid #333;
  border-radius: 4px;
}
.nav {
  display: flex;
  align-items: center;
  gap: 12px;
}
.btn {
  padding: 6px 14px;
  background: #222;
  border: 1px solid #444;
  color: #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.1rem;
}
.btn:disabled { opacity: 0.35; cursor: default; }
.year-label { font-size: 1rem; min-width: 120px; text-align: center; }
</style>
