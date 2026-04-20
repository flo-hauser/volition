<template>
  <button
    type="button"
    class="check-btn"
    :class="{ done: modelValue, pulse: pulse }"
    :style="{ '--size': size + 'px' }"
    :aria-label="modelValue ? ariaUncheck : ariaCheck"
    :aria-pressed="modelValue"
    :disabled="disabled"
    @click.stop="onClick"
  >
    <span class="fill" />
    <span class="ripple" />
    <svg
      class="tick"
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
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Props {
  modelValue: boolean;
  size?: number;
  disabled?: boolean;
  ariaCheck?: string;
  ariaUncheck?: string;
}

const props = withDefaults(defineProps<Props>(), {
  size: 52,
  disabled: false,
  ariaCheck: 'Check in',
  ariaUncheck: 'Mark as not done',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const pulse = ref(false);
let pulseTimer: ReturnType<typeof setTimeout> | null = null;

function onClick(): void {
  if (props.disabled) return;

  if (!props.modelValue) {
    pulse.value = true;
    if (pulseTimer) clearTimeout(pulseTimer);
    pulseTimer = setTimeout(() => {
      pulse.value = false;
    }, 700);
  }

  emit('update:modelValue', !props.modelValue);
}
</script>
