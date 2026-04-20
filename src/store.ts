import { reactive, watch } from 'vue'
import type { Article, NoteItem, VocabItem } from './types'

const STORAGE_KEY = 'english-reading:v1'

function uid(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4)
}

const DEFAULT_ARTICLE: Article = {
  id: uid(),
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
  createdAt: Date.now(),
  updatedAt: Date.now(),
}

interface AppState {
  articles: Article[]
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AppState
      if (parsed && Array.isArray(parsed.articles)) return parsed
    }
  } catch (err) {
    console.warn('failed to load state', err)
  }
  return { articles: [DEFAULT_ARTICLE] }
}

export const state = reactive<AppState>(load())

watch(
  () => state,
  (v) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(v))
    } catch (err) {
      console.warn('failed to save state', err)
    }
  },
  { deep: true }
)

export function getArticle(id: string): Article | undefined {
  return state.articles.find((a) => a.id === id)
}

export function createArticle(partial?: Partial<Article>): Article {
  const now = Date.now()
  const article: Article = {
    id: uid(),
    title: partial?.title ?? 'Untitled Article',
    subtitle: partial?.subtitle ?? '',
    theme: partial?.theme ?? 'General',
    level: partial?.level ?? 'Intermediate',
    content: partial?.content ?? '<p>Start writing your article here...</p>',
    vocab: partial?.vocab ?? [],
    notes: partial?.notes ?? [],
    keywords: partial?.keywords ?? [],
    createdAt: now,
    updatedAt: now,
  }
  state.articles.unshift(article)
  return article
}

export function deleteArticle(id: string) {
  const idx = state.articles.findIndex((a) => a.id === id)
  if (idx >= 0) state.articles.splice(idx, 1)
}

export function updateArticle(id: string, patch: Partial<Article>) {
  const a = getArticle(id)
  if (!a) return
  Object.assign(a, patch)
  a.updatedAt = Date.now()
}

export function addVocab(articleId: string, v: Omit<VocabItem, 'id'>) {
  const a = getArticle(articleId)
  if (!a) return
  a.vocab.push({ id: uid(), ...v })
  a.updatedAt = Date.now()
}

export function removeVocab(articleId: string, vocabId: string) {
  const a = getArticle(articleId)
  if (!a) return
  const i = a.vocab.findIndex((x) => x.id === vocabId)
  if (i >= 0) a.vocab.splice(i, 1)
  a.updatedAt = Date.now()
}

export function addNote(articleId: string, n: Omit<NoteItem, 'id' | 'createdAt'>): NoteItem | undefined {
  const a = getArticle(articleId)
  if (!a) return
  const note: NoteItem = { id: uid(), createdAt: Date.now(), ...n }
  a.notes.unshift(note)
  a.updatedAt = Date.now()
  return note
}

export function removeNote(articleId: string, noteId: string) {
  const a = getArticle(articleId)
  if (!a) return
  const i = a.notes.findIndex((x) => x.id === noteId)
  if (i >= 0) a.notes.splice(i, 1)
  a.updatedAt = Date.now()
}

export function updateNote(articleId: string, noteId: string, patch: Partial<NoteItem>) {
  const a = getArticle(articleId)
  if (!a) return
  const n = a.notes.find((x) => x.id === noteId)
  if (n) Object.assign(n, patch)
  a.updatedAt = Date.now()
}

export { uid }
