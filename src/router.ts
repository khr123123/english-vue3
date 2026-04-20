import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('./views/HomeView.vue'),
  },
  {
    path: '/article/:id',
    name: 'article',
    component: () => import('./views/ArticleView.vue'),
    props: true,
  },
  {
    path: '/article/:id/edit',
    name: 'article-edit',
    component: () => import('./views/ArticleEditView.vue'),
    props: true,
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})
