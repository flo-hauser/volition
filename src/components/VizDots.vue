<template>
  <div class="viz-dots">
    <button
      v-for="(value, index) in pattern"
      :key="index"
      type="button"
      class="cell"
      :class="{
        filled: value === 1,
        today: index === todayIdx,
        future: index > todayIdx,
        clickable: index <= todayIdx && onCellClick,
        pulse: pulsingIndex === index,
      }"
      :disabled="index > todayIdx"
      @click.stop="handleCellClick(index)"
    >
      <template v-if="value === 1">
        <svg
          class="checkmark"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </template>
      <template v-else>{{ dayLabels[index] }}</template>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Props {
  pattern: number[];
  todayIdx: number;
  dayLabels?: readonly string[];
  onCellClick?: (dayIndex: number) => void;
}

const props = withDefaults(defineProps<Props>(), {
  dayLabels: () => ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const,
});

const pulsingIndex = ref<number | null>(null);
let pulseTimer: ReturnType<typeof setTimeout> | null = null;

function handleCellClick(index: number): void {
  if (!props.onCellClick || index > props.todayIdx) return;

  pulsingIndex.value = index;
  if (pulseTimer) clearTimeout(pulseTimer);
  pulseTimer = setTimeout(() => {
    pulsingIndex.value = null;
  }, 700);

  props.onCellClick(index);
}
</script>
