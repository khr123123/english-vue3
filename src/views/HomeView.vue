<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { state, createArticle, deleteArticle } from '../store'
import type { Article } from '../types'

const router = useRouter()
const query = ref('')

const filtered = computed<Article[]>(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return state.articles
  return state.articles.filter((a) =>
    (a.title + ' ' + (a.subtitle ?? '') + ' ' + (a.theme ?? '') + ' ' + a.keywords.join(' '))
      .toLowerCase()
      .includes(q)
  )
})

function stripHtml(html: string): string {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return (tmp.textContent || '').trim()
}

function snippet(html: string, n = 160) {
  const t = stripHtml(html)
  return t.length > n ? t.slice(0, n) + '…' : t
}

function handleCreate() {
  const a = createArticle({
    title: 'Untitled Article',
    subtitle: 'A new blank article — start editing to add your own content.',
    content: '<p>Start writing your article here…</p>',
  })
  router.push({ name: 'article-edit', params: { id: a.id } })
}

function formatDate(ts: number) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`
}

function handleDelete(id: string) {
  if (confirm('Delete this article? This cannot be undone.')) {
    deleteArticle(id)
  }
}
</script>

<template>
  <section class="max-w-7xl mx-auto px-6 md:px-10 mb-12">
    <div
      class="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 items-stretch"
    >
      <div class="bg-paper soft-border rounded-3xl p-8 md:p-10 paper-shadow">
        <div class="text-xs uppercase tracking-[0.28em] text-blue font-bold mb-4">
          Article Library
        </div>
        <h1 class="text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-5">
          Your English Reading
          <span class="block text-blue">Studio.</span>
        </h1>
        <p class="text-sub text-lg leading-8 max-w-2xl mb-8">
          Save any article you like, highlight words and sentences, and take
          margin notes — everything stays in your browser.
        </p>

        <div class="flex flex-wrap gap-3">
          <button class="btn-primary" @click="handleCreate">
            + New Article
          </button>
          <div class="relative flex-1 min-w-[240px]">
            <input
              v-model="query"
              placeholder="Search title, theme, or keyword…"
              class="field-lg pl-10"
            />
            <span
              class="absolute left-3 top-1/2 -translate-y-1/2 text-sub pointer-events-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="11" cy="11" r="7"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
          </div>
        </div>
      </div>

      <div
        class="bg-blue text-white rounded-3xl p-8 md:p-10 paper-shadow relative overflow-hidden"
      >
        <div
          class="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10"
        ></div>
        <div
          class="absolute -left-10 -bottom-10 w-48 h-48 rounded-full bg-white/5"
        ></div>

        <div class="relative z-10">
          <div
            class="text-xs uppercase tracking-[0.28em] text-white/75 font-bold mb-4"
          >
            How it works
          </div>
          <ul class="space-y-4 text-white/95 leading-7 text-[15px]">
            <li class="flex gap-3">
              <span
                class="w-6 h-6 rounded-full bg-white/15 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5"
                >1</span
              >
              Create or paste any English article you want to study.
            </li>
            <li class="flex gap-3">
              <span
                class="w-6 h-6 rounded-full bg-white/15 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5"
                >2</span
              >
              Highlight words or sentences, make them bold, underline, or
              color-mark them.
            </li>
            <li class="flex gap-3">
              <span
                class="w-6 h-6 rounded-full bg-white/15 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5"
                >3</span
              >
              Attach a note to any selection — it appears in the side panel
              automatically.
            </li>
            <li class="flex gap-3">
              <span
                class="w-6 h-6 rounded-full bg-white/15 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5"
                >4</span
              >
              Collect vocabulary and keywords. Everything saves to local
              storage.
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>

  <section class="max-w-7xl mx-auto px-6 md:px-10">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl md:text-3xl font-bold tracking-tight">
        Articles
        <span class="text-sub text-base font-normal">({{ filtered.length }})</span>
      </h2>
    </div>

    <div
      v-if="filtered.length === 0"
      class="bg-paper rounded-3xl soft-border p-10 text-center"
    >
      <div class="text-lg font-semibold mb-2">No articles yet</div>
      <p class="text-sub mb-5">
        Click "New Article" to create your first reading material.
      </p>
      <button class="btn-primary mx-auto" @click="handleCreate">
        + New Article
      </button>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <article
        v-for="a in filtered"
        :key="a.id"
        class="group bg-white/70 rounded-3xl p-6 soft-border paper-shadow flex flex-col hover:-translate-y-0.5 transition cursor-pointer"
        @click="router.push({ name: 'article', params: { id: a.id } })"
      >
        <div class="flex items-center justify-between mb-3">
          <span class="tag">{{ a.theme || 'General' }}</span>
          <span class="text-xs text-sub mono">{{ formatDate(a.updatedAt) }}</span>
        </div>
        <h3
          class="text-xl font-bold tracking-tight leading-snug mb-2 group-hover:text-blue transition line-clamp-2"
        >
          {{ a.title }}
        </h3>
        <p v-if="a.subtitle" class="text-sub text-sm leading-6 mb-3 line-clamp-2">
          {{ a.subtitle }}
        </p>
        <p class="text-sub text-sm leading-6 line-clamp-3 mb-4">
          {{ snippet(a.content) }}
        </p>
        <div class="mt-auto flex items-center justify-between pt-3 border-t border-line/60">
          <div class="flex flex-wrap gap-1.5">
            <span class="text-xs text-sub mono">{{ a.vocab.length }} vocab</span>
            <span class="text-xs text-sub mono">·</span>
            <span class="text-xs text-sub mono">{{ a.notes.length }} notes</span>
          </div>
          <div class="flex items-center gap-1.5" @click.stop>
            <button
              class="text-xs px-2.5 py-1 rounded-full soft-border text-sub hover:text-blue hover:border-blue/40 transition"
              @click="router.push({ name: 'article-edit', params: { id: a.id } })"
            >
              Edit
            </button>
            <button
              class="text-xs px-2.5 py-1 rounded-full soft-border text-sub hover:text-red-500 hover:border-red-400/40 transition"
              @click="handleDelete(a.id)"
            >
              Delete
            </button>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>
