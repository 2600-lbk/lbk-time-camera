import { ref, type Ref } from 'vue'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import OSM from 'ol/source/OSM'
import VectorSource from 'ol/source/Vector'
import Draw, { createBox } from 'ol/interaction/Draw'
import { fromLonLat } from 'ol/proj'
import { getLength } from 'ol/sphere'
import LineString from 'ol/geom/LineString'
import type { Extent, DrawShape } from '../types'

const LUBBOCK_CENTER = fromLonLat([-101.855, 33.577])
const MAX_DIMENSION_M = 300

export function useMapDraw(containerRef: Ref<HTMLElement | null>) {
  const drawnExtent = ref<Extent | null>(null)
  const sizeError = ref<string | null>(null)

  let map: Map | null = null
  let drawInteraction: Draw | null = null
  const vectorSource = new VectorSource()

  function initMap() {
    if (!containerRef.value) return

    const vectorLayer = new VectorLayer({ source: vectorSource })

    map = new Map({
      target: containerRef.value,
      layers: [
        new TileLayer({ source: new OSM() }),
        vectorLayer,
      ],
      view: new View({
        center: LUBBOCK_CENTER,
        zoom: 16,
      }),
    })
  }

  function startDraw(shape: DrawShape) {
    if (!map) return
    removeDraw()

    const type = 'Circle'
    const geometryFunction = shape === 'box' ? createBox() : undefined

    drawInteraction = new Draw({
      source: vectorSource,
      type,
      geometryFunction,
    })

    drawInteraction.on('drawstart', () => {
      vectorSource.clear()
      drawnExtent.value = null
      sizeError.value = null
    })

    drawInteraction.on('drawend', (e) => {
      const geom = e.feature.getGeometry()!
      const ext = geom.getExtent() as Extent
      const [minX, minY, maxX, maxY] = ext
      const midY = (minY + maxY) / 2
      const midX = (minX + maxX) / 2

      const widthM = getLength(
        new LineString([[minX, midY], [maxX, midY]]),
        { projection: 'EPSG:3857' },
      )
      const heightM = getLength(
        new LineString([[midX, minY], [midX, maxY]]),
        { projection: 'EPSG:3857' },
      )

      if (widthM > MAX_DIMENSION_M || heightM > MAX_DIMENSION_M) {
        sizeError.value = `Selection is too large (${Math.round(Math.max(widthM, heightM))}m). Max is ${MAX_DIMENSION_M}m in any dimension.`
        vectorSource.clear()
        return
      }

      drawnExtent.value = ext
    })

    map.addInteraction(drawInteraction)
  }

  function clearDraw() {
    vectorSource.clear()
    drawnExtent.value = null
    sizeError.value = null
  }

  function removeDraw() {
    if (drawInteraction && map) {
      map.removeInteraction(drawInteraction)
      drawInteraction = null
    }
  }

  function destroyMap() {
    map?.dispose()
    map = null
    drawInteraction = null
  }

  return {
    drawnExtent,
    sizeError,
    initMap,
    startDraw,
    clearDraw,
    destroyMap,
  }
}
