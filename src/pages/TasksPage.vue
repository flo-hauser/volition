<template>
  <q-page class="q-pa-md">
    <div class="q-mx-auto" style="max-width: 640px">
      <q-card flat bordered>
        <q-card-section>
          <div class="text-h6 text-secondary text-weight-bold">Tasks</div>
          <div class="text-body2 text-grey-8 q-mt-xs">
            Task list and weekly targets will be managed here.
          </div>
        </q-card-section>
        <q-separator />
        <q-card-actions align="right">
          <q-btn color="primary" no-caps icon="add" label="Add task" :to="'/tasks/new'" />
        </q-card-actions>
      </q-card>
    </div>
  </q-page>
</template>
