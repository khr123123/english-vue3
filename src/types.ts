export interface VocabItem {
  id: string
  word: string
  pos?: string // part of speech
  meaning: string
}

export interface NoteItem {
  id: string
  quote: string // the highlighted text from article
  note: string // user's note
  color?: string
  createdAt: number
}

export interface Article {
  id: string
  title: string
  subtitle?: string
  theme?: string
  level?: string
  /** rich HTML content */
  content: string
  vocab: VocabItem[]
  notes: NoteItem[]
  keywords: string[]
  createdAt: number
  updatedAt: number
}
