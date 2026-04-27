/**
 * store.ts — 全局状态管理 / Global state management
 *
 * 使用 Vue reactive() 实现简易全局状态，管理：
 * - books（书籍列表）
 * - articles（文章列表）
 * - loading（加载状态）
 *
 * 所有数据操作都会同步到 Supabase 数据库。
 * All data operations sync to Supabase database.
 */

import { reactive } from 'vue'
import type { Article, Book, BookColor, NoteItem, VocabItem } from './types'
import { uid } from './utils/uid'
import {
  getBooks,
  getArticles,
  dbCreateBook,
  dbUpdateBook,
  dbDeleteBook,
  dbCreateArticle,
  dbUpdateArticle,
  dbDeleteArticle,
} from './db'

// ===================== 预设书籍颜色 / Preset book colors =====================

/**
 * 书籍封面颜色配置映射
 * Maps BookColor enum to CSS gradient & accent colors
 */
export const BOOK_COLORS: Record<BookColor, { bg: string; accent: string; text: string }> = {
  blue:    { bg: 'from-blue-600 to-blue-800',     accent: '#2563eb', text: 'text-white' },
  red:     { bg: 'from-red-500 to-red-700',       accent: '#ef4444', text: 'text-white' },
  green:   { bg: 'from-emerald-500 to-emerald-700', accent: '#10b981', text: 'text-white' },
  purple:  { bg: 'from-purple-500 to-purple-700', accent: '#8b5cf6', text: 'text-white' },
  orange:  { bg: 'from-orange-400 to-orange-600', accent: '#f97316', text: 'text-white' },
  teal:    { bg: 'from-teal-500 to-teal-700',     accent: '#14b8a6', text: 'text-white' },
  pink:    { bg: 'from-pink-400 to-pink-600',     accent: '#ec4899', text: 'text-white' },
  indigo:  { bg: 'from-indigo-500 to-indigo-700', accent: '#6366f1', text: 'text-white' },
  amber:   { bg: 'from-amber-400 to-amber-600',   accent: '#f59e0b', text: 'text-gray-900' },
  slate:   { bg: 'from-slate-600 to-slate-800',   accent: '#475569', text: 'text-white' },
}

/** 可用的颜色列表 / Available color list */
export const COLOR_OPTIONS: BookColor[] = Object.keys(BOOK_COLORS) as BookColor[]

/** 预设图标列表 / Available emoji icons for book covers */
export const ICON_OPTIONS = ['📘', '📕', '📗', '📙', '📓', '📚', '🌟', '🔬', '🎨', '🌍', '💡', '🎯', '📖', '✏️', '🧠']

// ===================== 默认数据 / Default seed data =====================

/** 默认书籍 / Default book for first-time users */
const DEFAULT_BOOK: Book = {
  id: 'default-book-001',
  title: 'Science & Society',
  description: 'Explore the intersection of science, technology, and modern society.',
  color: 'blue',
  icon: '🔬',
  createdAt: Date.now(),
  updatedAt: Date.now(),
}

/** 默认文章 / Default seed article */
const DEFAULT_ARTICLE: Article = {
  id: 'default-article-001',
  bookId: 'default-book-001',
  title: 'Can Science Fiction Tell Us About the Future?',
  subtitle: 'Science Fiction as a Window into Tomorrow',
  theme: 'Science & Society',
  level: 'Intermediate+',
  content: `
<p>Can science fiction tell us about the future? Setting aside aliens and spaceships, much <b>contemporary</b> science fiction explores themes such as the impact of artificial intelligence, the danger of <span class="hl-yellow">ecological collapse</span> and the abuse of corporate power. In all these cases, science fiction writers take advantage of the freedom to think about ongoing concerns and picture their future prospects, coming to surprising and <b>thought-provoking</b> conclusions.</p>
<p>Unlike pure fantasy, science fiction has <span class="hl-blue">predictive value</span>: it often accurately predicts, to a striking extent, upcoming technological, social and political trends&mdash;but this applies to the near term, not the distant future it often sets. <b>This is the first of three ways it offers a glimpse of the future.</b></p>
<p>Secondly, it expands horizons when assessing future possibilities for planning purposes. France&rsquo;s Defence Innovation Agency is setting up a &ldquo;red team&rdquo; of science fiction writers to outline situations that might not have occurred to military planners. Similarly, tech giants including Google and Apple have also recruited science fiction writers as consultants, using a process sometimes called <span class="hl-pink">&ldquo;design fiction&rdquo;</span>.</p>
<p>The third one is more direct: by inspiring people in the tech industry who desire to make such visions a reality. The creation of the mobile phone at Motorola was motivated by the handheld wireless communicators from Star Trek, and Amazon&rsquo;s Alexa voice-assistant by the talking computer on the Enterprise. <b>The future technology leaders are undoubtedly reading science fiction today.</b></p>
`.trim(),
  vocab: [
    { id: uid(), word: 'contemporary', pos: 'adj.', meaning: '现代的、当代的' },
    { id: uid(), word: 'ecological collapse', pos: 'phrase', meaning: '生态系统崩溃' },
    { id: uid(), word: 'predictive value', pos: 'phrase', meaning: '预测价值' },
    { id: uid(), word: 'glimpse', pos: 'noun', meaning: '一瞥，片刻的一见' },
    { id: uid(), word: 'expand horizons', pos: 'phrase', meaning: '开阔视野' },
    { id: uid(), word: 'make ... a reality', pos: 'phrase', meaning: '把...变为现实' },
  ],
  notes: [
    {
      id: uid(),
      quote: 'This is the first of three ways it offers a glimpse of the future.',
      note: '文章结构句：作者明确提出总共三点论据，下文按 first / secondly / the third 展开。',
      color: 'blue',
      createdAt: Date.now(),
    },
  ],
  keywords: ['science fiction', 'AI', 'prediction', 'design fiction', 'innovation'],
  sortOrder: 0,
  createdAt: Date.now(),
  updatedAt: Date.now(),
}

