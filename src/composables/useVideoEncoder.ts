import { ref } from 'vue'
import {
  Output,
  Mp4OutputFormat,
  BufferTarget,
  CanvasSource,
  getFirstEncodableVideoCodec,
} from 'mediabunny'
import type { FetchedFrame, OutputOptions, CanvasDimensions } from '../types'

export async function checkVideoEncoderSupport(): Promise<boolean> {
  try {
    const codec = await getFirstEncodableVideoCodec(['avc', 'vp9', 'av1'])
    return codec !== null
  } catch {
    return false
  }
}

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

    const CROSSFADE_STEPS = 10 
    const CROSSFADE_FRACTION = 0.4

    const frameDuration = opts.durationSec / frames.length
    const holdDuration = frameDuration * (1 - CROSSFADE_FRACTION)
    const stepDuration = (frameDuration * CROSSFADE_FRACTION) / CROSSFADE_STEPS
    const fps = Math.ceil(1 / stepDuration)

    const codec = await getFirstEncodableVideoCodec(['avc', 'vp9', 'av1'], {
      width: dims.width,
      height: dims.height,
      bitrate: 8_000_000,
    })
    if (!codec) throw new Error('No supported video codec found')

    const target = new BufferTarget()
    const output = new Output({ format: new Mp4OutputFormat(), target })

    const videoSource = new CanvasSource(canvas, {
      codec,
      bitrate: 8_000_000,
      keyFrameInterval: frameDuration,
    })
    output.addVideoTrack(videoSource, { frameRate: fps })

    try {
      await output.start()

      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = dims.width
      tempCanvas.height = dims.height
      const ctx = canvas.getContext('2d')!

      let t = 0
      for (let i = 0; i < frames.length; i++) {
        const isLast = i === frames.length - 1
        renderFrame(frames[i], canvas)
        await videoSource.add(t, isLast ? frameDuration : holdDuration)
        t += isLast ? frameDuration : holdDuration
        progress.value++

        if (!isLast) {
          // Pre-render next frame into tempCanvas, then alpha-composite for each step
          renderFrame(frames[i + 1], tempCanvas)
          for (let step = 0; step < CROSSFADE_STEPS; step++) {
            renderFrame(frames[i], canvas)
            ctx.globalAlpha = (step + 1) / CROSSFADE_STEPS
            ctx.drawImage(tempCanvas, 0, 0)
            ctx.globalAlpha = 1
            await videoSource.add(t, stepDuration)
            t += stepDuration
          }
        }
      }

      videoSource.close()
      await output.finalize()

      if (!target.buffer) throw new Error('Encoding produced no output')
      videoBlob.value = new Blob([target.buffer], { type: 'video/mp4' })
    } finally {
      isEncoding.value = false
    }
  }

  return { progress, videoBlob, isEncoding, encode }
}
