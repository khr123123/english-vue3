<!--
  BookshelfView.vue — 书架首页 / Bookshelf home page

  展示所有书籍，以精美的3D书架样式呈现。
  用户可以：
  - 浏览书架上的所有书籍
  - 点击书籍进入该书的文章列表
  - 创建新书籍
  - 编辑/删除书籍

  Displays all books in a beautiful 3D bookshelf layout.
  Users can:
  - Browse all books on the shelf
  - Click a book to view its articles
  - Create new books
  - Edit/delete books
-->

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  state,
  createBook,
  updateBook,
  deleteBook,
  getBookArticleCount,
  BOOK_COLORS,
  COLOR_OPTIONS,
  ICON_OPTIONS,
} from '../store'
import type { Book, BookColor } from '../types'
import { formatDate } from '../utils/html'

const router = useRouter()

/** 搜索关键字 / Search keyword */
const query = ref('')

/** 过滤后的书籍列表 / Filtered books list */
const filtered = computed<Book[]>(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return state.books
  return state.books.filter(
    (b) =>
      b.title.toLowerCase().includes(q) ||
      (b.description ?? '').toLowerCase().includes(q)
  )
})

// ===================== 新建/编辑书籍弹窗 / Create/Edit book dialog =====================

/** 弹窗状态 / Dialog state */
const dialog = reactive({
  show: false,
  editId: '' as string, // 空为新建，有值为编辑 / empty=create, has value=edit
  title: '',
  description: '',
  color: 'blue' as BookColor,
  icon: '📘',
})

/** 打开新建书籍弹窗 / Open create book dialog */
function openCreate() {
  dialog.show = true
  dialog.editId = ''
  dialog.title = ''
  dialog.description = ''
  dialog.color = COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)]
  dialog.icon = ICON_OPTIONS[Math.floor(Math.random() * ICON_OPTIONS.length)]
}

/** 打开编辑书籍弹窗 / Open edit book dialog */
function openEdit(book: Book) {
  dialog.show = true
  dialog.editId = book.id
  dialog.title = book.title
  dialog.description = book.description ?? ''
  dialog.color = book.color
  dialog.icon = book.icon ?? '📘'
}

/** 保存（新建或更新）书籍 / Save (create or update) book */
async function handleSave() {
  const title = dialog.title.trim()
  if (!title) return

  if (dialog.editId) {
    // 更新 / Update
    await updateBook(dialog.editId, {
      title,
      description: dialog.description.trim(),
      color: dialog.color,
      icon: dialog.icon,
    })
  } else {
    // 新建 / Create
    await createBook({
      title,
      description: dialog.description.trim(),
      color: dialog.color,
      icon: dialog.icon,
    })
  }
  dialog.show = false
}

/** 删除书籍（需要确认） / Delete book with confirmation */
async function handleDelete(id: string) {
  const count = getBookArticleCount(id)
  const msg = count > 0
    ? `This book contains ${count} article(s). Delete it and all articles inside?`
    : 'Delete this empty book?'
  if (confirm(msg)) {
    await deleteBook(id)
  }
}
</script>

