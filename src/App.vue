<script setup lang="ts">
import { ref, computed } from 'vue'
import AppToolbar from './components/AppToolbar.vue'
import OptionsPanel from './components/OptionsPanel.vue'
import MapView from './components/MapView.vue'
import FramePreview from './components/FramePreview.vue'
import ProgressBar from './components/ProgressBar.vue'
import VideoOutput from './components/VideoOutput.vue'
import AboutModal from './components/AboutModal.vue'
import { useConfig } from './composables/useConfig'
import { useImageFetch, bufferExtentToAspect } from './composables/useImageFetch'
import { useVideoEncoder } from './composables/useVideoEncoder'
import { useFrameRenderer } from './composables/useFrameRenderer'
import { defaultOptions, computeDims } from './types'
import type { AppStep, Extent } from './types'

const { sources } = useConfig()

const step = ref<AppStep>('options')
const opts = ref(defaultOptions())
const drawnExtent = ref<Extent | null>(null)
const bufferedExtent = ref<Extent | null>(null)
const dims = computed(() => computeDims(opts.value))
const showAbout = ref(false)

const { frames, progress: fetchProgress, fetchError, fetchAllFrames, revokeFrames } =
  useImageFetch()
const { videoBlob, progress: encodeProgress, encode } = useVideoEncoder()

const encoderCanvas = ref<HTMLCanvasElement | null>(null)
const { renderFrame } = useFrameRenderer(encoderCanvas)

async function onGeometryDrawn(payload: { extent: Extent }) {
  const aspect = dims.value.width / dims.value.height
  drawnExtent.value = payload.extent
  bufferedExtent.value = bufferExtentToAspect(payload.extent, aspect)
  step.value = 'fetching'
  await fetchAllFrames(sources, bufferedExtent.value, dims.value)
  if (frames.value.length > 0) step.value = 'preview'
}

async function startEncoding() {
  if (!drawnExtent.value || !bufferedExtent.value) return
  step.value = 'encoding'
  const d = drawnExtent.value
  const b = bufferedExtent.value
  const o = opts.value
  const dm = dims.value
  await encode(
    frames.value,
    o,
    (frame, canvas) => {
      encoderCanvas.value = canvas
      renderFrame(frame, o, d, b, dm)
    },
    dm,
  )
  step.value = 'done'
}

function resetAll() {
  revokeFrames()
  step.value = 'options'
  opts.value = defaultOptions()
  drawnExtent.value = null
  bufferedExtent.value = null
  videoBlob.value = null
}
</script>

<template>
  <div id="app-layout">
    <canvas ref="encoderCanvas" style="display:none; position:absolute; pointer-events:none"></canvas>

    <AppToolbar
      :step="step"
      @about="showAbout = true"
      @start-over="resetAll"
    />

    <main>
      <OptionsPanel
        v-if="step === 'options'"
        v-model="opts"
        :source-count="sources.length"
        @next="step = 'draw'"
      />

      <MapView
        v-if="step === 'draw'"
        :shape="opts.drawShape"
        @geometry-drawn="onGeometryDrawn"
      />

      <div v-if="step === 'fetching'" class="center-content">
        <ProgressBar
          :value="fetchProgress"
          :max="sources.length"
          label="Fetching imagery"
        />
        <p v-if="fetchError" class="error-text">{{ fetchError }}</p>
      </div>

      <template v-if="step === 'preview' && drawnExtent && bufferedExtent">
        <FramePreview
          :frames="frames"
          :opts="opts"
          :drawn-extent="drawnExtent"
          :buffered-extent="bufferedExtent"
          :dims="dims"
        />
        <div class="preview-actions">
          <button v-if="videoBlob" class="btn-primary" @click="step = 'done'">View Generated Video →</button>
          <button v-else class="btn-primary" @click="startEncoding">Generate Video →</button>
        </div>
      </template>

      <div v-if="step === 'encoding'" class="center-content">
        <ProgressBar
          :value="encodeProgress"
          :max="frames.length"
          label="Encoding video"
        />
      </div>

      <VideoOutput
        v-if="step === 'done' && videoBlob && drawnExtent && bufferedExtent"
        :video-blob="videoBlob"
        :frames="frames"
        :opts="opts"
        :drawn-extent="drawnExtent"
        :buffered-extent="bufferedExtent"
        :dims="dims"
        @back-to-preview="step = 'preview'"
      />
    </main>

    <AboutModal v-if="showAbout" @close="showAbout = false" />
  </div>
</template>

<style scoped>
#app-layout {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;
}
main {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
.center-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 16px;
}
.error-text {
  color: #ff8888;
  font-size: 0.9rem;
}
.preview-actions {
  display: flex;
  justify-content: center;
  padding: 16px;
}
.btn-primary {
  padding: 12px 28px;
  background: #aa3bff;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
}
</style>
