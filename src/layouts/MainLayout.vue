<template>
  <q-layout view="lHh Lpr lFf" class="bg-grey-1">
    <q-header bordered class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title class="text-weight-bold">{{ pageTitle }}</q-toolbar-title>
        <q-btn flat dense no-caps color="white" icon="add" label="Task" :to="'/tasks/new'" />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer bordered class="bg-secondary text-white">
      <q-tabs dense indicator-color="warning" active-color="warning" align="justify">
        <q-route-tab to="/" icon="today" label="Today" exact />
        <q-route-tab to="/week" icon="calendar_view_week" label="Week" />
        <q-route-tab to="/tasks" icon="checklist" label="Tasks" />
      </q-tabs>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const pageTitle = computed(() => {
  const title = route.meta.title;
  return typeof title === 'string' ? title : 'Volition';
});
</script>
