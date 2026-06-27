<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useFrameRenderer } from '../composables/useFrameRenderer'
import type { FetchedFrame, OutputOptions, LabelPosition, Extent, CanvasDimensions } from '../types'

const props = defineProps<{
  frames: FetchedFrame[]
  opts: OutputOptions
  drawnExtent: Extent
  bufferedExtent: Extent
  dims: CanvasDimensions
}>()
const emit = defineEmits<{ 'update:opts': [opts: OutputOptions] }>()

function update(patch: Partial<OutputOptions>) {
  emit('update:opts', { ...props.opts, ...patch })
}

const LABEL_POSITIONS: { value: LabelPosition; label: string }[] = [
  { value: 'top-left', label: 'Top left' },
  { value: 'top-center', label: 'Top center' },
  { value: 'top-right', label: 'Top right' },
  { value: 'center', label: 'Center' },
  { value: 'bottom-left', label: 'Bottom left' },
  { value: 'bottom-center', label: 'Bottom center' },
  { value: 'bottom-right', label: 'Bottom right' },
  { value: 'none', label: 'None' },
]

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
watch(() => [props.opts.labelPosition, props.opts.fontSize], render)
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

    <div class="label-options">
      <div class="field">
        <span class="field-label">Year Label Position</span>
        <select
          :value="opts.labelPosition"
          @change="update({ labelPosition: ($event.target as HTMLSelectElement).value as LabelPosition })"
        >
          <option v-for="p in LABEL_POSITIONS" :key="p.value" :value="p.value">{{ p.label }}</option>
        </select>
      </div>
      <div class="field" :class="{ disabled: opts.labelPosition === 'none' }">
        <span class="field-label">Label Font Size: {{ opts.fontSize }}px</span>
        <input
          type="range"
          min="24"
          max="180"
          :value="opts.fontSize"
          :disabled="opts.labelPosition === 'none'"
          @input="update({ fontSize: +($event.target as HTMLInputElement).value })"
        />
      </div>
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
.label-options {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
  width: 100%;
  max-width: 420px;
}
.field { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 160px; }
.field.disabled { opacity: 0.4; }
.field-label { font-size: 0.8rem; color: #aaa; }
.label-options input[type="range"] { width: 100%; accent-color: #aa3bff; }
.label-options select {
  background: #222;
  color: #ddd;
  border: 1px solid #444;
  padding: 6px 10px;
  border-radius: 4px;
}
</style>
