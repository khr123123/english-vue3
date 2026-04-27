<!--
  BookDetailView.vue — 书籍详情页 / Book detail page

  打开某本书后，展示该书下的所有文章列表。
  用户可以：
  - 查看书籍信息
  - 浏览该书的文章列表
  - 创建新文章
  - 编辑/删除文章
  - 返回书架

  Shows all articles inside a specific book.
  Users can:
  - View book information
  - Browse articles in this book
  - Create new articles
  - Edit/delete articles
  - Go back to bookshelf
-->

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  state,
  getBook,
  getBookArticles,
  createArticle,
  deleteArticle,
  BOOK_COLORS,
} from '../store'
import { snippet, formatDate } from '../utils/html'

const route = useRoute()
const router = useRouter()

/** 当前书籍ID / Current book ID */
const bookId = computed(() => String(route.params.bookId))

/** 当前书籍对象 / Current book object */
const book = computed(() => getBook(bookId.value))

/** 当前书下的文章列表 / Articles in this book */
const articles = computed(() => getBookArticles(bookId.value))

/**
 * 创建新文章并跳转到编辑页
 * Create a new article and navigate to edit page
 */
async function handleCreate() {
  const a = await createArticle(bookId.value, {
    title: 'Untitled Article',
    subtitle: 'A new blank article — start editing to add your own content.',
    content: '<p>Start writing your article here…</p>',
  })
  router.push({
    name: 'article-edit',
    params: { bookId: bookId.value, id: a.id },
  })
}

/**
 * 删除文章（需要确认）
 * Delete an article with confirmation
 */
function handleDelete(id: string) {
  if (confirm('Delete this article? This cannot be undone.')) {
    deleteArticle(id)
  }
}
</script>

<template>
  <!-- 如果书籍不存在（可能被删除），显示提示 / Show message if book not found -->
  <section v-if="!book && !state.loading" class="max-w-7xl mx-auto px-6 md:px-10">
    <div class="bg-paper rounded-3xl soft-border p-10 text-center">
      <div class="text-5xl mb-4">📖</div>
      <div class="text-lg font-semibold mb-2">Book not found</div>
      <p class="text-sub mb-5">This book may have been deleted.</p>
      <button class="btn-primary" @click="router.push('/')">Back to Bookshelf</button>
    </div>
  </section>

  <template v-if="book">
    <!-- 书籍信息横幅 / Book info banner -->
    <section class="max-w-7xl mx-auto px-6 md:px-10 mb-10">
      <!-- 面包屑导航 / Breadcrumb -->
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div class="flex items-center gap-3 text-sm text-sub">
          <button class="btn-ghost" @click="router.push('/')">← Bookshelf</button>
        </div>
        <div class="flex gap-2">
          <button class="btn-primary" @click="handleCreate">+ New Article</button>
        </div>
      </div>

      <!-- 书籍卡片 / Book card -->
      <div
        class="rounded-3xl p-8 md:p-10 paper-shadow relative overflow-hidden text-white bg-gradient-to-br"
        :class="BOOK_COLORS[book.color].bg"
      >
        <!-- 装饰圆形 / Decorative circles -->
        <div class="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10"></div>
        <div class="absolute -left-10 -bottom-10 w-48 h-48 rounded-full bg-white/5"></div>

        <div class="relative z-10 flex items-start gap-6">
          <!-- 书籍图标 / Book icon -->
          <div class="text-6xl shrink-0">{{ book.icon || '📘' }}</div>
          <div>
            <div class="text-xs uppercase tracking-[0.28em] text-white/70 font-bold mb-2">
              Book · {{ articles.length }} articles
            </div>
            <h1 class="text-3xl md:text-4xl font-bold tracking-tight leading-tight mb-3">
              {{ book.title }}
            </h1>
            <p v-if="book.description" class="text-white/85 text-base leading-7 max-w-2xl">
              {{ book.description }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- 文章列表区域 / Articles list section -->
    <section class="max-w-7xl mx-auto px-6 md:px-10">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl md:text-3xl font-bold tracking-tight">
          Articles
          <span class="text-sub text-base font-normal">({{ articles.length }})</span>
        </h2>
      </div>

      <!-- 空状态 / Empty state -->
      <div
        v-if="articles.length === 0"
        class="bg-paper rounded-3xl soft-border p-10 text-center"
      >
        <div class="text-5xl mb-4">📝</div>
        <div class="text-lg font-semibold mb-2">No articles in this book</div>
        <p class="text-sub mb-5">
          Click "New Article" to add your first article to this book.
        </p>
        <button class="btn-primary mx-auto" @click="handleCreate">+ New Article</button>
      </div>

      <!-- 文章卡片网格 / Article cards grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <article
          v-for="a in articles"
          :key="a.id"
          class="group bg-white/70 rounded-3xl p-6 soft-border paper-shadow flex flex-col hover:-translate-y-0.5 transition cursor-pointer"
          @click="router.push({ name: 'article', params: { bookId: bookId, id: a.id } })"
        >
          <!-- 顶部：主题和日期 / Top: theme & date -->
          <div class="flex items-center justify-between mb-3">
            <span class="tag">{{ a.theme || 'General' }}</span>
            <span class="text-xs text-sub mono">{{ formatDate(a.updatedAt) }}</span>
          </div>

          <!-- 标题 / Title -->
          <h3 class="text-xl font-bold tracking-tight leading-snug mb-2 group-hover:text-blue transition line-clamp-2">
            {{ a.title }}
          </h3>

          <!-- 副标题 / Subtitle -->
          <p v-if="a.subtitle" class="text-sub text-sm leading-6 mb-3 line-clamp-2">
            {{ a.subtitle }}
          </p>

          <!-- 内容摘要 / Content snippet -->
          <p class="text-sub text-sm leading-6 line-clamp-3 mb-4">
            {{ snippet(a.content) }}
          </p>

          <!-- 底部：统计和操作 / Bottom: stats & actions -->
          <div class="mt-auto flex items-center justify-between pt-3 border-t border-line/60">
            <div class="flex flex-wrap gap-1.5">
              <span class="text-xs text-sub mono">{{ a.vocab.length }} vocab</span>
              <span class="text-xs text-sub mono">·</span>
              <span class="text-xs text-sub mono">{{ a.notes.length }} notes</span>
            </div>
            <div class="flex items-center gap-1.5" @click.stop>
              <button
                class="text-xs px-2.5 py-1 rounded-full soft-border text-sub hover:text-blue hover:border-blue/40 transition"
                @click="router.push({ name: 'article-edit', params: { bookId: bookId, id: a.id } })"
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
</template>
