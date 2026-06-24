import { ref } from 'vue'
import type { FetchedFrame, OutputOptions, CanvasDimensions } from '../types'

export function useVideoEncoder() {
  const progress = ref(0)
  const videoBlob = ref<Blob | null>(null)
  const isEncoding = ref(false)

  async function encode(
    frames: FetchedFrame[],
    opts: OutputOptions,
    renderFrame: (frame: FetchedFrame, canvas: HTMLCanvasElement) => void,
    dims: CanvasDimensions,
  ): Promise<void> {
    isEncoding.value = true
    progress.value = 0
    videoBlob.value = null

    const canvas = document.createElement('canvas')
    canvas.width = dims.width
    canvas.height = dims.height

    const fps = Math.ceil(frames.length / opts.durationSec)
    const frameDurationMs = (opts.durationSec * 1000) / frames.length

    // Pick the best supported MIME type
    const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
      .find((t) => MediaRecorder.isTypeSupported(t)) ?? 'video/webm'

    // Detect requestFrame() support (Chromium only)
    const stream = canvas.captureStream(0)
    const track = stream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack & {
      requestFrame?: () => void
    }
    const hasRequestFrame = typeof track.requestFrame === 'function'

    if (!hasRequestFrame) {
      // Fall back: captureStream at fixed fps, rely on interval timing
      stream.getVideoTracks()[0].stop()
      const fixedStream = canvas.captureStream(fps)
      return encodeFallback(frames, renderFrame, canvas, fixedStream, mimeType, frameDurationMs)
    }

    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 })
    const chunks: Blob[] = []
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }

    recorder.start()
    for (const frame of frames) {
      renderFrame(frame, canvas)
      track.requestFrame!()
      await delay(frameDurationMs)
      progress.value++
    }
    recorder.stop()

    await new Promise<void>((resolve) => {
      recorder.onstop = () => {
        videoBlob.value = new Blob(chunks, { type: mimeType })
        resolve()
      }
    })

    isEncoding.value = false
  }

  return { progress, videoBlob, isEncoding, encode }
}

async function encodeFallback(
  frames: FetchedFrame[],
  renderFrame: (frame: FetchedFrame, canvas: HTMLCanvasElement) => void,
  canvas: HTMLCanvasElement,
  stream: MediaStream,
  mimeType: string,
  frameDurationMs: number,
): Promise<void> {
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 })
  const chunks: Blob[] = []
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }

  recorder.start()
  for (const frame of frames) {
    renderFrame(frame, canvas)
    await delay(frameDurationMs)
  }
  recorder.stop()

  await new Promise<void>((resolve) => {
    recorder.onstop = () => resolve()
  })
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}
