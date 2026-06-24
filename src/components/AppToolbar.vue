<script setup lang="ts">
import type { AppStep } from '../types'

const props = defineProps<{ step: AppStep; canEncodeVideo: boolean | null }>()
defineEmits<{ about: []; startOver: [] }>()

const STEPS: AppStep[] = ['options', 'draw', 'fetching', 'preview', 'encoding', 'done']
const LABELS: Record<AppStep, string> = {
  options: 'Options',
  draw: 'Draw',
  fetching: 'Fetching',
  preview: 'Preview',
  encoding: 'Encoding',
  done: 'Done',
}

function stepIndex(s: AppStep) { return STEPS.indexOf(s) }
</script>

<template>
  <header class="toolbar">
    <span class="title">lbk-time-camera</span>

    <nav class="steps">
      <span
        v-for="s in STEPS"
        :key="s"
        class="step"
        :class="{
          active: s === step,
          done: stepIndex(s) < stepIndex(step),
          unavailable: canEncodeVideo === false && (s === 'encoding' || s === 'done'),
        }"
      >{{ LABELS[s] }}</span>
    </nav>

    <div class="toolbar-actions">
      <button
        v-if="step !== 'options'"
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
  font-weight: 700;
  font-size: 0.95rem;
  white-space: nowrap;
  font-family: ui-monospace, monospace;
  color: #cc88ff;
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
