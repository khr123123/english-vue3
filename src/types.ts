/**
 * types.ts — 全局类型定义 / Global type definitions
 *
 * 定义了应用中所有核心数据模型：
 * - Book（书籍）: 书架上的一本书，包含多篇文章
 * - Article（文章）: 一篇英文阅读文章，属于某本书
 * - VocabItem（生词）: 用户收藏的词汇
 * - NoteItem（笔记）: 用户在文章中的批注
 */

// ===================== 词汇 / Vocabulary =====================

/** 生词条目 / A vocabulary entry saved by the user */
export interface VocabItem {
  /** 唯一标识 / Unique identifier */
  id: string
  /** 单词或词组 / The word or phrase */
  word: string
  /** 词性，如 adj. / Part of speech, e.g. adj. */
  pos?: string
  /** 中文释义 / Meaning (usually in Chinese) */
  meaning: string
}

// ===================== 笔记 / Notes =====================

/** 用户批注 / A user annotation attached to a selected passage */
export interface NoteItem {
  /** 唯一标识 / Unique identifier */
  id: string
  /** 引用的原文 / The highlighted passage from the article */
  quote: string
  /** 用户写的笔记内容 / The user's note text */
  note: string
  /** 高亮颜色标记 / Highlight color tag */
  color?: string
  /** 创建时间戳 / Timestamp when this note was created */
  createdAt: number
}

// ===================== 文章 / Article =====================

/** 一篇英文阅读文章 / An English reading article */
export interface Article {
  /** 唯一标识 / Unique identifier */
  id: string
  /** 所属书籍ID / The book this article belongs to */
  bookId: string
  /** 文章标题 / Article title */
  title: string
  /** 副标题 / Subtitle or summary */
  subtitle?: string
  /** 主题分类 / Theme / topic tag */
  theme?: string
  /** 难度等级 / Difficulty level */
  level?: string
  /** 富文本HTML内容 / Rich HTML content of the article */
  content: string
  /** 生词列表 / List of saved vocabulary items */
  vocab: VocabItem[]
  /** 笔记列表 / List of notes */
  notes: NoteItem[]
  /** 关键词列表 / Keyword tags */
  keywords: string[]
  /** 在书中的排序序号 / Sort order within the book */
  sortOrder: number
  /** 创建时间戳 / Created timestamp */
  createdAt: number
  /** 更新时间戳 / Last updated timestamp */
  updatedAt: number
}

// ===================== 书籍 / Book =====================

/** 书籍封面颜色主题 / Color themes for book covers */
export type BookColor =
  | 'blue'
  | 'red'
  | 'green'
  | 'purple'
  | 'orange'
  | 'teal'
  | 'pink'
  | 'indigo'
  | 'amber'
  | 'slate'

/** 一本书（书架上的单元） / A book on the bookshelf */
export interface Book {
  /** 唯一标识 / Unique identifier */
  id: string
  /** 书名 / Book title */
  title: string
  /** 书籍描述 / Short description */
  description?: string
  /** 封面颜色主题 / Cover color theme */
  color: BookColor
  /** 封面图标 (emoji) / Cover icon */
  icon?: string
  /** 包含的文章数量（由前端计算） / Article count (computed on frontend) */
  articleCount?: number
  /** 创建时间戳 / Created timestamp */
  createdAt: number
  /** 更新时间戳 / Last updated timestamp */
  updatedAt: number
}
