<template>
  <section class="week-strip">
    <div class="eyebrow">{{ eyebrow }}</div>
    <div class="big"><em>{{ done }}</em> {{ ofLabel }}</div>
    <div v-if="subtitle" class="sub">{{ subtitle }}</div>
  </section>
</template>

<script setup lang="ts">
interface Props {
  done: number;
  target: number;
  eyebrow: string;
  ofLabel: string;
  subtitle?: string;
}

withDefaults(defineProps<Props>(), {
  subtitle: '',
});
</script>
