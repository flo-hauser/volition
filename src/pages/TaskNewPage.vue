<template>
  <q-page class="q-pa-md">
    <div class="q-mx-auto" style="max-width: 640px">
      <q-card flat bordered>
        <q-card-section>
          <div class="text-h6 text-secondary text-weight-bold">{{ t('pages.newTask.title') }}</div>
          <div class="text-body2 text-grey-8 q-mt-xs">{{ t('pages.newTask.hint') }}</div>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-banner v-if="submitError" dense class="bg-negative text-white q-mb-md">
            {{ t('pages.newTask.createFailed') }}
          </q-banner>

          <q-form @submit="onSubmit">
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
              class="q-mb-lg"
            />

            <div class="row justify-end q-gutter-sm">
              <q-btn
                flat
                color="secondary"
                no-caps
                :label="t('common.backToTasks')"
                :to="'/tasks'"
              />
              <q-btn
                color="primary"
                no-caps
                type="submit"
                :label="t('pages.newTask.create')"
                :loading="submitting"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';

import { useTasksStore } from 'src/stores/tasks.store';

const { t } = useI18n();
const $q = useQuasar();
const router = useRouter();
const store = useTasksStore();

const title = ref('');
const targetPerWeek = ref<1 | 2 | 3 | 4 | 5 | 6 | 7>(3);
const submitting = ref(false);
const submitError = ref(false);
const attemptedSubmit = ref(false);

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

async function onSubmit(): Promise<void> {
  submitError.value = false;
  attemptedSubmit.value = true;

  if (titleError.value) {
    return;
  }

  submitting.value = true;

  try {
    await store.createTask({
      title: title.value,
      targetPerWeek: targetPerWeek.value,
    });
    $q.notify({
      type: 'positive',
      position: 'top-right',
      message: t('pages.newTask.createdSuccess'),
    });

    await router.push('/tasks');
  } catch {
    submitError.value = true;
    $q.notify({
      type: 'negative',
      position: 'top-right',
      message: t('pages.newTask.createFailed'),
    });
  } finally {
    submitting.value = false;
  }
}
</script>
