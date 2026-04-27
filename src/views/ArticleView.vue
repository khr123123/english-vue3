<!--
  ArticleView.vue — 文章阅读页面 / Article reading view

  核心功能：
  - 阅读富文本文章
  - 选中文本后弹出浮动工具栏，可进行：
    · 加粗 / Bold
    · 下划线 / Underline
    · 彩色高亮（黄/蓝/粉/绿） / Color highlights
    · 清除格式 / Clear formatting  ← 修复：现在可以正确取消标记
    · 添加笔记 / Add note
    · 添加生词 / Add vocab
  - 侧边栏展示笔记、生词、关键词

  Core features:
  - Read rich-text articles
  - Floating toolbar on text selection:
    · Bold, underline, color highlights
    · Clear formatting (FIX: marks can now be properly removed)
    · Add notes, add vocabulary
  - Sidebar with notes, vocab, keywords
-->

<script setup lang="ts">
import { computed, nextTick, onMounted, onBeforeUnmount, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getArticle,
  getBook,
  updateArticle,
  addNote,
  removeNote,
  addVocab,
  removeVocab,
  deleteArticle,
} from '../store'
import type { NoteItem } from '../types'

const route = useRoute()
const router = useRouter()

/** 当前书籍ID / Current book ID */
const bookId = computed(() => String(route.params.bookId))
/** 当前文章ID / Current article ID */
const id = computed(() => String(route.params.id))
/** 当前书籍对象 / Current book object */
const book = computed(() => getBook(bookId.value))
/** 当前文章对象 / Current article object */
const article = computed(() => getArticle(id.value))

/** 内容区域的DOM引用 / DOM ref for the content area */
const contentRef = ref<HTMLDivElement | null>(null)

// ===================== 浮动工具栏状态 / Floating toolbar state =====================

const toolbar = reactive({
  show: false,
  top: 0,
  left: 0,
})

// ===================== 笔记弹窗状态 / Note popover state =====================

const notePopover = reactive({
  show: false,
  top: 0,
  left: 0,
  quote: '',
  text: '',
  range: null as Range | null,
})

// ===================== 笔记预览状态 / Active note preview state =====================

const activeNote = reactive({
  show: false,
  top: 0,
  left: 0,
  noteId: '',
})

// ===================== 生词表单状态 / Vocab form state =====================

const vocabForm = reactive({
  show: false,
  word: '',
  pos: '',
  meaning: '',
})

// ===================== 工具栏定位 / Toolbar positioning =====================

/**
 * 根据当前选中文本计算浮动工具栏的位置
 * Calculate floating toolbar position from current text selection
 */
function positionFromSelection(sel: Selection) {
  const range = sel.getRangeAt(0)
  const rect = range.getBoundingClientRect()
  const containerRect = contentRef.value!.getBoundingClientRect()
  const top = rect.top - containerRect.top - 44
  const left = rect.left - containerRect.left + rect.width / 2 - 120
  return {
    top: Math.max(top, -8),
    left: Math.max(Math.min(left, containerRect.width - 240), 4),
  }
}

/**
 * 处理文本选择事件：判断是否显示工具栏
 * Handle text selection: show/hide toolbar
 */
function handleSelection() {
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed || !contentRef.value) {
    toolbar.show = false
    return
  }
  const anchorNode = sel.anchorNode
  const focusNode = sel.focusNode
  // 选区必须在内容区域内 / Selection must be inside content area
  if (
    !anchorNode ||
    !focusNode ||
    !contentRef.value.contains(anchorNode) ||
    !contentRef.value.contains(focusNode)
  ) {
    toolbar.show = false
    return
  }
  const { top, left } = positionFromSelection(sel)
  toolbar.top = top
  toolbar.left = left
  toolbar.show = true
}

// ===================== 标记操作 / Mark operations =====================

