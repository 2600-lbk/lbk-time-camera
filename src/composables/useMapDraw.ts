import { ref, type Ref } from 'vue'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import OSM from 'ol/source/OSM'
import VectorSource from 'ol/source/Vector'
import Draw, { createBox } from 'ol/interaction/Draw'
import { fromLonLat } from 'ol/proj'
import GeoJSON from 'ol/format/GeoJSON'
import { getVectorContext } from 'ol/render'
import Fill from 'ol/style/Fill'
import Style from 'ol/style/Style'
import type RenderEvent from 'ol/render/Event'
import type { Extent, DrawShape } from '../types'
import countyGeoJSON from '../assets/lubbock_county_line.geojson'

const LUBBOCK_CENTER = fromLonLat([-101.855, 33.577])

export function useMapDraw(containerRef: Ref<HTMLElement | null>) {
  const drawnExtent = ref<Extent | null>(null)

  let map: Map | null = null
  let drawInteraction: Draw | null = null
  const vectorSource = new VectorSource()

  function initMap() {
    if (!containerRef.value) return

    const countySource = new VectorSource({
      features: new GeoJSON().readFeatures(countyGeoJSON, { featureProjection: 'EPSG:3857' }),
    })

    const osmLayer = new TileLayer({
      className: 'ol-layer-osm',
      source: new OSM(),
    })
    osmLayer.setExtent(countySource.getExtent() ?? undefined)

    const clipStyle = new Style({ fill: new Fill({ color: 'black' }) })
    osmLayer.on('postrender', (e) => {
      const event = e as RenderEvent
      const ctx = event.context as CanvasRenderingContext2D
      const vectorContext = getVectorContext(event)
      ctx.globalCompositeOperation = 'destination-in'
      countySource.forEachFeature((f) => vectorContext.drawFeature(f, clipStyle))
      ctx.globalCompositeOperation = 'source-over'
    })

    const vectorLayer = new VectorLayer({ source: vectorSource })

    map = new Map({
      target: containerRef.value,
      layers: [osmLayer, vectorLayer],
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
    })

    drawInteraction.on('drawend', (e) => {
      const geom = e.feature.getGeometry()!
      drawnExtent.value = geom.getExtent() as Extent
    })

    map.addInteraction(drawInteraction)
  }

  function clearDraw() {
    vectorSource.clear()
    drawnExtent.value = null
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
    initMap,
    startDraw,
    clearDraw,
    destroyMap,
  }
}
