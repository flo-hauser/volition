<template>
  <section class="today-hero">
    <div class="hero-date">{{ eyebrow }}</div>
    <div class="hero-count">
      <span class="big">{{ done }}</span>
      <span class="of">{{ ofLabel }}</span>
    </div>
    <div v-if="quote" class="hero-quote">{{ quote }}</div>
    <div class="hero-bar">
      <div class="fill" :style="{ '--w': pct + '%' }" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  done: number;
  total: number;
  quote?: string;
  eyebrow?: string;
  ofLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  quote: '',
  eyebrow: 'Your check-in',
  ofLabel: '',
});

const pct = computed(() => (props.total > 0 ? (props.done / props.total) * 100 : 0));
</script>
