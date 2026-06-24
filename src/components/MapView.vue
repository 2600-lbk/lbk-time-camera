<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useMapDraw } from '../composables/useMapDraw'
import type { DrawShape, Extent } from '../types'

const props = defineProps<{ shape: DrawShape }>()
const emit = defineEmits<{
  geometryDrawn: [payload: { extent: Extent }]
  cleared: []
}>()

const mapEl = ref<HTMLDivElement | null>(null)
const { drawnExtent, sizeError, initMap, startDraw, clearDraw, destroyMap } = useMapDraw(mapEl)

function confirm() {
  if (drawnExtent.value) emit('geometryDrawn', { extent: drawnExtent.value })
}

function handleClear() {
  clearDraw()
  emit('cleared')
}

watch(() => props.shape, (shape) => {
  clearDraw()
  startDraw(shape)
})

onMounted(() => {
  initMap()
  startDraw(props.shape)
})

onBeforeUnmount(() => {
  destroyMap()
})
</script>

<template>
  <div class="map-wrapper">
    <div ref="mapEl" class="map-container"></div>
    <p v-if="sizeError" class="size-error">{{ sizeError }}</p>
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
.size-error {
  margin: 0;
  padding: 6px 12px;
  background: #5c1a1a;
  color: #ffaaaa;
  font-size: 0.85rem;
}
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
