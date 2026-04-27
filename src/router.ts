/**
 * router.ts — Vue Router 路由配置 / Vue Router configuration
 *
 * 路由结构 / Route structure:
 * - /                         → 书架首页（BookshelfView）
 * - /book/:bookId             → 书籍详情，展示该书下的文章列表（BookDetailView）
 * - /book/:bookId/article/:id → 文章阅读页面（ArticleView）
 * - /book/:bookId/article/:id/edit → 文章编辑页面（ArticleEditView）
 *
 * 使用 Hash 模式以兼容静态部署（Vercel / GitHub Pages）
 * Uses hash history for compatibility with static hosting
 */

import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('./views/BookshelfView.vue'),
  },
  {
    path: '/book/:bookId',
    name: 'book-detail',
    component: () => import('./views/BookDetailView.vue'),
    props: true,
  },
  {
    path: '/book/:bookId/article/:id',
    name: 'article',
    component: () => import('./views/ArticleView.vue'),
    props: true,
  },
  {
    path: '/book/:bookId/article/:id/edit',
    name: 'article-edit',
    component: () => import('./views/ArticleEditView.vue'),
    props: true,
  },
  {
    // 所有未匹配的路由重定向到首页 / Catch-all redirects to home
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  // 每次导航都滚动到顶部 / Scroll to top on navigation
  scrollBehavior() {
    return { top: 0 }
  },
})
