export type AppStep = 'options' | 'draw' | 'fetching' | 'preview' | 'encoding' | 'done'

export type AspectRatio = '1:1' | '4:3' | '16:9' | '9:16'

export type ResolutionPreset = 'hd' | 'mobile'

export type LabelPosition =
  | 'top-left' | 'top-center' | 'top-right'
  | 'center'
  | 'bottom-left' | 'bottom-center' | 'bottom-right'
  | 'none'

export type DrawShape = 'circle' | 'box'

/** [minX, minY, maxX, maxY] in EPSG:3857 */
export type Extent = [number, number, number, number]

export interface OutputOptions {
  aspectRatio: AspectRatio
  resolution: ResolutionPreset
  durationSec: number
  labelPosition: LabelPosition
  fontSize: number
  drawShape: DrawShape
}

export interface ImageSource {
  year: number
  layer: string
  pixelSizeX: number
  pixelSizeY: number
}

export interface AppConfig {
  base_url: string
  sources: ImageSource[]
}

export interface FetchedFrame {
  year: number
  imageBitmap: ImageBitmap
}

export interface CanvasDimensions {
  width: number
  height: number
}

const LONG_EDGE: Record<ResolutionPreset, number> = { hd: 1920, mobile: 1080 }

export function computeDims(opts: OutputOptions): CanvasDimensions {
  const longEdge = LONG_EDGE[opts.resolution]
  const [wRatio, hRatio] = opts.aspectRatio.split(':').map(Number)
  if (wRatio >= hRatio) {
    return { width: longEdge, height: Math.round(longEdge * hRatio / wRatio) }
  } else {
    return { height: longEdge, width: Math.round(longEdge * wRatio / hRatio) }
  }
}

export function defaultOptions(): OutputOptions {
  return {
    aspectRatio: '1:1',
    resolution: 'mobile',
    durationSec: 11,
    labelPosition: 'top-center',
    fontSize: 72,
    drawShape: 'box',
  }
}
