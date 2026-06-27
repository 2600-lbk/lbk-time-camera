<script setup lang="ts">
import { useConfig } from '../composables/useConfig'

defineEmits<{ close: [] }>()

const { sources } = useConfig()
const years = sources.map(s => s.year)
</script>

<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal" role="dialog" aria-modal="true">
      <button class="close-btn" @click="$emit('close')" aria-label="Close">✕</button>

      <div class="about-header">
        <img src="/app-icon-full.png" alt="" class="about-icon" aria-hidden="true" />
        <div>
          <h2>lbk-time-camera</h2>
          <p class="tagline">Select an area of Lubbock and watch it change over time.</p>
        </div>
      </div>

      <p>
        This app uses high resolution aerial imagery from multiple years to
        generate a downloadable timelapse video of any location within Lubbock County, Texas.
      </p>
      <p>
        To begin: draw a box or circle on the map, fetch the imagery, preview the frames, and export
        a video or a ZIP of individual PNG frames.
      </p>

      <h3>Imagery</h3>
      <p>
        {{ years.length }} years are currently available: {{ years.join(', ') }}.
      </p>
      <p>
        Resolution is approximately 6.4 cm (2.6 in) per pixel across all years.
      </p>

      <h3>Special thanks</h3>
      <p>
        The <a href="https://www.mylubbock.us/318/GIS-Data-Services" target="blank">City of Lubbock GIS & Data Services
          Department</a>
        makes high-quality aerial imagery freely available to the public.
        This app would not exist without their commitment to open data.
      </p>

      <h3>Source code</h3>
      <p><a href="https://github.com/2600-lbk/lbk-time-camera/" target="_blank"
          rel="noopener">github.com/2600-lbk/lbk-time-camera</a></p>
      <p>Comments, issues, and PRs are welcome!</p>

      <h3>Built with</h3>
      <ul>
        <li><a href="https://vuejs.org" target="_blank" rel="noopener">Vue 3</a> - reactive UI framework</li>
        <li><a href="https://openlayers.org" target="_blank" rel="noopener">OpenLayers</a> - mapping, drawing, and
          ArcGIS imagery loader</li>
        <li><a href="https://www.openstreetmap.org" target="_blank" rel="noopener">OpenStreetMap</a> - base map</li>
        <li><a href="https://mediabunny.dev" target="_blank" rel="noopener">Mediabunny</a> - rendering video</li>
        <li><a href="https://stuk.github.io/jszip/" target="_blank" rel="noopener">JSZip</a> - PNG frame export</li>
      </ul>

      <button class="btn-close-bottom" @click="$emit('close')">Close</button>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 16px;
}

.modal {
  background: #1e1e1e;
  border: 1px solid #333;
  border-radius: 10px;
  padding: 28px 32px;
  max-width: 520px;
  width: 100%;
  position: relative;
  max-height: 90vh;
  overflow-y: auto;
}

.close-btn {
  position: absolute;
  top: 14px;
  right: 16px;
  background: none;
  border: none;
  color: #888;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 4px 8px;
}

.close-btn:hover {
  color: #ddd;
}

.about-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.about-icon {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

h2 {
  margin: 0 0 4px;
  font-size: 1.3rem;
}

h3 {
  margin: 20px 0 6px;
  font-size: 1rem;
  color: #ccc;
}

.tagline {
  margin: 0;
  color: #aa3bff;
  font-style: italic;
}

p {
  margin: 0 0 12px;
  color: #bbb;
  line-height: 1.6;
  font-size: 0.95rem;
}

ul {
  margin: 0;
  padding-left: 20px;
  color: #bbb;
  font-size: 0.95rem;
  line-height: 1.8;
}

a {
  color: #aa3bff;
}

.btn-close-bottom {
  margin-top: 24px;
  padding: 8px 20px;
  background: #2a2a2a;
  border: 1px solid #444;
  color: #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
}
</style>
