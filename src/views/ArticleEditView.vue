<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getArticle, updateArticle } from '../store'

const route = useRoute()
const router = useRouter()

const id = computed(() => String(route.params.id))
const article = computed(() => getArticle(id.value))

const title = ref('')
const subtitle = ref('')
const theme = ref('')
const level = ref('')
const keywords = ref('')
const contentRef = ref<HTMLDivElement | null>(null)

onMounted(() => {
  const a = article.value
  if (!a) {
    router.replace('/')
    return
  }
  title.value = a.title
  subtitle.value = a.subtitle ?? ''
  theme.value = a.theme ?? ''
  level.value = a.level ?? ''
  keywords.value = a.keywords.join(', ')
  if (contentRef.value) {
    contentRef.value.innerHTML = a.content
  }
})

function exec(cmd: string, value?: string) {
  contentRef.value?.focus()
  document.execCommand(cmd, false, value)
}

function wrapSelectionWithClass(className: string) {
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed) return
  const range = sel.getRangeAt(0)
  if (!contentRef.value?.contains(range.commonAncestorContainer)) return
  const span = document.createElement('span')
  span.className = className
  try {
    span.appendChild(range.extractContents())
    range.insertNode(span)
    sel.removeAllRanges()
  } catch (e) {
    console.warn(e)
  }
}

function clearFormat() {
  document.execCommand('removeFormat')
}

function save() {
  const a = article.value
  if (!a || !contentRef.value) return
  updateArticle(a.id, {
    title: title.value.trim() || 'Untitled',
    subtitle: subtitle.value.trim(),
    theme: theme.value.trim(),
    level: level.value.trim(),
    keywords: keywords.value
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean),
    content: contentRef.value.innerHTML,
  })
  router.push({ name: 'article', params: { id: a.id } })
}

function cancel() {
  router.back()
}

function onPaste(e: ClipboardEvent) {
  e.preventDefault()
  const text = e.clipboardData?.getData('text/plain') ?? ''
  // Convert double newlines into paragraphs, single line breaks into <br>
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('')
  document.execCommand('insertHTML', false, paragraphs)
}
</script>

<template>
  <section v-if="article" class="max-w-6xl mx-auto px-6 md:px-10 mb-10">
    <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
      <button class="btn-ghost" @click="cancel">← Cancel</button>
      <div class="flex gap-2">
        <button class="btn-ghost" @click="cancel">Discard</button>
        <button class="btn-primary" @click="save">Save Article</button>
      </div>
    </div>

    <div class="bg-paper soft-border rounded-3xl p-6 md:p-8 paper-shadow mb-6 space-y-4">
      <div class="text-xs uppercase tracking-[0.22em] text-blue font-bold mb-1">
        Article Meta
      </div>
      <div>
        <label class="text-xs text-sub uppercase tracking-wider mb-1 block">Title</label>
        <input v-model="title" class="field-lg" placeholder="Article title" />
      </div>
      <div>
        <label class="text-xs text-sub uppercase tracking-wider mb-1 block"
          >Subtitle / Summary</label
        >
        <input v-model="subtitle" class="field" placeholder="One-line description" />
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="text-xs text-sub uppercase tracking-wider mb-1 block">Theme</label>
          <input v-model="theme" class="field" placeholder="e.g. Science & Society" />
        </div>
        <div>
          <label class="text-xs text-sub uppercase tracking-wider mb-1 block">Level</label>
          <input v-model="level" class="field" placeholder="e.g. Intermediate+" />
        </div>
        <div>
          <label class="text-xs text-sub uppercase tracking-wider mb-1 block"
            >Keywords (comma-separated)</label
          >
          <input v-model="keywords" class="field" placeholder="AI, prediction, ..." />
        </div>
      </div>
    </div>

    <div class="bg-white/70 rounded-3xl p-6 md:p-8 soft-border paper-shadow">
      <div class="text-xs uppercase tracking-[0.22em] text-blue font-bold mb-3">
        Content Editor
      </div>

      <!-- Toolbar -->
      <div
        class="flex flex-wrap items-center gap-1 mb-4 p-2 bg-bg/80 rounded-xl soft-border sticky top-20 z-30"
      >
        <button class="tb" title="Bold" @click="exec('bold')"><b>B</b></button>
        <button class="tb italic" title="Italic" @click="exec('italic')">I</button>
        <button class="tb underline" title="Underline" @click="exec('underline')">U</button>
        <span class="tb-sep"></span>
        <button class="tb" title="Heading 2" @click="exec('formatBlock', '<h2>')">H2</button>
        <button class="tb" title="Heading 3" @click="exec('formatBlock', '<h3>')">H3</button>
        <button class="tb" title="Paragraph" @click="exec('formatBlock', '<p>')">¶</button>
        <button class="tb" title="Quote" @click="exec('formatBlock', '<blockquote>')">❝</button>
        <span class="tb-sep"></span>
        <button class="tb" title="Bulleted list" @click="exec('insertUnorderedList')">•</button>
        <button class="tb" title="Numbered list" @click="exec('insertOrderedList')">1.</button>
        <span class="tb-sep"></span>
        <button
          class="tb"
          title="Yellow highlight"
          @click="wrapSelectionWithClass('hl-yellow')"
        >
          <span class="inline-block w-3 h-3 rounded-sm" style="background: #facc15"></span>
        </button>
        <button
          class="tb"
          title="Blue highlight"
          @click="wrapSelectionWithClass('hl-blue')"
        >
          <span class="inline-block w-3 h-3 rounded-sm" style="background: #2B59C3"></span>
        </button>
        <button
          class="tb"
          title="Pink highlight"
          @click="wrapSelectionWithClass('hl-pink')"
        >
          <span class="inline-block w-3 h-3 rounded-sm" style="background: #ec4899"></span>
        </button>
        <button
          class="tb"
          title="Green highlight"
          @click="wrapSelectionWithClass('hl-green')"
        >
          <span class="inline-block w-3 h-3 rounded-sm" style="background: #22c55e"></span>
        </button>
        <button
          class="tb"
          title="Custom underline"
          @click="wrapSelectionWithClass('underline-mark')"
        >
          <span class="inline-block w-4 border-b-2 border-blue"></span>
        </button>
        <span class="tb-sep"></span>
        <button class="tb" title="Clear formatting" @click="clearFormat">✕</button>
      </div>

      <!-- Editable area -->
      <div
        ref="contentRef"
        class="article-content min-h-[320px] max-w-3xl mx-auto outline-none focus:outline-none"
        contenteditable="true"
        spellcheck="true"
        @paste="onPaste"
      ></div>

      <p class="text-xs text-sub mt-4">
        Tip: You can paste text from anywhere. It will be converted into clean paragraphs. Use the
        toolbar to bold, underline or color-highlight the important parts.
      </p>
    </div>
  </section>
</template>

<style scoped>
.tb {
  @apply inline-flex items-center justify-center min-w-[34px] h-8 px-2 rounded-lg text-xs font-semibold text-sub hover:text-blue hover:bg-white transition;
}
.tb-sep {
  @apply w-px h-5 bg-line mx-1;
}
</style>