/**
 * 【核心】对选中文本应用格式或清除格式
 *
 * type 为 'clear' 时，会执行以下操作来确保完全取消标记：
 * 1. 调用 document.execCommand('removeFormat') 移除行内样式
 * 2. 递归遍历选区内所有标记元素（span.hl-*, span.underline-mark, b, strong）
 * 3. 将标记元素"解包"：保留内部文本，移除外层标签
 *
 * [Core] Apply formatting to selection, or clear all formatting.
 *
 * When type is 'clear':
 * 1. Calls removeFormat to strip inline styles
 * 2. Recursively finds all mark elements within the selection range
 * 3. "Unwraps" them: keeps inner text, removes outer tags
 */
function wrapSelection(
  type: 'bold' | 'underline' | 'hl-yellow' | 'hl-blue' | 'hl-pink' | 'hl-green' | 'clear'
) {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return
  const range = sel.getRangeAt(0)
  if (!contentRef.value?.contains(range.commonAncestorContainer)) return

  if (type === 'clear') {
    // ========== 清除格式（修复版） / Clear formatting (FIXED) ==========
    // 步骤1: 移除浏览器内置格式 / Step 1: Remove browser inline formatting
    document.execCommand('removeFormat')

    // 步骤2: 找到选区内所有自定义标记并解包
    // Step 2: Find all custom marks in selection and unwrap them
    unwrapMarksInRange(range)

    // 步骤3: 再次获取选区并清理可能遗留的空元素
    // Step 3: Clean up any leftover empty elements
    cleanEmptyMarks()

    persist()
    sel.removeAllRanges()
    toolbar.show = false
    return
  }

  // ========== 应用新格式 / Apply new formatting ==========

  // 【修复关键】如果选区完全在一个同类型的标记内，则取消该标记（toggle行为）
  // [FIX KEY] If selection is entirely inside a mark of the same type, unwrap it (toggle)
  const existingMark = findEnclosingMark(range, type)
  if (existingMark) {
    unwrapElement(existingMark)
    persist()
    sel.removeAllRanges()
    toolbar.show = false
    return
  }

  // 否则正常包裹 / Otherwise wrap normally
  let wrapper: HTMLElement
  if (type === 'bold') {
    wrapper = document.createElement('b')
  } else if (type === 'underline') {
    wrapper = document.createElement('span')
    wrapper.className = 'underline-mark'
  } else {
    wrapper = document.createElement('span')
    wrapper.className = type
  }

  try {
    const contents = range.extractContents()
    wrapper.appendChild(contents)
    range.insertNode(wrapper)
    sel.removeAllRanges()
    toolbar.show = false
    persist()
  } catch (e) {
    console.warn('wrapSelection error:', e)
  }
}

/**
 * 查找选区是否完全包含在某个标记元素内
 * Check if the selection range is entirely contained within a mark element of the given type
 *
 * @param range - 当前选区范围 / Current selection range
 * @param type - 标记类型 / Mark type to check
 * @returns 包含选区的标记元素，或null / The enclosing mark element, or null
 */
function findEnclosingMark(
  range: Range,
  type: 'bold' | 'underline' | 'hl-yellow' | 'hl-blue' | 'hl-pink' | 'hl-green'
): HTMLElement | null {
  let node = range.commonAncestorContainer as Node | null
  // 如果是文本节点，先上升到父元素 / If text node, go to parent
  if (node && node.nodeType === Node.TEXT_NODE) {
    node = node.parentElement
  }

  while (node && node !== contentRef.value) {
    if (node instanceof HTMLElement) {
      if (type === 'bold' && (node.tagName === 'B' || node.tagName === 'STRONG')) {
        return node
      }
      if (type === 'underline' && node.classList?.contains('underline-mark')) {
        return node
      }
      if (
        ['hl-yellow', 'hl-blue', 'hl-pink', 'hl-green'].includes(type) &&
        node.classList?.contains(type)
      ) {
        return node
      }
    }
    node = node.parentNode
  }
  return null
}

/**
 * 解包一个元素：保留其内部内容，移除外层标签
 * Unwrap an element: keep its children, remove the wrapper tag
 *
 * @param el - 要解包的元素 / Element to unwrap
 */
