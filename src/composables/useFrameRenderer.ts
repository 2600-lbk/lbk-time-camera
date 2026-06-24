import type { Ref } from 'vue'
import type { FetchedFrame, OutputOptions, Extent, CanvasDimensions, LabelPosition } from '../types'

export function useFrameRenderer(canvasRef: Ref<HTMLCanvasElement | null>) {
  function renderFrame(
    frame: FetchedFrame,
    opts: OutputOptions,
    drawnExtent: Extent,
    bufferedExtent: Extent,
    dims: CanvasDimensions,
  ): void {
    const canvas = canvasRef.value
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    canvas.width = dims.width
    canvas.height = dims.height

    ctx.drawImage(frame.imageBitmap, 0, 0, dims.width, dims.height)
    drawVignette(ctx, drawnExtent, bufferedExtent, dims, opts)
    if (opts.labelPosition !== 'none') {
      drawLabel(ctx, String(frame.year), opts.labelPosition, opts.fontSize, dims)
    }
    drawWatermark(ctx, opts.labelPosition, dims)
  }

  async function renderFrameToBlob(
    frame: FetchedFrame,
    opts: OutputOptions,
    drawnExtent: Extent,
    bufferedExtent: Extent,
    dims: CanvasDimensions,
  ): Promise<Blob> {
    renderFrame(frame, opts, drawnExtent, bufferedExtent, dims)
    return new Promise<Blob>((resolve, reject) => {
      canvasRef.value!.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('toBlob returned null'))),
        'image/png',
      )
    })
  }

  return { renderFrame, renderFrameToBlob }
}

/** Map a value from one range to another. */
function mapRange(value: number, fromMin: number, fromMax: number, toMin: number, toMax: number) {
  return toMin + ((value - fromMin) / (fromMax - fromMin)) * (toMax - toMin)
}

function selectionPixels(
  drawnExtent: Extent,
  bufferedExtent: Extent,
  W: number,
  H: number,
): { left: number; top: number; right: number; bottom: number; cx: number; cy: number; rx: number; ry: number } {
  const [bMinX, bMinY, bMaxX, bMaxY] = bufferedExtent
  const [dMinX, dMinY, dMaxX, dMaxY] = drawnExtent

  // Map map-space coords to canvas pixels (Y flipped: map Y↑, canvas Y↓)
  const left   = mapRange(dMinX, bMinX, bMaxX, 0, W)
  const right  = mapRange(dMaxX, bMinX, bMaxX, 0, W)
  const top    = mapRange(dMaxY, bMinY, bMaxY, H, 0) // note: H→0 to flip Y
  const bottom = mapRange(dMinY, bMinY, bMaxY, H, 0)

  return {
    left, top, right, bottom,
    cx: (left + right) / 2,
    cy: (top + bottom) / 2,
    rx: (right - left) / 2,
    ry: (bottom - top) / 2,
  }
}

function drawVignette(
  ctx: CanvasRenderingContext2D,
  drawnExtent: Extent,
  bufferedExtent: Extent,
  dims: CanvasDimensions,
  opts: OutputOptions,
): void {
  const { width: W, height: H } = dims
  const sel = selectionPixels(drawnExtent, bufferedExtent, W, H)

  ctx.save()
  ctx.fillStyle = 'rgba(0,0,0,0.45)'
  ctx.beginPath()
  // Outer rect (clockwise)
  ctx.rect(0, 0, W, H)
  // Inner hole (counter-clockwise = punches out)
  if (opts.drawShape === 'circle') {
    ctx.arc(sel.cx, sel.cy, Math.min(sel.rx, sel.ry), 0, Math.PI * 2, true)
  } else {
    // counter-clockwise rect
    ctx.moveTo(sel.left, sel.top)
    ctx.lineTo(sel.left, sel.bottom)
    ctx.lineTo(sel.right, sel.bottom)
    ctx.lineTo(sel.right, sel.top)
    ctx.closePath()
  }
  ctx.fill('evenodd')
  ctx.restore()
}

const LABEL_PADDING = 24

function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  position: Exclude<LabelPosition, 'none'>,
  fontSize: number,
  dims: CanvasDimensions,
): void {
  const { width: W, height: H } = dims
  ctx.save()
  ctx.font = `bold ${fontSize}px system-ui, sans-serif`
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = 'white'
  ctx.shadowColor = 'rgba(0,0,0,0.85)'
  ctx.shadowBlur = fontSize * 0.15

  const metrics = ctx.measureText(text)
  const textW = metrics.width

  let x: number
  let y: number

  switch (position) {
    case 'top-left':     x = LABEL_PADDING;             y = LABEL_PADDING + fontSize;        break
    case 'top-center':   x = (W - textW) / 2;           y = LABEL_PADDING + fontSize;        break
    case 'top-right':    x = W - textW - LABEL_PADDING;  y = LABEL_PADDING + fontSize;        break
    case 'center':       x = (W - textW) / 2;           y = H / 2 + fontSize / 3;           break
    case 'bottom-left':  x = LABEL_PADDING;             y = H - LABEL_PADDING;               break
    case 'bottom-center':x = (W - textW) / 2;           y = H - LABEL_PADDING;               break
    case 'bottom-right': x = W - textW - LABEL_PADDING;  y = H - LABEL_PADDING;               break
  }

  ctx.fillText(text, x, y)
  ctx.restore()
}

const WATERMARK_TEXT = 'lbk-time-camera'

function drawWatermark(
  ctx: CanvasRenderingContext2D,
  labelPosition: LabelPosition,
  dims: CanvasDimensions,
): void {
  const { width: W, height: H } = dims
  const fontSize = Math.max(16, Math.round(Math.min(W, H) * 0.018))
  const pad = Math.round(fontSize * 0.75)

  ctx.save()
  ctx.font = `${fontSize}px system-ui, sans-serif`
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.shadowColor = 'rgba(0,0,0,0.7)'
  ctx.shadowBlur = fontSize * 0.3

  // Place watermark in bottom-left by default; shift to top-left if label is there
  const inBottomLeft = labelPosition === 'bottom-left'
  const x = pad
  const y = inBottomLeft ? pad + fontSize : H - pad

  ctx.fillText(WATERMARK_TEXT, x, y)
  ctx.restore()
}
