<template>
  <div class="week-mini" :aria-label="ariaLabel">
    <span
      v-for="(value, index) in pattern"
      :key="index"
      class="d"
      :class="{
        filled: value === 1,
        today: index === todayIdx,
        future: index > todayIdx,
      }"
    />
  </div>
</template>

<script setup lang="ts">
interface Props {
  pattern: number[];
  todayIdx: number;
  ariaLabel?: string;
}

withDefaults(defineProps<Props>(), {
  ariaLabel: 'Week check-ins',
});
</script>
