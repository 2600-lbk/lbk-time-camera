import { ref } from 'vue'
import ImageArcGISRest from 'ol/source/ImageArcGISRest'
import { get as getProjection } from 'ol/proj'
import type { Extent, ImageSource, FetchedFrame, CanvasDimensions } from '../types'

/** Expand extent to match the target aspect ratio, always expanding (never cropping). */
export function bufferExtentToAspect(extent: Extent, targetAspect: number): Extent {
  const [minX, minY, maxX, maxY] = extent
  const w = maxX - minX
  const h = maxY - minY
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2

  if (w / h > targetAspect) {
    const newH = w / targetAspect
    return [minX, cy - newH / 2, maxX, cy + newH / 2]
  } else {
    const newW = h * targetAspect
    return [cx - newW / 2, minY, cx + newW / 2, maxY]
  }
}

export function useImageFetch() {
  const frames = ref<FetchedFrame[]>([])
  const progress = ref(0)
  const fetchError = ref<string | null>(null)
  const isFetching = ref(false)

  async function fetchAllFrames(
    sources: ImageSource[],
    bufferedExtent: Extent,
    dims: CanvasDimensions,
    concurrency = 3,
  ): Promise<void> {
    frames.value = []
    progress.value = 0
    fetchError.value = null
    isFetching.value = true

    const proj = getProjection('EPSG:3857')!
    const extentWidth = bufferedExtent[2] - bufferedExtent[0]
    const resolution = extentWidth / dims.width

    const results: (FetchedFrame | null)[] = new Array(sources.length).fill(null)
    const queue = sources.map((source, index) => ({ source, index }))
    let active = 0

    await new Promise<void>((resolve) => {
      function tryNext() {
        while (active < concurrency && queue.length > 0) {
          const { source, index } = queue.shift()!
          active++
          fetchOne(source, bufferedExtent, resolution, proj, dims)
            .then((frame) => {
              results[index] = frame
            })
            .catch(() => {
              results[index] = null
              if (!fetchError.value) {
                fetchError.value = `Failed to load ${source.year}`
              }
            })
            .finally(() => {
              progress.value++
              active--
              if (queue.length === 0 && active === 0) resolve()
              else tryNext()
            })
        }
      }
      tryNext()
    })

    frames.value = results.filter((f): f is FetchedFrame => f !== null)
    isFetching.value = false
  }

  function revokeFrames() {
    frames.value.forEach((f) => f.imageBitmap.close())
    frames.value = []
  }

  return { frames, progress, fetchError, isFetching, fetchAllFrames, revokeFrames }
}

function fetchOne(
  source: ImageSource,
  extent: Extent,
  resolution: number,
  proj: ReturnType<typeof getProjection>,
  dims: CanvasDimensions,
): Promise<FetchedFrame> {
  return new Promise<FetchedFrame>((resolve, reject) => {
    let capturedBitmap: ImageBitmap | null = null

    const arcgisSource = new ImageArcGISRest({
      url: `https://pubgis.ci.lubbock.tx.us/server/rest/services/Imagery/${source.layer}/ImageServer/`,
      params: { FORMAT: 'PNG', TRANSPARENT: 'FALSE' },
      imageLoadFunction: async (imageWrapper, src) => {
        try {
          const fixedSrc = src.replace(/SIZE=[^&]+/i, `SIZE=${dims.width}%2C${dims.height}`)
          const res = await fetch(fixedSrc)
          const contentType = res.headers.get('content-type') ?? ''
          if (!contentType.includes('image')) {
            throw new Error(`Unexpected content-type: ${contentType}`)
          }
          const blob = await res.blob()
          capturedBitmap = await createImageBitmap(blob)
          // Set src so OL's load/error listeners fire on the underlying <img>
          ;(imageWrapper.getImage() as HTMLImageElement).src = URL.createObjectURL(blob)
        } catch (err) {
          reject(err)
        }
      },
    })

    arcgisSource.on('imageloadend', () => {
      if (capturedBitmap) {
        resolve({ year: source.year, imageBitmap: capturedBitmap })
      } else {
        reject(new Error(`No bitmap captured for ${source.year}`))
      }
    })

    arcgisSource.on('imageloaderror', () => {
      reject(new Error(`Image load error for ${source.year}`))
    })

    // getImage() creates the ImageWrapper but doesn't start loading —
    // OL's renderer normally calls image.load(). Do it ourselves here.
    const image = arcgisSource.getImage(extent, resolution, 1, proj!)
    image?.load()
  })
}
