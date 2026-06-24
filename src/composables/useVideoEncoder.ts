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

    const fps = frames.length / opts.durationSec
    const frameDuration = opts.durationSec / frames.length

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
      keyFrameInterval: frameDuration, // every frame is a keyframe
    })
    output.addVideoTrack(videoSource, { frameRate: fps })

    try {
      await output.start()

      for (let i = 0; i < frames.length; i++) {
        renderFrame(frames[i], canvas)
        await videoSource.add(i * frameDuration, frameDuration)
        progress.value++
      }

      videoSource.close()
      await output.finalize()

      videoBlob.value = new Blob([target.buffer], { type: 'video/mp4' })
    } finally {
      isEncoding.value = false
    }
  }

  return { progress, videoBlob, isEncoding, encode }
}