// ===================== 全局响应式状态 / Global reactive state =====================

/** 应用的全局状态 / Application global state */
interface AppState {
  /** 所有书籍 / All books */
  books: Book[]
  /** 所有文章 / All articles */
  articles: Article[]
  /** 加载中标志 / Loading flag */
  loading: boolean
}

export const state = reactive<AppState>({
  books: [],
  articles: [],
  loading: true,
})

// ===================== 初始化加载 / Initialization =====================

/**
 * 从数据库加载所有数据
 * Load all data from the database on app startup
 */
async function loadFromDB(): Promise<void> {
  try {
    let [books, articles] = await Promise.all([getBooks(), getArticles()])

    // 如果数据库为空，插入默认数据 / If DB is empty, seed with defaults
    if (books.length === 0) {
      console.log('数据库为空，插入默认书籍和文章 / DB empty, seeding defaults...')
      const book = await dbCreateBook(DEFAULT_BOOK)
      if (book) {
        books = [book]
      } else {
        books = [DEFAULT_BOOK]
      }
      const article = await dbCreateArticle(DEFAULT_ARTICLE)
      if (article) {
        articles = [article]
      } else {
        articles = [DEFAULT_ARTICLE]
      }
    }

    state.books = books
    state.articles = articles
    state.loading = false
  } catch (err) {
    console.warn('从数据库加载失败，使用默认数据 / DB load failed, using defaults:', err)
    state.books = [DEFAULT_BOOK]
    state.articles = [DEFAULT_ARTICLE]
    state.loading = false
  }
}

// 应用启动时立即加载 / Load on app startup
loadFromDB()

// ===================== 书籍查询 / Book queries =====================

/**
 * 根据ID获取书籍
 * Get a book by its ID
 */
export function getBook(id: string): Book | undefined {
  return state.books.find((b) => b.id === id)
}

/**
 * 获取某本书下的所有文章
 * Get all articles belonging to a book
 */