function unwrapElement(el: HTMLElement): void {
  const parent = el.parentNode
  if (!parent) return
  while (el.firstChild) {
    parent.insertBefore(el.firstChild, el)
  }
  parent.removeChild(el)
}

/**
 * 在选区范围内解包所有标记元素
 * Unwrap all mark elements within the given range
 *
 * 使用 TreeWalker 遍历选区内的所有元素节点，
 * 如果是我们的标记类型则解包。
 *
 * Uses TreeWalker to iterate all element nodes in the range,
 * unwrapping any that are our custom mark types.
 *
 * @param range - 选区范围 / Selection range
 */
function unwrapMarksInRange(range: Range): void {
  if (!contentRef.value) return

  // 选择器：所有自定义标记类型 / Selector: all custom mark types
  const selector =
    'span.hl-yellow, span.hl-blue, span.hl-pink, span.hl-green, span.underline-mark, b, strong'

  // 收集需要解包的元素（不能在遍历时修改DOM）
  // Collect elements to unwrap (can't modify DOM while iterating)
  const toUnwrap: HTMLElement[] = []
  const marks = contentRef.value.querySelectorAll(selector)
  marks.forEach((m) => {
    if (range.intersectsNode(m)) {
      toUnwrap.push(m as HTMLElement)
    }
  })

  // 从内到外解包（先处理嵌套最深的）
  // Unwrap from inside out (deepest first)
  toUnwrap.reverse().forEach((m) => unwrapElement(m))
}

/**
 * 清理内容区域中的空标记元素
 * Clean up empty mark elements in the content area
 */
function cleanEmptyMarks(): void {
  if (!contentRef.value) return
  const selector =
    'span.hl-yellow, span.hl-blue, span.hl-pink, span.hl-green, span.underline-mark'
  const empties = contentRef.value.querySelectorAll(selector)
  empties.forEach((el) => {
    if (!el.textContent?.trim()) {
      el.parentNode?.removeChild(el)
    }
  })
}

// ===================== 笔记操作 / Note operations =====================

/**
 * 从当前选区开始创建笔记
 * Start creating a note from current selection
 */
function startNoteFromSelection() {
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed || !contentRef.value) return
  const range = sel.getRangeAt(0)
  if (!contentRef.value.contains(range.commonAncestorContainer)) return

  notePopover.quote = sel.toString().trim()
  notePopover.text = ''
  notePopover.range = range.cloneRange()
  notePopover.top = toolbar.top + 40
  notePopover.left = toolbar.left
  notePopover.show = true
  toolbar.show = false
}

/**
 * 保存笔记并在文章内容中添加标记
 * Save note and add a mark in the article content
 */
async function saveNote() {
  const a = article.value
  if (!a || !notePopover.range) return

  const noteText = notePopover.text.trim()
  if (!noteText) {
    notePopover.show = false
    return
  }

  // 添加笔记到数据 / Add note to data
  const note = await addNote(a.id, {
    quote: notePopover.quote,
    note: noteText,
    color: 'blue',
  })
  if (!note) return

  // 在DOM中包裹选区为笔记标记 / Wrap selection in DOM with note-mark
  try {
    const wrap = document.createElement('span')
    wrap.className = 'note-mark'
    wrap.setAttribute('data-note-id', note.id)
    wrap.title = noteText.slice(0, 80)
    wrap.appendChild(notePopover.range.extractContents())
    notePopover.range.insertNode(wrap)
    window.getSelection()?.removeAllRanges()
  } catch (e) {
    console.warn('saveNote wrap error:', e)
  }

  notePopover.show = false
  persist()
}

/** 取消笔记编辑 / Cancel note editing */
function cancelNote() {
  notePopover.show = false
}

/**
 * 将当前内容保存到数据库
 * Persist current content to database
 */
function persist() {
  const a = article.value
  if (!a || !contentRef.value) return
  updateArticle(a.id, { content: contentRef.value.innerHTML })
}

