<!--
  App.vue — 应用根组件 / Application root component

  包含全局布局结构：
  - AppHeader（顶部导航栏）
  - RouterView（页面内容区域）
  - Footer（页脚信息）

  Contains the global layout:
  - AppHeader (top navigation bar)
  - RouterView (page content area)
  - Footer (footer info)
-->

<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
</script>

<template>
  <!-- 顶部导航栏 / Top navigation bar -->
  <AppHeader />

  <!-- 主内容区域 / Main content area -->
  <main class="pt-24 pb-20">
    <RouterView />
  </main>

  <!-- 页脚 / Footer -->
  <footer class="mt-10 border-t border-line/70 bg-paper/60">
    <div
      class="max-w-7xl mx-auto px-6 md:px-10 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
    >
      <div>
        <div class="text-sm font-semibold">English Reading Studio</div>
        <div class="text-sm text-sub">
          Organize your books, annotate articles, and build your vocabulary — all stored on the cloud.
        </div>
      </div>
      <div class="text-xs uppercase tracking-[0.2em] text-sub">
        Bookshelf & Reading
      </div>
    </div>
  </footer>
</template>
