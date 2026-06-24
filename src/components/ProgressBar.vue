<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ value: number; max: number; label: string }>()
const pct = computed(() => props.max > 0 ? Math.round((props.value / props.max) * 100) : 0)
</script>

<template>
  <div class="progress-wrapper">
    <div class="progress-label">{{ label }} — {{ pct }}%</div>
    <progress :value="value" :max="max"></progress>
  </div>
</template>

<style scoped>
.progress-wrapper {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 480px;
  margin: auto;
}
.progress-label {
  font-size: 0.9rem;
  color: #aaa;
}
progress {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  accent-color: #aa3bff;
}
</style>
