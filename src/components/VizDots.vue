<template>
  <div class="viz-dots">
    <div
      v-for="(value, index) in pattern"
      :key="index"
      class="cell"
      :class="{
        filled: value === 1,
        today: index === todayIdx,
        future: index > todayIdx,
      }"
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
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  pattern: number[];
  todayIdx: number;
  dayLabels?: readonly string[];
}

withDefaults(defineProps<Props>(), {
  dayLabels: () => ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const,
});
</script>
