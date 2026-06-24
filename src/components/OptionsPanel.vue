<script setup lang="ts">
import { computed } from 'vue'
import type { OutputOptions, AspectRatio, ResolutionPreset, LabelPosition, DrawShape } from '../types'

const props = defineProps<{ modelValue: OutputOptions; sourceCount: number }>()
const emit = defineEmits<{
  'update:modelValue': [opts: OutputOptions]
  next: []
}>()

function update(patch: Partial<OutputOptions>) {
  emit('update:modelValue', { ...props.modelValue, ...patch })
}

const frameDurationMs = computed(() =>
  Math.round((props.modelValue.durationSec * 1000) / props.sourceCount)
)

const ASPECT_RATIOS: AspectRatio[] = ['1:1', '4:3', '16:9', '9:16']
const RESOLUTIONS: { value: ResolutionPreset; label: string }[] = [
  { value: 'hd', label: 'HD (1920px long edge)' },
  { value: 'mobile', label: 'Mobile (1080px long edge)' },
]
const LABEL_POSITIONS: { value: LabelPosition; label: string }[] = [
  { value: 'top-left', label: 'Top left' },
  { value: 'top-center', label: 'Top center' },
  { value: 'top-right', label: 'Top right' },
  { value: 'center', label: 'Center' },
  { value: 'bottom-left', label: 'Bottom left' },
  { value: 'bottom-center', label: 'Bottom center' },
  { value: 'bottom-right', label: 'Bottom right' },
  { value: 'none', label: 'None' },
]
const SHAPES: { value: DrawShape; label: string }[] = [
  { value: 'box', label: 'Box' },
  { value: 'circle', label: 'Circle' },
]
</script>

<template>
  <div class="options-panel">
    <div class="intro">
      <h2>lbk-time-camera</h2>
      <p>Pick an area of Lubbock on the map and watch it change over the years — then download a timelapse video to keep or share.</p>
    </div>

    <section>
      <label class="field-label">Aspect Ratio</label>
      <div class="radio-group">
        <label v-for="ar in ASPECT_RATIOS" :key="ar">
          <input
            type="radio"
            :value="ar"
            :checked="modelValue.aspectRatio === ar"
            @change="update({ aspectRatio: ar })"
          />
          {{ ar }}
        </label>
      </div>
    </section>

    <section>
      <label class="field-label">Output Resolution</label>
      <div class="radio-group">
        <label v-for="r in RESOLUTIONS" :key="r.value">
          <input
            type="radio"
            :value="r.value"
            :checked="modelValue.resolution === r.value"
            @change="update({ resolution: r.value })"
          />
          {{ r.label }}
        </label>
      </div>
    </section>

    <section>
      <label class="field-label">Draw Shape</label>
      <div class="radio-group">
        <label v-for="s in SHAPES" :key="s.value">
          <input
            type="radio"
            :value="s.value"
            :checked="modelValue.drawShape === s.value"
            @change="update({ drawShape: s.value })"
          />
          {{ s.label }}
        </label>
      </div>
    </section>

    <section>
      <label class="field-label">
        Total Duration: {{ modelValue.durationSec }}s
        <span class="hint">({{ frameDurationMs }}ms per frame × {{ sourceCount }} years)</span>
      </label>
      <input
        type="range"
        min="3"
        max="15"
        :value="modelValue.durationSec"
        @input="update({ durationSec: +($event.target as HTMLInputElement).value })"
      />
    </section>

    <section>
      <label class="field-label">Year Label Position</label>
      <select
        :value="modelValue.labelPosition"
        @change="update({ labelPosition: ($event.target as HTMLSelectElement).value as LabelPosition })"
      >
        <option v-for="p in LABEL_POSITIONS" :key="p.value" :value="p.value">{{ p.label }}</option>
      </select>
    </section>

    <section>
      <label class="field-label">Label Font Size: {{ modelValue.fontSize }}px</label>
      <input
        type="range"
        min="24"
        max="180"
        :value="modelValue.fontSize"
        @input="update({ fontSize: +($event.target as HTMLInputElement).value })"
      />
    </section>

    <button class="btn-primary" @click="emit('next')">Next: Draw Area →</button>
  </div>
</template>

<style scoped>
.options-panel {
  max-width: 540px;
  margin: 0 auto;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.intro { display: flex; flex-direction: column; gap: 6px; }
h2 { margin: 0; font-size: 1.2rem; font-family: ui-monospace, monospace; color: #cc88ff; }
.intro p { margin: 0; color: #999; font-size: 0.9rem; line-height: 1.5; }
section { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 0.85rem; color: #aaa; }
.hint { color: #666; font-size: 0.8rem; }
.radio-group { display: flex; flex-wrap: wrap; gap: 12px; }
.radio-group label { display: flex; align-items: center; gap: 4px; cursor: pointer; }
input[type="range"] { width: 100%; accent-color: #aa3bff; }
select {
  background: #222;
  color: #ddd;
  border: 1px solid #444;
  padding: 6px 10px;
  border-radius: 4px;
  width: fit-content;
}
.btn-primary {
  align-self: flex-end;
  padding: 10px 24px;
  background: #aa3bff;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
}
</style>
