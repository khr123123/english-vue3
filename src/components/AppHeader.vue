<!--
  AppHeader.vue — 顶部导航栏组件 / Top navigation bar component

  固定在页面顶部，包含：
  - 应用Logo和标题
  - 导航链接（书架、GitHub）

  Fixed at top with:
  - App logo & title
  - Nav links (Bookshelf, GitHub)
-->

<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()
/** 判断是否在书架首页 / Check if on bookshelf home */
const isHome = computed(() => route.name === 'home')
</script>

<template>
  <!-- 固定顶部导航栏（毛玻璃效果） / Fixed top nav with backdrop blur -->
  <header
    class="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-bg/80 border-b border-line/60"
  >
    <div
      class="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between"
    >
      <!-- Logo 和标题 / Logo & title -->
      <RouterLink to="/" class="flex items-center gap-3 group">
        <div
          class="w-8 h-8 rounded-full bg-blue text-white flex items-center justify-center text-sm font-bold shadow-paper group-hover:scale-105 transition"
        >
          ER
        </div>
        <div>
          <div class="text-sm uppercase tracking-[0.22em] text-blue font-semibold">
            Reading Studio
          </div>
          <div class="text-sm text-sub">Bookshelf & Articles</div>
        </div>
      </RouterLink>

      <!-- 导航链接 / Navigation links -->
      <nav class="hidden md:flex items-center gap-8 text-sm uppercase tracking-[0.18em]">
        <RouterLink
          to="/"
          class="text-sub hover:text-blue transition"
          :class="{ 'text-blue': isHome }"
        >
          Bookshelf
        </RouterLink>
        <a
          href="https://github.com/khr123123/english-vue3"
          target="_blank"
          rel="noopener"
          class="text-sub hover:text-blue transition"
        >
          GitHub
        </a>
      </nav>
    </div>
  </header>
</template>