/**
 * 滚动到文章中对应笔记的位置
 * Scroll to the note mark position in the article
 */
function scrollToNote(note: NoteItem) {
  if (!contentRef.value) return
  const target = contentRef.value.querySelector<HTMLElement>(
    `span.note-mark[data-note-id="${note.id}"]`
  )
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    // 闪烁高亮效果 / Flash highlight effect
    target.style.transition = 'background-color .4s'
    const original = target.style.backgroundColor
    target.style.backgroundColor = 'rgba(250, 204, 21, 0.45)'
    setTimeout(() => {
      target.style.backgroundColor = original
    }, 1200)
  }
}

/**
 * 点击文章内容时检测是否点击了笔记标记
 * Handle content click: detect if a note-mark was clicked
 */
function handleContentClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  const mark = target.closest('span.note-mark') as HTMLElement | null
  if (mark && contentRef.value?.contains(mark)) {
    const noteId = mark.getAttribute('data-note-id') || ''
    activeNote.noteId = noteId
    const r = mark.getBoundingClientRect()
    const cr = contentRef.value.getBoundingClientRect()
    activeNote.top = r.bottom - cr.top + 4
    activeNote.left = Math.min(r.left - cr.left, cr.width - 280)
    activeNote.show = true
  } else {
    activeNote.show = false
  }
}

/**
 * 删除一条笔记，同时移除DOM中的标记
 * Delete a note and remove its mark from the DOM
 */
function handleDeleteNote(nid: string) {
  const a = article.value
  if (!a) return

  // 从数据中删除 / Remove from data
  removeNote(a.id, nid)

  // 从DOM中解包笔记标记 / Unwrap note-mark from DOM
  if (contentRef.value) {
    const el = contentRef.value.querySelector<HTMLElement>(
      `span.note-mark[data-note-id="${nid}"]`
    )
    if (el) unwrapElement(el)
  }

  activeNote.show = false
  persist()
}

// ===================== 生词操作 / Vocab operations =====================

/**
 * 添加生词
 * Add a vocabulary entry
 */
function handleAddVocab() {
  const a = article.value
  if (!a) return
  const word = vocabForm.word.trim()
  if (!word) return

  addVocab(a.id, {
    word,
    pos: vocabForm.pos.trim(),
    meaning: vocabForm.meaning.trim(),
  })

  // 重置表单 / Reset form
  vocabForm.word = ''
  vocabForm.pos = ''
  vocabForm.meaning = ''
  vocabForm.show = false
}

/**
 * 从选中文本创建生词条目
 * Create a vocab entry from selected text
 */
function handleAddSelectionAsVocab() {
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed) {
    vocabForm.show = true
    return
  }
  const text = sel.toString().trim()
  if (text && contentRef.value?.contains(sel.anchorNode)) {
    vocabForm.word = text
    vocabForm.show = true
    toolbar.show = false
  } else {
    vocabForm.show = true
  }
}

// ===================== 文章删除 / Article deletion =====================

/**
 * 删除当前文章
 * Delete the current article
 */
function handleDeleteArticle() {
  const a = article.value
  if (!a) return
  if (confirm('Delete this article?')) {
    deleteArticle(a.id)
    router.push({ name: 'book-detail', params: { bookId: bookId.value } })
  }
}

// ===================== 全局事件监听 / Global event listeners =====================

/**
 * 鼠标抬起事件：延迟检测选区状态以显示工具栏
 * Mouse up event: delayed selection check to show toolbar
 */
function onDocMouseUp(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (target.closest('.float-toolbar')) return
  setTimeout(handleSelection, 0)
}

/**
 * 鼠标按下事件：隐藏活跃的笔记预览
 * Mouse down event: hide active note preview
 */
function onDocMouseDown(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (
    !target.closest('.float-toolbar') &&
    !target.closest('.note-mark') &&
    !target.closest('.active-note-popover')
  ) {
    activeNote.show = false
  }
}

