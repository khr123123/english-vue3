<script setup lang="ts">
import { computed, nextTick, onMounted, onBeforeUnmount, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getArticle,
  updateArticle,
  addNote,
  removeNote,
  updateNote,
  addVocab,
  removeVocab,
  deleteArticle,
} from '../store'
import type { NoteItem } from '../types'

const route = useRoute()
const router = useRouter()

const id = computed(() => String(route.params.id))
const article = computed(() => getArticle(id.value))

const contentRef = ref<HTMLDivElement | null>(null)

// Floating toolbar
const toolbar = reactive({
  show: false,
  top: 0,
  left: 0,
})

// Note popover
const notePopover = reactive({
  show: false,
  top: 0,
  left: 0,
  quote: '',
  text: '',
  range: null as Range | null,
})

// Existing note preview (when hovering / clicking a note-mark in article)
const activeNote = reactive({
  show: false,
  top: 0,
  left: 0,
  noteId: '' as string,
})

// New vocab dialog
const vocabForm = reactive({
  show: false,
  word: '',
  pos: '',
  meaning: '',
})

/**
 * Compute toolbar position from selection.
 */
function positionFromSelection(sel: Selection) {
  const range = sel.getRangeAt(0)
  const rect = range.getBoundingClientRect()
  const containerRect = contentRef.value!.getBoundingClientRect()
  const top = rect.top - containerRect.top - 44
  const left =
    rect.left - containerRect.left + rect.width / 2 - 120 // ~half of toolbar width
  return {
    top: Math.max(top, -8),
    left: Math.max(Math.min(left, containerRect.width - 240), 4),
  }
}

function handleSelection() {
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed || !contentRef.value) {
    toolbar.show = false
    return
  }
  // must be inside content
  const anchorNode = sel.anchorNode
  const focusNode = sel.focusNode
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

/**
 * Wrap the current selection with a span having the given class (highlight/underline/bold variants).
 * For bold we use <b>.
 */
function wrapSelection(type: 'bold' | 'underline' | 'hl-yellow' | 'hl-blue' | 'hl-pink' | 'hl-green' | 'clear') {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return
  const range = sel.getRangeAt(0)
  if (!contentRef.value?.contains(range.commonAncestorContainer)) return

  if (type === 'clear') {
    // Remove any formatting on selection via execCommand as a pragmatic approach
    document.execCommand('removeFormat')
    // Also attempt to unwrap any span with our marker classes
    unwrapMarksInRange(range)
    persist()
    sel.removeAllRanges()
    toolbar.show = false
    return
  }

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
    // clear selection
    sel.removeAllRanges()
    toolbar.show = false
    persist()
  } catch (e) {
    console.warn(e)
  }
}

function unwrapMarksInRange(range: Range) {
  const container = range.commonAncestorContainer
  const root =
    container.nodeType === 1
      ? (container as HTMLElement)
      : (container.parentElement as HTMLElement)
  if (!root) return
  const marks = root.querySelectorAll(
    'span.hl-yellow, span.hl-blue, span.hl-pink, span.hl-green, span.underline-mark, b, strong'
  )
  marks.forEach((m) => {
    if (range.intersectsNode(m)) {
      const parent = m.parentNode
      if (!parent) return
      while (m.firstChild) parent.insertBefore(m.firstChild, m)
      parent.removeChild(m)
    }
  })
}

function startNoteFromSelection() {
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed || !contentRef.value) return
  const range = sel.getRangeAt(0)
  if (!contentRef.value.contains(range.commonAncestorContainer)) return
  notePopover.quote = sel.toString().trim()
  notePopover.text = ''
  notePopover.range = range.cloneRange()
  // position popover near toolbar
  notePopover.top = toolbar.top + 40
  notePopover.left = toolbar.left
  notePopover.show = true
  toolbar.show = false
}

function saveNote() {
  const a = article.value
  if (!a || !notePopover.range) return
  const noteText = notePopover.text.trim()
  if (!noteText) {
    notePopover.show = false
    return
  }
  const note = addNote(a.id, {
    quote: notePopover.quote,
    note: noteText,
    color: 'blue',
  })
  if (!note) return
  // wrap selection with note-mark span linking to noteId
  try {
    const wrap = document.createElement('span')
    wrap.className = 'note-mark'
    wrap.setAttribute('data-note-id', note.id)
    wrap.title = noteText.slice(0, 80)
    wrap.appendChild(notePopover.range.extractContents())
    notePopover.range.insertNode(wrap)
    window.getSelection()?.removeAllRanges()
  } catch (e) {
    console.warn(e)
  }
  notePopover.show = false
  persist()
}

function cancelNote() {
  notePopover.show = false
}

function persist() {
  const a = article.value
  if (!a || !contentRef.value) return
  updateArticle(a.id, { content: contentRef.value.innerHTML })
}