<template>
  <!-- 顶部横幅 / Hero banner -->
  <section class="max-w-7xl mx-auto px-6 md:px-10 mb-12">
    <div class="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 items-stretch">
      <!-- 左侧介绍 / Left intro panel -->
      <div class="bg-paper soft-border rounded-3xl p-8 md:p-10 paper-shadow">
        <div class="text-xs uppercase tracking-[0.28em] text-blue font-bold mb-4">
          My Bookshelf
        </div>
        <h1 class="text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-5">
          Your English Reading
          <span class="block text-blue">Bookshelf.</span>
        </h1>
        <p class="text-sub text-lg leading-8 max-w-2xl mb-8">
          Organize your English articles into books. Click a book to read, annotate,
          and build your vocabulary — everything syncs to the cloud.
        </p>
        <!-- 操作按钮 / Action buttons -->
        <div class="flex flex-wrap gap-3">
          <button class="btn-primary" @click="openCreate">+ New Book</button>
          <div class="relative flex-1 min-w-[240px]">
            <input
              v-model="query"
              placeholder="Search books…"
              class="field-lg pl-10"
            />
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sub pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
          </div>
        </div>
      </div>

      <!-- 右侧说明 / Right info panel -->
      <div class="bg-blue text-white rounded-3xl p-8 md:p-10 paper-shadow relative overflow-hidden">
        <div class="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10"></div>
        <div class="absolute -left-10 -bottom-10 w-48 h-48 rounded-full bg-white/5"></div>
        <div class="relative z-10">
          <div class="text-xs uppercase tracking-[0.28em] text-white/75 font-bold mb-4">
            How it works
          </div>
          <ul class="space-y-4 text-white/95 leading-7 text-[15px]">
            <li class="flex gap-3">
              <span class="w-6 h-6 rounded-full bg-white/15 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
              Create a book and add English articles you want to study.
            </li>
            <li class="flex gap-3">
              <span class="w-6 h-6 rounded-full bg-white/15 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
              Open a book, browse its articles, and start reading.
            </li>
            <li class="flex gap-3">
              <span class="w-6 h-6 rounded-full bg-white/15 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
              Highlight, bold, underline or color-mark any words or sentences.
            </li>
            <li class="flex gap-3">
              <span class="w-6 h-6 rounded-full bg-white/15 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">4</span>
              Attach notes and collect vocabulary — everything saves automatically.
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>

  <!-- 书架区域 / Bookshelf section -->
  <section class="max-w-7xl mx-auto px-6 md:px-10">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl md:text-3xl font-bold tracking-tight">
        Bookshelf
        <span class="text-sub text-base font-normal">({{ filtered.length }} books)</span>
      </h2>
    </div>

    <!-- 加载状态 / Loading state -->
    <div v-if="state.loading" class="bg-paper rounded-3xl soft-border p-10 text-center">
      <div class="text-lg font-semibold mb-2">Loading your bookshelf…</div>
    </div>

    <!-- 空状态 / Empty state -->
    <div
      v-else-if="filtered.length === 0"
      class="bg-paper rounded-3xl soft-border p-10 text-center"
    >
      <div class="text-5xl mb-4">📚</div>
      <div class="text-lg font-semibold mb-2">No books yet</div>
      <p class="text-sub mb-5">
        Click "New Book" to create your first book and start reading.
      </p>
      <button class="btn-primary mx-auto" @click="openCreate">+ New Book</button>
    </div>

    <!-- 书架展示 / Bookshelf display -->
    <div v-else class="bookshelf-container">
      <!-- 书籍网格 / Book grid -->
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 mb-4">
        <div
          v-for="book in filtered"
          :key="book.id"
          class="book-item group cursor-pointer"
          @click="router.push({ name: 'book-detail', params: { bookId: book.id } })"
        >
          <!-- 3D 书籍封面 / 3D Book cover -->
          <div class="book-3d">
            <div
              class="book-cover bg-gradient-to-br shadow-lg"
              :class="[BOOK_COLORS[book.color].bg, BOOK_COLORS[book.color].text]"
            >
              <!-- 书脊装饰 / Spine decoration -->
              <div class="book-spine"></div>
              <!-- 封面内容 / Cover content -->
              <div class="book-face">
                <div class="text-3xl mb-3">{{ book.icon || '📘' }}</div>
                <h3 class="text-sm font-bold leading-snug line-clamp-3 mb-2">
                  {{ book.title }}
                </h3>
                <div class="text-[10px] opacity-75 mt-auto">
                  {{ getBookArticleCount(book.id) }} articles
                </div>
              </div>
              <!-- 光泽效果 / Gloss effect -->
              <div class="book-gloss"></div>
            </div>
          </div>

          <!-- 书名标签（封面下方） / Title label below cover -->
          <div class="mt-3 text-center">
            <h3 class="text-sm font-bold leading-snug line-clamp-2 group-hover:text-blue transition">
              {{ book.title }}
            </h3>
            <p class="text-xs text-sub mt-1">
              {{ getBookArticleCount(book.id) }} articles · {{ formatDate(book.updatedAt) }}
            </p>
            <!-- 操作按钮 / Action buttons -->
            <div class="flex items-center justify-center gap-1.5 mt-2 opacity-0 group-hover:opacity-100 transition" @click.stop>
              <button
                class="text-[11px] px-2 py-0.5 rounded-full soft-border text-sub hover:text-blue hover:border-blue/40 transition"
                @click="openEdit(book)"
              >
                Edit
              </button>
              <button
                class="text-[11px] px-2 py-0.5 rounded-full soft-border text-sub hover:text-red-500 hover:border-red-400/40 transition"
                @click="handleDelete(book.id)"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 书架横条装饰 / Shelf bar decoration -->
      <div class="shelf-bar"></div>
    </div>
  </section>

  <!-- 新建/编辑书籍弹窗 / Create/Edit book dialog -->
  <div
    v-if="dialog.show"
    class="fixed inset-0 z-[80] bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
    @click.self="dialog.show = false"
  >
    <div class="bg-white rounded-3xl soft-border paper-shadow p-6 w-full max-w-md">
      <div class="text-xs uppercase tracking-[0.22em] text-blue font-bold mb-4">
        {{ dialog.editId ? 'Edit Book' : 'New Book' }}
      </div>

      <div class="space-y-4">
        <!-- 书名 / Title -->
        <div>
          <label class="text-xs text-sub uppercase tracking-wider mb-1 block">Book Title</label>
          <input v-model="dialog.title" class="field-lg" placeholder="e.g. Science & Society" />
        </div>

        <!-- 描述 / Description -->
        <div>
          <label class="text-xs text-sub uppercase tracking-wider mb-1 block">Description</label>
          <input v-model="dialog.description" class="field" placeholder="Short description…" />
        </div>

        <!-- 颜色选择 / Color picker -->
        <div>
          <label class="text-xs text-sub uppercase tracking-wider mb-2 block">Cover Color</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="c in COLOR_OPTIONS"
              :key="c"
              class="w-8 h-8 rounded-lg bg-gradient-to-br transition-all"
              :class="[
                BOOK_COLORS[c].bg,
                dialog.color === c ? 'ring-2 ring-offset-2 ring-blue scale-110' : 'opacity-70 hover:opacity-100',
              ]"
              @click="dialog.color = c"
            />
          </div>
        </div>

        <!-- 图标选择 / Icon picker -->
        <div>
          <label class="text-xs text-sub uppercase tracking-wider mb-2 block">Cover Icon</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="ic in ICON_OPTIONS"
              :key="ic"
              class="w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all"
              :class="[
                dialog.icon === ic
                  ? 'bg-blue/10 ring-2 ring-blue scale-110'
                  : 'bg-gray-100 hover:bg-gray-200',
              ]"
              @click="dialog.icon = ic"
            >
              {{ ic }}
            </button>
          </div>
        </div>

        <!-- 预览 / Preview -->
        <div>
          <label class="text-xs text-sub uppercase tracking-wider mb-2 block">Preview</label>
          <div class="flex justify-center">
            <div
              class="w-24 h-32 rounded-lg bg-gradient-to-br shadow-lg flex flex-col items-center justify-center p-2"
              :class="[BOOK_COLORS[dialog.color].bg, BOOK_COLORS[dialog.color].text]"
            >
              <div class="text-2xl mb-1">{{ dialog.icon }}</div>
              <div class="text-[9px] font-bold text-center leading-tight line-clamp-2">
                {{ dialog.title || 'Book Title' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 / Action buttons -->
      <div class="flex justify-end gap-2 mt-6">
        <button class="btn-ghost" @click="dialog.show = false">Cancel</button>
        <button class="btn-primary" @click="handleSave">
          {{ dialog.editId ? 'Save Changes' : 'Create Book' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ===================== 书架样式 / Bookshelf styles ===================== */

/* 书架底部横条 / Shelf bottom bar */
.shelf-bar {
  height: 12px;
  background: linear-gradient(to bottom, #c4a882, #a68b6b);
  border-radius: 0 0 6px 6px;
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  margin-top: -4px;
}

/* 3D 书本容器 / 3D Book container */
.book-3d {
  perspective: 600px;
  display: flex;
  justify-content: center;
}

/* 书籍封面 / Book cover */
.book-cover {
  width: 120px;
  height: 168px;
  border-radius: 4px 12px 12px 4px;
  position: relative;
  transform: rotateY(-8deg);
  transform-style: preserve-3d;
  transition: transform 0.35s ease, box-shadow 0.35s ease;
}

/* 悬停效果 / Hover effect */
.group:hover .book-cover {
  transform: rotateY(0deg) translateY(-8px);
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.2),
    0 8px 16px rgba(0, 0, 0, 0.1);
}

/* 书脊效果 / Spine effect */
.book-spine {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 14px;
  background: linear-gradient(to right, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.05));
  border-radius: 4px 0 0 4px;
}

/* 封面内容 / Cover face */
.book-face {
  position: absolute;
  inset: 0;
  padding: 16px 14px 12px 22px;
  display: flex;
  flex-direction: column;
  z-index: 2;
}

/* 光泽层 / Gloss layer */
.book-gloss {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.2) 0%,
    rgba(255, 255, 255, 0) 50%,
    rgba(0, 0, 0, 0.05) 100%
  );
  border-radius: 4px 12px 12px 4px;
  z-index: 3;
  pointer-events: none;
}
</style>
