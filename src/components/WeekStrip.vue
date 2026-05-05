<template>
  <section class="week-strip">
    <div class="week-strip-grid">
      <div>
        <div class="eyebrow">{{ eyebrow }}</div>
        <div class="big">
          <span class="num">{{ done }}</span>
          <span class="frac">of {{ target }}</span>
        </div>
        <div class="label">check-ins</div>
        <div v-if="subtitle" class="sub">{{ subtitle }}</div>
      </div>
      <div class="week-strip-ring" aria-hidden="true">
        <svg viewBox="0 0 64 64">
          <circle class="track" cx="32" cy="32" :r="r" />
          <circle
            class="prog"
            cx="32"
            cy="32"
            :r="r"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="dashOffset"
          />
        </svg>
        <div class="pct">{{ pct }}%</div>
      </div>
    </div>
    <div v-if="dayPattern.length === 7" class="week-strip-days">
      <div v-for="(count, i) in dayPattern" :key="i" class="col" :class="{ today: i === todayIdx }">
        <div class="bar">
          <div class="f" :style="{ '--h': barHeight(count) }" />
        </div>
        <span>{{ dayLabels[i] }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  done: number;
  target: number;
  eyebrow: string;
  subtitle?: string;
  dayPattern?: number[];
  todayIdx?: number;
  dayLabels?: readonly string[];
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: '',
  dayPattern: () => [],
  todayIdx: -1,
  dayLabels: () => [] as const,
});

const r = 27;
const circumference = 2 * Math.PI * r;

const pct = computed(() => (props.target > 0 ? Math.round((props.done / props.target) * 100) : 0));
const dashOffset = computed(
  () => circumference * (1 - Math.min(props.done / Math.max(props.target, 1), 1)),
);

function barHeight(count: number): string {
  if (props.target === 0 || count === 0) return '0';
  return String(Math.min(count / props.target, 1));
}
</script>
