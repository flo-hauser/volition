<template>
  <q-page class="q-pa-md">
    <div class="q-mx-auto" style="max-width: 640px">
      <q-card flat bordered>
        <q-card-section>
          <div class="text-h6 text-secondary text-weight-bold">Create a new task</div>
          <div class="text-body2 text-grey-8 q-mt-xs">
            Task form and validation will be added in a later step.
          </div>
        </q-card-section>
        <q-separator />
        <q-card-actions align="left">
          <q-btn flat color="secondary" no-caps icon="arrow_back" label="Back to tasks" :to="'/tasks'" />
        </q-card-actions>
      </q-card>
    </div>
  </q-page>
</template>