function scrollToNote(note: NoteItem) {
  if (!contentRef.value) return
  const target = contentRef.value.querySelector<HTMLElement>(
    `span.note-mark[data-note-id="${note.id}"]`
  )
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    target.style.transition = 'background-color .4s'
    const original = target.style.backgroundColor
    target.style.backgroundColor = 'rgba(250, 204, 21, 0.45)'
    setTimeout(() => {
      target.style.backgroundColor = original
    }, 1200)
  }
}

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

function handleDeleteNote(nid: string) {
  const a = article.value
  if (!a) return
  removeNote(a.id, nid)
  // remove note-mark span but keep inner content
  if (contentRef.value) {
    const el = contentRef.value.querySelector<HTMLElement>(
      `span.note-mark[data-note-id="${nid}"]`
    )
    if (el) {
      const parent = el.parentNode
      if (parent) {
        while (el.firstChild) parent.insertBefore(el.firstChild, el)
        parent.removeChild(el)
      }
    }
  }
  activeNote.show = false
  persist()
}

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
  vocabForm.word = ''
  vocabForm.pos = ''
  vocabForm.meaning = ''
  vocabForm.show = false
}

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

function handleDeleteArticle() {
  const a = article.value
  if (!a) return
  if (confirm('Delete this article?')) {
    deleteArticle(a.id)
    router.push('/')
  }
}

function onDocMouseUp(e: MouseEvent) {
  // ignore mouseup inside toolbar itself
  const target = e.target as HTMLElement
  if (target.closest('.float-toolbar')) return
  setTimeout(handleSelection, 0)
}

function onDocMouseDown(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (
    !target.closest('.float-toolbar') &&
    !target.closest('.note-mark') &&
    !target.closest('.active-note-popover')
  ) {
    activeNote.show = false
  }
  if (!target.closest('.note-popover')) {
    // only hide if not composing note
    if (!notePopover.show) {
      // hidden
    }
  }
}

onMounted(() => {
  document.addEventListener('mouseup', onDocMouseUp)
  document.addEventListener('mousedown', onDocMouseDown)
  // ensure article exists
  if (!article.value) {
    router.replace('/')
  }
  // initial render: assign content then wait nextTick (already bound via v-html)
  nextTick(() => {
    // nothing
  })
})

onBeforeUnmount(() => {
  document.removeEventListener('mouseup', onDocMouseUp)
  document.removeEventListener('mousedown', onDocMouseDown)
})

function activeNoteObject(): NoteItem | undefined {
  const a = article.value
  if (!a) return
  return a.notes.find((n) => n.id === activeNote.noteId)
}
</script>

