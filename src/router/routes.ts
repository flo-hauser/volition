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
        meta: { titleKey: 'nav.today' },
      },
      {
        path: 'week',
        name: 'week',
        component: () => import('pages/WeekPage.vue'),
        meta: { titleKey: 'nav.week' },
      },
      {
        path: 'tasks',
        name: 'tasks',
        component: () => import('pages/TasksPage.vue'),
        meta: { titleKey: 'nav.tasks' },
      },
      {
        path: 'tasks/new',
        redirect: '/tasks?new=1',
      },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
