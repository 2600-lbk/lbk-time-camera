<script setup lang="ts">
import { computed } from 'vue'
import type { AppStep } from '../types'

const props = defineProps<{ step: AppStep; canEncodeVideo: boolean | null }>()
defineEmits<{ about: []; startOver: [] }>()

type Stage = { key: string; label: string; steps: AppStep[] }
const STAGES: Stage[] = [
  { key: 'draw', label: 'Draw', steps: ['draw', 'fetching'] },
  { key: 'preview', label: 'Preview', steps: ['preview', 'encoding'] },
  { key: 'share', label: 'Share', steps: ['done'] },
]

const activeIndex = computed(() =>
  STAGES.findIndex(stage => stage.steps.includes(props.step))
)
</script>

<template>
  <header class="toolbar">
    <span class="title">
      <img src="/app-icon-full.png" alt="" class="title-icon" aria-hidden="true" />
      lbk-time-camera
    </span>

    <nav class="steps">
      <span
        v-for="(stage, i) in STAGES"
        :key="stage.key"
        class="step"
        :class="{
          active: i === activeIndex,
          done: i < activeIndex,
          unavailable: canEncodeVideo === false && stage.key === 'share',
        }"
      >{{ stage.label }}</span>
    </nav>

    <div class="toolbar-actions">
      <button
        v-if="step !== 'draw'"
        class="btn-ghost"
        @click="$emit('startOver')"
      >Start Over</button>
      <button class="btn-ghost" @click="$emit('about')">About</button>
    </div>
  </header>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 14px;
  background: #111;
  border-bottom: 1px solid #333;
  flex-shrink: 0;
}
.title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  font-size: 0.95rem;
  white-space: nowrap;
  font-family: ui-monospace, monospace;
  color: #cc88ff;
}
.title-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}
.steps {
  display: flex;
  gap: 2px;
  overflow-x: auto;
  flex: 1;
}
.step {
  padding: 3px 9px;
  border-radius: 20px;
  font-size: 0.75rem;
  color: #555;
  white-space: nowrap;
  border: 1px solid transparent;
}
.step.done { color: #777; }
.step.unavailable { text-decoration: line-through; color: #3a3a3a; }
.step.active {
  border-color: #aa3bff;
  color: #cc88ff;
}
.toolbar-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}
.btn-ghost {
  padding: 4px 10px;
  background: transparent;
  border: 1px solid #444;
  color: #aaa;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  white-space: nowrap;
}
.btn-ghost:hover {
  border-color: #666;
  color: #ddd;
}
</style>