// ===================== 生命周期 / Lifecycle =====================

onMounted(() => {
  document.addEventListener('mouseup', onDocMouseUp)
  document.addEventListener('mousedown', onDocMouseDown)

  // 确保文章存在 / Ensure article exists
  if (!article.value) {
    router.replace('/')
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('mouseup', onDocMouseUp)
  document.removeEventListener('mousedown', onDocMouseDown)
})

/**
 * 获取当前活跃的笔记对象
 * Get the currently active note object
 */
function activeNoteObject(): NoteItem | undefined {
  const a = article.value
  if (!a) return
  return a.notes.find((n) => n.id === activeNote.noteId)
}
</script>

<template>
  <section v-if="article" class="max-w-7xl mx-auto px-6 md:px-10 mb-10">
    <!-- 顶部导航栏 / Top navigation -->
    <div class="flex flex-wrap items-center justify-between gap-3 mb-8">
      <div class="flex items-center gap-3 text-sm text-sub">
        <button
          class="btn-ghost"
          @click="router.push({ name: 'book-detail', params: { bookId: bookId } })"
        >
          ← {{ book?.title || 'Book' }}
        </button>
        <span class="text-xs uppercase tracking-[0.24em] mono">{{ article.theme }}</span>
      </div>
      <div class="flex gap-2">
        <button class="btn-ghost" @click="vocabForm.show = true">+ Vocab</button>
        <button
          class="btn-primary"
          @click="router.push({ name: 'article-edit', params: { bookId, id: article.id } })"
        >
          Edit Article
        </button>
        <button class="btn-ghost" @click="handleDeleteArticle">Delete</button>
      </div>
    </div>

    <!-- 文章标题横幅 / Article title banner -->
    <div class="bg-paper soft-border rounded-3xl p-8 md:p-10 paper-shadow mb-8">
      <div class="text-xs uppercase tracking-[0.28em] text-blue font-bold mb-4">Reading</div>
      <h1 class="text-3xl md:text-5xl font-bold tracking-tight leading-tight mb-4">
        {{ article.title }}
      </h1>
      <p v-if="article.subtitle" class="text-sub text-lg leading-8 max-w-3xl">
        {{ article.subtitle }}
      </p>
    </div>
  </section>

  <!-- 正文和侧边栏布局 / Content & sidebar layout -->
  <section v-if="article" class="max-w-7xl mx-auto px-6 md:px-10">
    <div class="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-8">
      <!-- ========== 文章正文区域 / Article content area ========== -->
      <div class="min-w-0">
        <article class="bg-white/70 rounded-3xl p-6 md:p-10 soft-border paper-shadow relative">
          <div class="max-w-3xl mx-auto relative">
            <!-- 提示条 / Instruction bar -->
            <div class="mb-6 flex items-center justify-between gap-4">
              <div class="text-xs uppercase tracking-[0.24em] text-blue font-bold">
                Original Article
              </div>
              <div class="text-xs text-sub">
                Select any text to highlight, bold, underline, or add a note. Click again to remove.
              </div>
            </div>

            <!-- 文章内容（v-html 渲染） / Article content (v-html rendered) -->
            <div
              ref="contentRef"
              class="article-content relative"
              v-html="article.content"
              @click="handleContentClick"
            ></div>

            <!-- ========== 浮动工具栏 / Floating toolbar ========== -->
            <div
              v-show="toolbar.show"
              class="float-toolbar"
              :style="{ top: toolbar.top + 'px', left: toolbar.left + 'px' }"
            >
              <button title="Bold (toggle)" @mousedown.prevent @click="wrapSelection('bold')">
                <b>B</b>
              </button>
              <button title="Underline (toggle)" @mousedown.prevent @click="wrapSelection('underline')">
                <u>U</u>
              </button>
              <span class="sep" />
              <button title="Yellow highlight (toggle)" @mousedown.prevent @click="wrapSelection('hl-yellow')">
                <span class="w-3.5 h-3.5 rounded-sm inline-block" style="background: #facc15"></span>
              </button>
              <button title="Blue highlight (toggle)" @mousedown.prevent @click="wrapSelection('hl-blue')">
                <span class="w-3.5 h-3.5 rounded-sm inline-block" style="background: #2B59C3"></span>
              </button>
              <button title="Pink highlight (toggle)" @mousedown.prevent @click="wrapSelection('hl-pink')">
                <span class="w-3.5 h-3.5 rounded-sm inline-block" style="background: #ec4899"></span>
              </button>
              <button title="Green highlight (toggle)" @mousedown.prevent @click="wrapSelection('hl-green')">
                <span class="w-3.5 h-3.5 rounded-sm inline-block" style="background: #22c55e"></span>
              </button>
              <span class="sep" />
              <button title="Clear all formatting" @mousedown.prevent @click="wrapSelection('clear')">
                ✕
              </button>
              <span class="sep" />
              <button title="Add note" @mousedown.prevent @click="startNoteFromSelection">
                ✎
              </button>
              <button title="Add to vocab" @mousedown.prevent @click="handleAddSelectionAsVocab">
                A+
              </button>
            </div>

            <!-- ========== 笔记编辑弹窗 / Note compose popover ========== -->
            <div
              v-if="notePopover.show"
              class="note-popover absolute z-[70] bg-white rounded-2xl soft-border paper-shadow p-4 w-[320px]"
              :style="{ top: notePopover.top + 'px', left: notePopover.left + 'px' }"
            >
              <div class="text-xs uppercase tracking-[0.18em] text-blue font-bold mb-2">
                Add Note
              </div>
              <div class="bg-blueSoft/50 rounded-lg p-2 text-xs text-blue/90 mb-3 line-clamp-3">
                "{{ notePopover.quote }}"
              </div>
              <textarea
                v-model="notePopover.text"
                rows="3"
                class="field"
                placeholder="Your thought about this passage…"
              ></textarea>
              <div class="flex justify-end gap-2 mt-3">
                <button class="btn-ghost" @click="cancelNote">Cancel</button>
                <button class="btn-primary" @click="saveNote">Save</button>
              </div>
            </div>

            <!-- ========== 笔记预览弹窗 / Active note preview popover ========== -->
            <div
              v-if="activeNote.show && activeNoteObject()"
              class="active-note-popover absolute z-[65] bg-white rounded-2xl soft-border paper-shadow p-4 w-[320px]"
              :style="{ top: activeNote.top + 'px', left: activeNote.left + 'px' }"
            >
              <div class="flex justify-between items-center mb-2">
                <div class="text-xs uppercase tracking-[0.18em] text-blue font-bold">Note</div>
                <button
                  class="text-xs text-sub hover:text-red-500"
                  @click="handleDeleteNote(activeNote.noteId)"
                >
                  Remove
                </button>
              </div>
              <div class="bg-blueSoft/50 rounded-lg p-2 text-xs text-blue/90 mb-3 line-clamp-3">
                "{{ activeNoteObject()?.quote }}"
              </div>
              <p class="text-sm text-textmain leading-7">
                {{ activeNoteObject()?.note }}
              </p>
            </div>
          </div>
        </article>
      </div>

      <!-- ========== 侧边栏 / Sidebar ========== -->
      <aside class="space-y-6">
        <!-- 笔记面板 / Notes panel -->
        <div class="bg-paper rounded-3xl p-5 soft-border">
          <div class="flex items-center justify-between mb-3">
            <div class="text-xs uppercase tracking-[0.22em] text-blue font-bold">
              Notes
              <span class="text-sub mono ml-1">({{ article.notes.length }})</span>
            </div>
          </div>
          <p v-if="article.notes.length === 0" class="text-sm text-sub leading-6">
            Select any part of the article and tap <span class="mono">✎</span> to add your first note.
          </p>
          <ul v-else class="space-y-3">
            <li
              v-for="n in article.notes"
              :key="n.id"
              class="bg-white/70 rounded-2xl soft-border p-3 cursor-pointer hover:border-blue/40 transition"
              @click="scrollToNote(n)"
            >
              <div class="text-xs text-blue/90 mono mb-1 line-clamp-2">"{{ n.quote }}"</div>
              <div class="text-sm leading-6 text-textmain mb-2">{{ n.note }}</div>
              <div class="flex justify-end">
                <button
                  class="text-xs text-sub hover:text-red-500"
                  @click.stop="handleDeleteNote(n.id)"
                >
                  Delete
                </button>
              </div>
            </li>
          </ul>
        </div>

        <!-- 生词面板 / Vocabulary panel -->
        <div class="bg-paper rounded-3xl p-5 soft-border">
          <div class="flex items-center justify-between mb-3">
            <div class="text-xs uppercase tracking-[0.22em] text-blue font-bold">
              Vocabulary
              <span class="text-sub mono ml-1">({{ article.vocab.length }})</span>
            </div>
            <button class="text-xs text-blue hover:underline" @click="vocabForm.show = true">
              + Add
            </button>
          </div>
          <ul v-if="article.vocab.length" class="space-y-2">
            <li
              v-for="v in article.vocab"
              :key="v.id"
              class="bg-white/70 rounded-xl soft-border p-3"
            >
              <div class="flex items-center justify-between mb-1">
                <h4 class="font-bold text-sm">{{ v.word }}</h4>
                <span class="mono text-[10px] text-sub">{{ v.pos || '—' }}</span>
              </div>
              <p class="text-xs text-sub leading-5">{{ v.meaning }}</p>
              <div class="flex justify-end mt-1">
                <button
                  class="text-[11px] text-sub hover:text-red-500"
                  @click="removeVocab(article!.id, v.id)"
                >
                  remove
                </button>
              </div>
            </li>
          </ul>
          <p v-else class="text-sm text-sub leading-6">
            No vocab yet. Select a word in the article and use <span class="mono">A+</span>.
          </p>
        </div>

        <!-- 关键词面板 / Keywords panel -->
        <div class="bg-paper rounded-3xl p-5 soft-border">
          <div class="text-xs uppercase tracking-[0.22em] text-blue font-bold mb-3">Keywords</div>
          <div v-if="article.keywords.length" class="flex flex-wrap gap-2">
            <span v-for="(k, i) in article.keywords" :key="i" class="tag">{{ k }}</span>
          </div>
          <p v-else class="text-sm text-sub leading-6">Add keywords in the edit page.</p>
        </div>
      </aside>
    </div>
  </section>

  <!-- ========== 生词添加弹窗 / Vocab add dialog ========== -->
  <div
    v-if="vocabForm.show"
    class="fixed inset-0 z-[80] bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
    @click.self="vocabForm.show = false"
  >
    <div class="bg-white rounded-3xl soft-border paper-shadow p-6 w-full max-w-md">
      <div class="text-xs uppercase tracking-[0.22em] text-blue font-bold mb-3">
        Add Vocabulary
      </div>
      <div class="space-y-3">
        <div>
          <label class="text-xs text-sub uppercase tracking-wider mb-1 block">Word</label>
          <input v-model="vocabForm.word" class="field" placeholder="e.g. contemporary" />
        </div>
        <div class="grid grid-cols-[90px_1fr] gap-3">
          <div>
            <label class="text-xs text-sub uppercase tracking-wider mb-1 block">POS</label>
            <input v-model="vocabForm.pos" class="field" placeholder="adj." />
          </div>
          <div>
            <label class="text-xs text-sub uppercase tracking-wider mb-1 block">Meaning</label>
            <input v-model="vocabForm.meaning" class="field" placeholder="意思" />
          </div>
        </div>
      </div>
      <div class="flex justify-end gap-2 mt-5">
        <button class="btn-ghost" @click="vocabForm.show = false">Cancel</button>
        <button class="btn-primary" @click="handleAddVocab">Save</button>
      </div>
    </div>
  </div>
</template>
