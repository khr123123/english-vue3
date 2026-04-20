<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()
const isHome = computed(() => route.name === 'home')
</script>

<template>
  <header
    class="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-bg/80 border-b border-line/60"
  >
    <div
      class="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between"
    >
      <RouterLink to="/" class="flex items-center gap-3 group">
        <div
          class="w-8 h-8 rounded-full bg-blue text-white flex items-center justify-center text-sm font-bold shadow-paper group-hover:scale-105 transition"
        >
          ER
        </div>
        <div>
          <div
            class="text-sm uppercase tracking-[0.22em] text-blue font-semibold"
          >
            Reading Module
          </div>
          <div class="text-sm text-sub">English Article Studio</div>
        </div>
      </RouterLink>
      <nav class="hidden md:flex items-center gap-8 text-sm uppercase tracking-[0.18em]">
        <RouterLink
          to="/"
          class="text-sub hover:text-blue transition"
          :class="{ 'text-blue': isHome }"
          >Library</RouterLink
        >
        <a
          href="https://github.com/khr123123/english-vue3"
          target="_blank"
          rel="noopener"
          class="text-sub hover:text-blue transition"
          >GitHub</a
        >
      </nav>
    </div>
  </header>
</template>
