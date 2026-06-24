<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useFrameRenderer } from '../composables/useFrameRenderer'
import { useZipExport } from '../composables/useZipExport'
import type { FetchedFrame, OutputOptions, Extent, CanvasDimensions } from '../types'

const props = defineProps<{
  videoBlob: Blob
  frames: FetchedFrame[]
  opts: OutputOptions
  drawnExtent: Extent
  bufferedExtent: Extent
  dims: CanvasDimensions
}>()

const emit = defineEmits<{ backToPreview: [] }>()

const offscreenCanvas = ref<HTMLCanvasElement | null>(null)
const { renderFrameToBlob } = useFrameRenderer(offscreenCanvas)
const { isExporting, exportZip } = useZipExport()

const videoUrl = ref<string | null>(null)
const videoExt = computed(() => props.videoBlob.type === 'video/mp4' ? 'mp4' : 'webm')
const videoFilename = computed(() => `lbk-timelapse-${Date.now()}.${videoExt.value}`)

const canShare = computed(() => {
  if (!navigator.share || !navigator.canShare) return false
  const file = new File([props.videoBlob], `lbk-timelapse.${videoExt.value}`, { type: props.videoBlob.type })
  return navigator.canShare({ files: [file] })
})

onMounted(() => {
  videoUrl.value = URL.createObjectURL(props.videoBlob)
})

onBeforeUnmount(() => {
  if (videoUrl.value) URL.revokeObjectURL(videoUrl.value)
})

async function handleZipExport() {
  await exportZip(props.frames, (frame) =>
    renderFrameToBlob(frame, props.opts, props.drawnExtent, props.bufferedExtent, props.dims)
  )
}

async function handleShare() {
  const file = new File([props.videoBlob], `lbk-timelapse.${videoExt.value}`, { type: props.videoBlob.type })
  await navigator.share({ files: [file] })
}
</script>

<template>
  <div class="output-wrapper">
    <!-- offscreen canvas used only for zip rendering -->
    <canvas ref="offscreenCanvas" style="display:none"></canvas>

    <video v-if="videoUrl" :src="videoUrl" controls autoplay loop class="video-player"></video>

    <div class="actions">
      <button @click="emit('backToPreview')" class="btn btn-secondary">← Back to Preview</button>
      <a :href="videoUrl ?? ''" :download="videoFilename" class="btn btn-primary">
        Download Video
      </a>
      <button v-if="canShare" @click="handleShare" class="btn">Share</button>
      <button @click="handleZipExport" :disabled="isExporting" class="btn">
        {{ isExporting ? 'Exporting…' : 'Download PNG Frames (ZIP)' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.output-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 24px 16px;
}
.video-player {
  max-width: 100%;
  max-height: 60vh;
  border: 1px solid #333;
  border-radius: 6px;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}
.btn {
  padding: 10px 20px;
  background: #222;
  border: 1px solid #444;
  color: #ddd;
  border-radius: 6px;
  cursor: pointer;
  text-decoration: none;
  font-size: 0.95rem;
}
.btn:disabled { opacity: 0.4; cursor: default; }
.btn-primary { background: #aa3bff; border-color: #aa3bff; color: #fff; }
.btn-secondary { background: transparent; border-color: #555; }
</style>
