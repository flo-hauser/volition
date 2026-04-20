<template>
  <q-dialog
    :model-value="modelValue"
    position="bottom"
    persistent
    transition-show="jump-up"
    transition-hide="jump-down"
    @update:model-value="onVisibility"
  >
    <div class="sheet-card">
      <div class="grab" aria-hidden="true" />
      <h2>{{ sheetTitle }}</h2>
      <p class="sub">{{ t('pages.newTask.hint') }}</p>

      <div class="field">
        <label :for="titleInputId">{{ t('pages.newTask.taskTitle') }}</label>
        <input
          :id="titleInputId"
          v-model="title"
          type="text"
          maxlength="100"
          :placeholder="t('pages.newTask.taskTitlePlaceholder')"
          :aria-invalid="Boolean(titleError)"
          :aria-describedby="titleError ? titleErrorId : undefined"
          @keydown.enter.prevent="submit"
        />
        <div v-if="titleError" :id="titleErrorId" class="error-msg" role="alert">
          {{ titleError }}
        </div>
      </div>

      <fieldset class="field freq-fieldset">
        <legend>{{ t('pages.newTask.targetPerWeek') }}</legend>
        <div class="freq-picker">
          <button
            v-for="n in frequencyChoices"
            :key="n"
            type="button"
            :class="{ sel: targetPerWeek === n }"
            :aria-pressed="targetPerWeek === n"
            :aria-label="frequencyAriaLabel(n)"
            @click="targetPerWeek = n"
          >
            {{ n }}
          </button>
        </div>
        <div class="freq-caption">{{ freqCaption }}</div>
      </fieldset>

      <div class="sheet-actions">
        <button type="button" class="ghost-btn" :disabled="submitting" @click="close">
          {{ t('common.cancel') }}
        </button>
        <button
          type="button"
          class="primary-btn"
          :disabled="submitting || !title.trim()"
          @click="submit"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            width="16"
            height="16"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {{ submitLabel }}
        </button>
      </div>
    </div>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue';
import { useI18n } from 'vue-i18n';

type TargetPerWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface TaskFormPayload {
  title: string;
  targetPerWeek: TargetPerWeek;
}

interface Props {
  modelValue: boolean;
  mode: 'create' | 'edit';
  submitting?: boolean;
  initialTitle?: string;
  initialTargetPerWeek?: TargetPerWeek;
}

const props = withDefaults(defineProps<Props>(), {
  submitting: false,
  initialTitle: '',
  initialTargetPerWeek: 3,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'submit', payload: TaskFormPayload): void;
}>();

const { t } = useI18n();

const title = ref('');
const targetPerWeek = ref<TargetPerWeek>(3);
const attemptedSubmit = ref(false);

const titleInputId = `task-sheet-title-${useId()}`;
const titleErrorId = `${titleInputId}-err`;

const sheetTitle = computed(() =>
  props.mode === 'create' ? t('pages.newTask.title') : t('pages.tasks.editTask'),
);

const submitLabel = computed(() =>
  props.mode === 'create' ? t('pages.newTask.create') : t('common.save'),
);

const titleError = computed(() => {
  if (!attemptedSubmit.value) return '';
  const trimmed = title.value.trim();
  if (trimmed.length === 0) return t('pages.newTask.titleRequired');
  if (trimmed.length > 100) return t('pages.newTask.titleTooLong');
  return '';
});

const freqCaption = computed(() => {
  const n = targetPerWeek.value;
  if (n === 7) return t('pages.newTask.freqCaptionDaily');
  if (n >= 5) return t('pages.newTask.freqCaptionNearDaily');
  if (n >= 3) return t('pages.newTask.freqCaptionRegular');
  return t('pages.newTask.freqCaptionGentle');
});

const frequencyChoices: readonly TargetPerWeek[] = [1, 2, 3, 4, 5, 6, 7] as const;

function frequencyAriaLabel(n: TargetPerWeek): string {
  return n === 7 ? t('pages.newTask.targetOptionDaily') : t('pages.newTask.targetOption', { count: n });
}

function resetForm(): void {
  title.value = props.initialTitle;
  targetPerWeek.value = props.initialTargetPerWeek;
  attemptedSubmit.value = false;
}

function close(): void {
  if (props.submitting) return;
  emit('update:modelValue', false);
}

function onVisibility(value: boolean): void {
  emit('update:modelValue', value);
}

function submit(): void {
  attemptedSubmit.value = true;
  if (titleError.value) return;
  emit('submit', {
    title: title.value,
    targetPerWeek: targetPerWeek.value,
  });
}

watch(
  () => [props.modelValue, props.initialTitle, props.initialTargetPerWeek] as const,
  ([isOpen]) => {
    if (isOpen) resetForm();
  },
  { immediate: true },
);
</script>
