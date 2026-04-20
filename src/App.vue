<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
</script>

<template>
  <AppHeader />
  <main class="pt-24 pb-20">
    <RouterView />
  </main>
  <footer class="mt-10 border-t border-line/70 bg-paper/60">
    <div
      class="max-w-7xl mx-auto px-6 md:px-10 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
    >
      <div>
        <div class="text-sm font-semibold">Minimal Reading Layout</div>
        <div class="text-sm text-sub">
          Annotate, highlight and make notes on your English articles — all stored locally.
        </div>
      </div>
      <div class="text-xs uppercase tracking-[0.2em] text-sub">
        English Reading • Editorial Style
      </div>
    </div>
  </footer>
</template>
