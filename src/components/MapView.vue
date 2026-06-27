<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useMapDraw } from '../composables/useMapDraw'
import { bufferExtentToAspect } from '../composables/useImageFetch'
import { computeDims } from '../types'
import type { OutputOptions, AspectRatio, ResolutionPreset, DrawShape, Extent } from '../types'

const props = defineProps<{ modelValue: OutputOptions }>()
const emit = defineEmits<{
  'update:modelValue': [opts: OutputOptions]
  geometryDrawn: [payload: { extent: Extent }]
  cleared: []
}>()

function update(patch: Partial<OutputOptions>) {
  emit('update:modelValue', { ...props.modelValue, ...patch })
}

const SHAPES: { value: DrawShape; label: string }[] = [
  { value: 'box', label: 'Box' },
  { value: 'circle', label: 'Circle' },
]
const ASPECT_RATIOS: AspectRatio[] = ['1:1', '4:3', '16:9', '9:16']
const RESOLUTIONS: { value: ResolutionPreset; label: string }[] = [
  { value: 'mobile', label: 'Mobile (1080px)' },
  { value: 'hd', label: 'HD (1920px)' },
]

const mapEl = ref<HTMLDivElement | null>(null)
const { drawnExtent, initMap, startDraw, clearDraw, setFrame, destroyMap } = useMapDraw(mapEl)

// Show the captured frame (selection expanded to the chosen aspect ratio) before confirming.
watch([drawnExtent, () => props.modelValue.aspectRatio], () => {
  if (!drawnExtent.value) {
    setFrame(null)
    return
  }
  const dims = computeDims(props.modelValue)
  setFrame(bufferExtentToAspect(drawnExtent.value, dims.width / dims.height))
})

const drawHint = computed(() =>
  props.modelValue.drawShape === 'circle'
    ? 'Click to place the center, then click again to set the radius'
    : 'Click to start a corner, then click again to finish the rectangle'
)

function confirm() {
  if (drawnExtent.value) emit('geometryDrawn', { extent: drawnExtent.value })
}

function handleClear() {
  clearDraw()
  emit('cleared')
}

watch(() => props.modelValue.drawShape, (shape) => {
  clearDraw()
  startDraw(shape)
})

onMounted(() => {
  initMap()
  startDraw(props.modelValue.drawShape)
})

onBeforeUnmount(() => {
  destroyMap()
})
</script>

<template>
  <div class="map-wrapper">
    <div ref="mapEl" class="map-container"></div>
    <p class="map-hint">{{ drawHint }}</p>
    <div class="draw-options">
      <div class="field">
        <span class="field-label">Shape</span>
        <div class="radio-group">
          <label v-for="s in SHAPES" :key="s.value">
            <input
              type="radio"
              :value="s.value"
              :checked="modelValue.drawShape === s.value"
              @change="update({ drawShape: s.value })"
            />
            {{ s.label }}
          </label>
        </div>
      </div>
      <div class="field">
        <span class="field-label">Aspect</span>
        <div class="radio-group">
          <label v-for="ar in ASPECT_RATIOS" :key="ar">
            <input
              type="radio"
              :value="ar"
              :checked="modelValue.aspectRatio === ar"
              @change="update({ aspectRatio: ar })"
            />
            {{ ar }}
          </label>
        </div>
      </div>
      <div class="field">
        <span class="field-label">Resolution</span>
        <div class="radio-group">
          <label v-for="r in RESOLUTIONS" :key="r.value">
            <input
              type="radio"
              :value="r.value"
              :checked="modelValue.resolution === r.value"
              @change="update({ resolution: r.value })"
            />
            {{ r.label }}
          </label>
        </div>
      </div>
    </div>
    <div class="map-controls">
      <button @click="handleClear" :disabled="!drawnExtent" class="btn">Clear</button>
      <button @click="confirm" :disabled="!drawnExtent" class="btn btn-primary">Confirm Area</button>
    </div>
  </div>
</template>

<style scoped>
.map-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.map-container {
  flex: 1;
  min-height: 400px;
}
.map-hint {
  margin: 0;
  padding: 5px 12px;
  color: #888;
  font-size: 0.8rem;
}
.draw-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  padding: 8px 12px;
  background: #1a1a1a;
  border-top: 1px solid #333;
}
.field { display: flex; flex-direction: column; gap: 4px; }
.field-label { font-size: 0.75rem; color: #888; }
.radio-group { display: flex; flex-wrap: wrap; gap: 12px; }
.radio-group label { display: flex; align-items: center; gap: 4px; cursor: pointer; font-size: 0.85rem; }
.radio-group input { accent-color: #aa3bff; }
.map-controls {
  padding: 8px 12px;
  display: flex;
  gap: 8px;
  background: #1a1a1a;
  border-top: 1px solid #333;
}
.btn {
  padding: 6px 14px;
  cursor: pointer;
  border: 1px solid #444;
  background: #2a2a2a;
  color: #ddd;
  border-radius: 4px;
}
.btn:disabled {
  opacity: 0.4;
  cursor: default;
}
.btn-primary {
  background: #aa3bff;
  border-color: #aa3bff;
  color: #fff;
  margin-left: auto;
}
</style>