<template>
  <section v-if="article" class="max-w-7xl mx-auto px-6 md:px-10 mb-10">
    <div class="flex flex-wrap items-center justify-between gap-3 mb-8">
      <div class="flex items-center gap-3 text-sm text-sub">
        <button
          class="btn-ghost"
          @click="router.push('/')"
          aria-label="Back"
        >
          ← Library
        </button>
        <span class="text-xs uppercase tracking-[0.24em] mono">{{ article.theme }}</span>
      </div>
      <div class="flex gap-2">
        <button class="btn-ghost" @click="vocabForm.show = true">+ Vocab</button>
        <button
          class="btn-primary"
          @click="router.push({ name: 'article-edit', params: { id: article.id } })"
        >
          Edit Article
        </button>
        <button class="btn-ghost" @click="handleDeleteArticle">Delete</button>
      </div>
    </div>

    <!-- Hero -->
    <div class="bg-paper soft-border rounded-3xl p-8 md:p-10 paper-shadow mb-8">
      <div class="text-xs uppercase tracking-[0.28em] text-blue font-bold mb-4">
        Reading
      </div>
      <h1
        class="text-3xl md:text-5xl font-bold tracking-tight leading-tight mb-4"
      >
        {{ article.title }}
      </h1>
      <p v-if="article.subtitle" class="text-sub text-lg leading-8 max-w-3xl">
        {{ article.subtitle }}
      </p>
    </div>
  </section>

  <!-- Main grid -->
  <section v-if="article" class="max-w-7xl mx-auto px-6 md:px-10">
    <div
      class="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-8"
    >
      <!-- Article content -->
      <div class="min-w-0">
        <article
          class="bg-white/70 rounded-3xl p-6 md:p-10 soft-border paper-shadow relative"
        >
          <div class="max-w-3xl mx-auto relative">
            <div class="mb-6 flex items-center justify-between gap-4">
              <div
                class="text-xs uppercase tracking-[0.24em] text-blue font-bold"
              >
                Original Article
              </div>
              <div class="text-xs text-sub">
                Select any text to highlight, bold, underline or add a note.
              </div>
            </div>

            <div
              ref="contentRef"
              class="article-content relative"
              v-html="article.content"
              @click="handleContentClick"
            ></div>

            <!-- Floating toolbar -->
            <div
              v-show="toolbar.show"
              class="float-toolbar"
              :style="{ top: toolbar.top + 'px', left: toolbar.left + 'px' }"
            >
              <button title="Bold" @mousedown.prevent @click="wrapSelection('bold')">
                <b>B</b>
              </button>
              <button title="Underline" @mousedown.prevent @click="wrapSelection('underline')">
                <u>U</u>
              </button>
              <span class="sep" />
              <button
                title="Yellow highlight"
                @mousedown.prevent
                @click="wrapSelection('hl-yellow')"
              >
                <span
                  class="w-3.5 h-3.5 rounded-sm inline-block"
                  style="background: #facc15"
                ></span>
              </button>
              <button
                title="Blue highlight"
                @mousedown.prevent
                @click="wrapSelection('hl-blue')"
              >
                <span
                  class="w-3.5 h-3.5 rounded-sm inline-block"
                  style="background: #2B59C3"
                ></span>
              </button>
              <button
                title="Pink highlight"
                @mousedown.prevent
                @click="wrapSelection('hl-pink')"
              >
                <span
                  class="w-3.5 h-3.5 rounded-sm inline-block"
                  style="background: #ec4899"
                ></span>
              </button>
              <button
                title="Green highlight"
                @mousedown.prevent
                @click="wrapSelection('hl-green')"
              >
                <span
                  class="w-3.5 h-3.5 rounded-sm inline-block"
                  style="background: #22c55e"
                ></span>
              </button>
              <span class="sep" />
              <button title="Clear format" @mousedown.prevent @click="wrapSelection('clear')">
                ✕
              </button>
              <span class="sep" />
              <button
                title="Add note"
                @mousedown.prevent
                @click="startNoteFromSelection"
              >
                ✎
              </button>
              <button
                title="Add to vocab"
                @mousedown.prevent
                @click="handleAddSelectionAsVocab"
              >
                A+
              </button>
            </div>

            <!-- Note compose popover -->
            <div
              v-if="notePopover.show"
              class="note-popover absolute z-[70] bg-white rounded-2xl soft-border paper-shadow p-4 w-[320px]"
              :style="{ top: notePopover.top + 'px', left: notePopover.left + 'px' }"
            >
              <div class="text-xs uppercase tracking-[0.18em] text-blue font-bold mb-2">
                Add Note
              </div>
              <div
                class="bg-blueSoft/50 rounded-lg p-2 text-xs text-blue/90 mb-3 line-clamp-3"
              >
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

            <!-- Active note preview -->
            <div
              v-if="activeNote.show && activeNoteObject()"
              class="active-note-popover absolute z-[65] bg-white rounded-2xl soft-border paper-shadow p-4 w-[320px]"
              :style="{ top: activeNote.top + 'px', left: activeNote.left + 'px' }"
            >
              <div class="flex justify-between items-center mb-2">
                <div class="text-xs uppercase tracking-[0.18em] text-blue font-bold">
                  Note
                </div>
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

      <!-- Sidebar -->
      <aside class="space-y-6">
        <!-- Notes panel -->
        <div class="bg-paper rounded-3xl p-5 soft-border">
          <div class="flex items-center justify-between mb-3">
            <div class="text-xs uppercase tracking-[0.22em] text-blue font-bold">
              Notes
              <span class="text-sub mono ml-1">({{ article.notes.length }})</span>
            </div>
          </div>
          <p v-if="article.notes.length === 0" class="text-sm text-sub leading-6">
            Select any part of the article and tap <span class="mono">✎</span> to
            add your first note.
          </p>
          <ul v-else class="space-y-3">
            <li
              v-for="n in article.notes"
              :key="n.id"
              class="bg-white/70 rounded-2xl soft-border p-3 cursor-pointer hover:border-blue/40 transition"
              @click="scrollToNote(n)"
            >
              <div class="text-xs text-blue/90 mono mb-1 line-clamp-2">
                "{{ n.quote }}"
              </div>
              <div class="text-sm leading-6 text-textmain mb-2">
                {{ n.note }}
              </div>
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

        <!-- Vocabulary -->
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

        <!-- Keywords -->
        <div class="bg-paper rounded-3xl p-5 soft-border">
          <div class="text-xs uppercase tracking-[0.22em] text-blue font-bold mb-3">
            Keywords
          </div>
          <div v-if="article.keywords.length" class="flex flex-wrap gap-2">
            <span v-for="(k, i) in article.keywords" :key="i" class="tag">
              {{ k }}
            </span>
          </div>
          <p v-else class="text-sm text-sub leading-6">
            Add keywords in the edit page.
          </p>
        </div>
      </aside>
    </div>
  </section>

  <!-- Vocab dialog -->
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