export function getBookArticles(bookId: string): Article[] {
  return state.articles
    .filter((a) => a.bookId === bookId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

/**
 * 获取某本书的文章数量
 * Get the article count for a book
 */
export function getBookArticleCount(bookId: string): number {
  return state.articles.filter((a) => a.bookId === bookId).length
}

// ===================== 书籍操作 / Book mutations =====================

/**
 * 创建一本新书
 * Create a new book
 *
 * @param partial - 书籍的部分字段 / Partial book fields
 * @returns 创建的书籍对象 / The created book object
 */
export async function createBook(partial?: Partial<Book>): Promise<Book> {
  const now = Date.now()
  const book: Book = {
    id: uid(),
    title: partial?.title ?? 'New Book',
    description: partial?.description ?? '',
    color: partial?.color ?? 'blue',
    icon: partial?.icon ?? '📘',
    createdAt: now,
    updatedAt: now,
  }

  const result = await dbCreateBook(book)
  if (result) {
    state.books.unshift(result)
    return result
  }
  // 数据库失败时也保存到state / Fallback to state if DB fails
  state.books.unshift(book)
  return book
}

/**
 * 更新书籍信息
 * Update book information
 *
 * @param id - 书籍ID / Book ID
 * @param partial - 要更新的字段 / Fields to update
 */
export async function updateBook(id: string, partial: Partial<Book>): Promise<void> {
  const idx = state.books.findIndex((b) => b.id === id)
  if (idx < 0) return

  const updated: Book = {
    ...state.books[idx],
    ...partial,
    updatedAt: Date.now(),
  }
  await dbUpdateBook(updated)
  state.books[idx] = updated
}

/**
 * 删除一本书及其所有文章
 * Delete a book and all its articles
 *
 * @param id - 书籍ID / Book ID
 */
export async function deleteBook(id: string): Promise<void> {
  const idx = state.books.findIndex((b) => b.id === id)
  if (idx < 0) return

  await dbDeleteBook(id)
  state.books.splice(idx, 1)
  // 同时从state中移除该书的所有文章 / Also remove all articles from state
  state.articles = state.articles.filter((a) => a.bookId !== id)
}

// ===================== 文章查询 / Article queries =====================

/**
 * 根据ID获取文章
 * Get an article by its ID
 */
export function getArticle(id: string): Article | undefined {
  return state.articles.find((a) => a.id === id)
}

// ===================== 文章操作 / Article mutations =====================

/**
 * 创建新文章
 * Create a new article within a book
 *
 * @param bookId - 所属书籍ID / The book this article belongs to
 * @param partial - 文章的部分字段 / Partial article fields
 * @returns 创建的文章对象 / The created article object
 */
export async function createArticle(bookId: string, partial?: Partial<Article>): Promise<Article> {
  const now = Date.now()
  // 计算排序序号（放到最后） / Calculate sort order (append at end)
  const existingCount = state.articles.filter((a) => a.bookId === bookId).length

  const article: Article = {
    id: uid(),
    bookId,
    title: partial?.title ?? 'Untitled Article',
    subtitle: partial?.subtitle ?? '',
    theme: partial?.theme ?? 'General',
    level: partial?.level ?? 'Intermediate',
    content: partial?.content ?? '<p>Start writing your article here...</p>',
    vocab: partial?.vocab ?? [],
    notes: partial?.notes ?? [],
    keywords: partial?.keywords ?? [],
    sortOrder: existingCount,
    createdAt: now,
    updatedAt: now,
  }

  const result = await dbCreateArticle(article)
  if (result) {
    state.articles.unshift(result)
    return result
  }
  state.articles.unshift(article)
  return article
}

/**
 * 更新文章内容或元数据
 * Update article content or metadata
 *
 * @param id - 文章ID / Article ID
 * @param partial - 要更新的字段 / Fields to update
 */
export async function updateArticle(id: string, partial: Partial<Article>): Promise<void> {
  const idx = state.articles.findIndex((a) => a.id === id)
  if (idx < 0) return

  const updated: Article = {
    ...state.articles[idx],
    ...partial,
    updatedAt: Date.now(),
  }
  await dbUpdateArticle(updated)
  state.articles[idx] = updated
}

/**
 * 删除文章
 * Delete an article
 *
 * @param id - 文章ID / Article ID
 */
export async function deleteArticle(id: string): Promise<void> {
  const idx = state.articles.findIndex((a) => a.id === id)
  if (idx < 0) return

  await dbDeleteArticle(id)
  state.articles.splice(idx, 1)
}

// ===================== 生词操作 / Vocabulary operations =====================

/**
 * 为文章添加一个生词
 * Add a vocabulary entry to an article
 *
 * @param articleId - 文章ID / Article ID
 * @param v - 生词信息（不含ID） / Vocab info without ID
 */
export async function addVocab(articleId: string, v: Omit<VocabItem, 'id'>): Promise<void> {
  const a = getArticle(articleId)
  if (!a) return
  a.vocab.push({ id: uid(), ...v })
  a.updatedAt = Date.now()
  await dbUpdateArticle(a)
}

/**
 * 从文章中移除一个生词
 * Remove a vocabulary entry from an article
 *
 * @param articleId - 文章ID / Article ID
 * @param vocabId - 生词ID / Vocab entry ID
 */
export async function removeVocab(articleId: string, vocabId: string): Promise<void> {
  const a = getArticle(articleId)
  if (!a) return
  const i = a.vocab.findIndex((x) => x.id === vocabId)
  if (i >= 0) a.vocab.splice(i, 1)
  a.updatedAt = Date.now()
  await dbUpdateArticle(a)
}

// ===================== 笔记操作 / Note operations =====================

/**
 * 为文章添加一条笔记
 * Add a note to an article
 *
 * @param articleId - 文章ID / Article ID
 * @param n - 笔记信息（不含ID和时间戳） / Note info without ID and timestamp
 * @returns 创建的笔记对象 / The created note object
 */
export async function addNote(
  articleId: string,
  n: Omit<NoteItem, 'id' | 'createdAt'>
): Promise<NoteItem | undefined> {
  const a = getArticle(articleId)
  if (!a) return
  const note: NoteItem = { id: uid(), createdAt: Date.now(), ...n }
  a.notes.unshift(note)
  a.updatedAt = Date.now()
  await dbUpdateArticle(a)
  return note
}

/**
 * 删除文章中的一条笔记
 * Remove a note from an article
 *
 * @param articleId - 文章ID / Article ID
 * @param noteId - 笔记ID / Note ID
 */
export async function removeNote(articleId: string, noteId: string): Promise<void> {
  const a = getArticle(articleId)
  if (!a) return
  const i = a.notes.findIndex((x) => x.id === noteId)
  if (i >= 0) a.notes.splice(i, 1)
  a.updatedAt = Date.now()
  await dbUpdateArticle(a)
}

/**
 * 更新文章中的一条笔记
 * Update a note in an article
 *
 * @param articleId - 文章ID / Article ID
 * @param noteId - 笔记ID / Note ID
 * @param patch - 要更新的字段 / Fields to patch
 */
export async function updateNote(
  articleId: string,
  noteId: string,
  patch: Partial<NoteItem>
): Promise<void> {
  const a = getArticle(articleId)
  if (!a) return
  const n = a.notes.find((x) => x.id === noteId)
  if (n) Object.assign(n, patch)
  a.updatedAt = Date.now()
  await dbUpdateArticle(a)
}

export { uid }
