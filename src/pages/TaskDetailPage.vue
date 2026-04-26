<template>
  <q-page v-if="task" class="page page-enter">
    <div class="detail-nav">
      <button type="button" class="icon-btn" :aria-label="t('common.back')" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <div style="display:flex;gap:6px">
        <button type="button" class="icon-btn" :aria-label="t('pages.tasks.editTask')" @click="openEdit">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
        </button>
        <button type="button" class="icon-btn" :aria-label="t('pages.tasks.deleteTask')" @click="confirmDelete">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="detail-hero">
      <h1 class="title">{{ task.title }}</h1>
      <span class="freq-pill">◦ {{ t('pages.week.targetPerWeek', { count: task.targetPerWeek }) }}</span>
    </div>

    <div class="stat-grid">
      <div class="stat">
        <div class="n">{{ weekProgress }}/{{ task.targetPerWeek }}</div>
        <div class="l">{{ t('pages.detail.thisWeek') }}</div>
      </div>
      <div class="stat">
        <div class="n">{{ streak > 0 ? `${streak}w` : '—' }}</div>
        <div class="l">{{ t('pages.detail.streak') }}</div>
      </div>
      <div class="stat">
        <div class="n">{{ twelveWeekRate }}%</div>
        <div class="l">{{ t('pages.detail.twelveWeekRate') }}</div>
      </div>
    </div>

    <div class="detail-check-row">
      <div>
        <div class="l">{{ isDoneToday ? t('pages.detail.checkedInToday') : t('pages.detail.notYetToday') }}</div>
        <div class="sub">{{ todayLabel }}</div>
      </div>
      <CheckButton
        :model-value="isDoneToday"
        :disabled="pending"
        :aria-check="t('pages.today.doneToday')"
        :aria-uncheck="t('pages.today.doneToday')"
        @update:model-value="toggleToday"
      />
    </div>

    <div class="heatmap">
      <div class="label">{{ t('pages.detail.lastTwelveWeeks') }}</div>
      <div class="heat-grid">
        <span
          v-for="(cell, i) in heatCells"
          :key="i"
          class="c"
          :class="{
            l3: cell.checked,
            today: cell.isToday,
            future: cell.isFuture,
          }"
        />
      </div>
    </div>

    <div class="detail-quote">
      <p>{{ t('pages.detail.quote') }}</p>
    </div>

    <TaskSheet
      v-model="isEditOpen"
      mode="edit"
      :submitting="editBusy"
      :initial-title="task.title"
      :initial-target-per-week="task.targetPerWeek"
      @submit="submitEdit"
    />

    <q-dialog v-model="isDeleteOpen" persistent>
      <div class="sheet-card" style="max-width: 420px">
        <div class="grab" aria-hidden="true" />
        <h2>{{ t('pages.tasks.deleteTask') }}</h2>
        <p class="sub">{{ t('pages.tasks.deleteConfirm') }}</p>
        <div class="sheet-actions">
          <button type="button" class="ghost-btn" :disabled="deleteBusy" @click="isDeleteOpen = false">
            {{ t('common.cancel') }}
          </button>
          <button type="button" class="primary-btn" :disabled="deleteBusy" @click="submitDelete">
            {{ t('common.delete') }}
          </button>
        </div>
      </div>
    </q-dialog>
  </q-page>

  <q-page v-else class="page">
    <div class="section-head">
      <p class="page-sub">{{ t('pages.notFound.message') }}</p>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';

import CheckButton from 'src/components/CheckButton.vue';
import TaskSheet from 'src/components/TaskSheet.vue';
import { getIsoWeekId, getLocalDayISO, toLocalDate } from 'src/composables/useDay';
import { appendDebugLog } from 'src/services/debug/runtimeDiagnostics';
import { useTasksStore } from 'src/stores/tasks.store';

type TargetPerWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7;

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const store = useTasksStore();

const taskId = computed(() => route.params['id'] as string);
const task = computed(() => store.tasks[taskId.value] ?? null);

const todayISO = getLocalDayISO();
const weekId = getIsoWeekId(todayISO);

const pending = ref(false);
const isEditOpen = ref(false);
const editBusy = ref(false);
const isDeleteOpen = ref(false);
const deleteBusy = ref(false);

const isDoneToday = computed(() => store.isDone(taskId.value, todayISO));
const weekProgress = computed(() => store.weekProgress(taskId.value, weekId));
const streak = computed(() => store.getStreak(taskId.value));

const heatCells = computed(() => store.getHeatmapDays(taskId.value, 12));

const twelveWeekRate = computed(() => {
  const checked = heatCells.value.filter((c) => c.checked).length;
  const target = (task.value?.targetPerWeek ?? 1) * 12;
  if (target === 0) return 0;
  return Math.round((checked / target) * 100);
});

const todayLabel = computed(() => {
  return toLocalDate(todayISO).toLocaleDateString(locale.value, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
});

async function toggleToday(): Promise<void> {
  pending.value = true;
  try {
    await store.toggleToday(taskId.value);
  } catch (error) {
    appendDebugLog('tasks.toggleToday', error);
    $q.notify({ type: 'negative', position: 'top', message: t('pages.toast.taskToggleFailed') });
  } finally {
    pending.value = false;
  }
}

function goBack(): void {
  void router.push('/tasks');
}

function openEdit(): void {
  isEditOpen.value = true;
}

async function submitEdit(payload: { title: string; targetPerWeek: TargetPerWeek }): Promise<void> {
  editBusy.value = true;
  try {
    await store.updateTask(taskId.value, payload);
    $q.notify({ type: 'positive', position: 'top', message: t('pages.toast.taskUpdated') });
    isEditOpen.value = false;
  } catch (error) {
    appendDebugLog('tasks.updateTask', error);
    $q.notify({ type: 'negative', position: 'top', message: t('pages.toast.taskUpdateFailed') });
  } finally {
    editBusy.value = false;
  }
}

function confirmDelete(): void {
  isDeleteOpen.value = true;
}

async function submitDelete(): Promise<void> {
  deleteBusy.value = true;
  try {
    await store.deleteTask(taskId.value);
    $q.notify({ type: 'positive', position: 'top', message: t('pages.toast.taskDeleted') });
    void router.replace('/tasks');
  } catch (error) {
    appendDebugLog('tasks.deleteTask', error);
    $q.notify({ type: 'negative', position: 'top', message: t('pages.toast.taskDeleteFailed') });
  } finally {
    deleteBusy.value = false;
    isDeleteOpen.value = false;
  }
}
</script>

<style scoped>
.detail-nav {
  padding: calc(8px + env(safe-area-inset-top)) 24px 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.detail-quote {
  padding: 18px 24px 0;
}
.detail-quote p {
  font-family: var(--font-display);
  font-size: 18px;
  color: var(--text-2);
  font-style: italic;
  line-height: 1.4;
  margin: 0;
}
</style>
