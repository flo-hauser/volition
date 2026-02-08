<template>
  <q-dialog :model-value="modelValue" persistent @update:model-value="onDialogVisibilityChange">
    <q-card class="vol-surface-card" style="min-width: 320px; width: 100%; max-width: 420px">
      <q-card-section>
        <div class="text-h6">{{ dialogTitle }}</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-input
          v-model="title"
          outlined
          maxlength="100"
          :label="t('pages.newTask.taskTitle')"
          :placeholder="t('pages.newTask.taskTitlePlaceholder')"
          :error="Boolean(titleError)"
          :error-message="titleError"
          class="q-mb-md"
        />

        <q-select
          v-model="targetPerWeek"
          outlined
          emit-value
          map-options
          :label="t('pages.newTask.targetPerWeek')"
          :options="targetOptions"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          flat
          no-caps
          :label="t('common.cancel')"
          :disable="submitting"
          @click="closeDialog"
        />
        <q-btn
          color="primary"
          no-caps
          :label="submitLabel"
          :loading="submitting"
          @click="submit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
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

const dialogTitle = computed(() =>
  props.mode === 'create' ? t('pages.newTask.title') : t('pages.tasks.editTask'),
);
const submitLabel = computed(() =>
  props.mode === 'create' ? t('pages.newTask.create') : t('common.save'),
);

const targetOptions = computed(() =>
  ([1, 2, 3, 4, 5, 6, 7] as const).map((value) => ({
    label:
      value === 7
        ? t('pages.newTask.targetOptionDaily')
        : t('pages.newTask.targetOption', { count: value }),
    value,
  })),
);

const titleError = computed(() => {
  if (!attemptedSubmit.value) {
    return '';
  }

  const trimmed = title.value.trim();
  if (trimmed.length === 0) {
    return t('pages.newTask.titleRequired');
  }

  if (trimmed.length > 100) {
    return t('pages.newTask.titleTooLong');
  }

  return '';
});

function resetForm(): void {
  title.value = props.initialTitle;
  targetPerWeek.value = props.initialTargetPerWeek;
  attemptedSubmit.value = false;
}

function closeDialog(): void {
  if (props.submitting) {
    return;
  }

  emit('update:modelValue', false);
}

function onDialogVisibilityChange(value: boolean): void {
  emit('update:modelValue', value);
}

function submit(): void {
  attemptedSubmit.value = true;

  if (titleError.value) {
    return;
  }

  emit('submit', {
    title: title.value,
    targetPerWeek: targetPerWeek.value,
  });
}

watch(
  () => [props.modelValue, props.initialTitle, props.initialTargetPerWeek],
  ([isOpen]) => {
    if (isOpen) {
      resetForm();
    }
  },
  { immediate: true },
);
</script>
