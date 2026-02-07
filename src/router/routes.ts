import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'today',
        component: () => import('pages/TodayPage.vue'),
        meta: { title: 'Today' },
      },
      {
        path: 'week',
        name: 'week',
        component: () => import('pages/WeekPage.vue'),
        meta: { title: 'Week' },
      },
      {
        path: 'tasks',
        name: 'tasks',
        component: () => import('pages/TasksPage.vue'),
        meta: { title: 'Tasks' },
      },
      {
        path: 'tasks/new',
        name: 'task-new',
        component: () => import('pages/TaskNewPage.vue'),
        meta: { title: 'New Task' },
      },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
