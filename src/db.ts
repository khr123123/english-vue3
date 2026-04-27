/**
 * db.ts — Supabase 数据库访问层 / Supabase database access layer
 *
 * 封装了所有对 Supabase 数据库的 CRUD 操作：
 * - 书籍（books）表的增删改查
 * - 文章（articles）表的增删改查
 *
 * Wraps all Supabase CRUD operations for:
 * - Books table: create, read, update, delete
 * - Articles table: create, read, update, delete
 */

import { createClient } from '@supabase/supabase-js'
import type { Article, Book } from './types'

// ===================== 初始化 Supabase 客户端 / Initialize Supabase client =====================

/**
 * Supabase 客户端实例
 * 使用环境变量中的 URL 和匿名密钥初始化
 * Initialized with environment variables for URL and anonymous key
 */
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// ===================== 书籍操作 / Book operations =====================

/**
 * 获取所有书籍，按创建时间倒序排列
 * Fetch all books, ordered by creation time descending
 */
export async function getBooks(): Promise<Book[]> {
  try {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('获取书籍失败 / Failed to fetch books:', error)
      return []
    }
    return data || []
  } catch (err) {
    console.error('获取书籍出错 / Error fetching books:', err)
    return []
  }
}

/**
 * 创建一本新书
 * Create a new book
 *
 * @param book - 书籍对象 / Book object to insert
 * @returns 创建成功的书籍或null / The created book, or null on failure
 */
export async function dbCreateBook(book: Book): Promise<Book | null> {
  try {
    const { data, error } = await supabase
      .from('books')
      .insert([book])
      .select()

    if (error) {
      console.error('创建书籍失败 / Failed to create book:', error)
      return null
    }
    return data?.[0] || null
  } catch (err) {
    console.error('创建书籍出错 / Error creating book:', err)
    return null
  }
}

/**
 * 更新一本书的信息
 * Update an existing book
 *
 * @param book - 更新后的书籍对象 / Updated book object
 * @returns 是否成功 / Whether the operation succeeded
 */
export async function dbUpdateBook(book: Book): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('books')
      .update(book)
      .eq('id', book.id)

    if (error) {
      console.error('更新书籍失败 / Failed to update book:', error)
      return false
    }
    return true
  } catch (err) {
    console.error('更新书籍出错 / Error updating book:', err)
    return false
  }
}

/**
 * 删除一本书（注意：关联的文章也应一并删除）
 * Delete a book (note: associated articles should also be deleted)
 *
 * @param id - 书籍ID / Book ID
 * @returns 是否成功 / Whether the operation succeeded
 */
export async function dbDeleteBook(id: string): Promise<boolean> {
  try {
    // 先删除该书下的所有文章 / First delete all articles belonging to this book
    await supabase.from('articles').delete().eq('bookId', id)
    // 再删除书本身 / Then delete the book itself
    const { error } = await supabase.from('books').delete().eq('id', id)

    if (error) {
      console.error('删除书籍失败 / Failed to delete book:', error)
      return false
    }
    return true
  } catch (err) {
    console.error('删除书籍出错 / Error deleting book:', err)
    return false
  }
}

// ===================== 文章操作 / Article operations =====================

/**
 * 获取所有文章，按创建时间倒序排列
 * Fetch all articles, ordered by creation time descending
 */
export async function getArticles(): Promise<Article[]> {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('获取文章失败 / Failed to fetch articles:', error)
      return []
    }
    return data || []
  } catch (err) {
    console.error('获取文章出错 / Error fetching articles:', err)
    return []
  }
}

/**
 * 获取某本书下的所有文章
 * Fetch articles belonging to a specific book
 *
 * @param bookId - 书籍ID / Book ID
 * @returns 该书的文章列表 / Articles in the book
 */
export async function getArticlesByBook(bookId: string): Promise<Article[]> {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('bookId', bookId)
      .order('sortOrder', { ascending: true })

    if (error) {
      console.error('获取书籍文章失败 / Failed to fetch book articles:', error)
      return []
    }
    return data || []
  } catch (err) {
    console.error('获取书籍文章出错 / Error fetching book articles:', err)
    return []
  }
}

/**
 * 创建新文章
 * Create a new article
 *
 * @param article - 文章对象 / Article object to insert
 * @returns 创建成功的文章或null / The created article, or null on failure
 */
export async function dbCreateArticle(article: Article): Promise<Article | null> {
  try {
    const { data, error } = await supabase
      .from('articles')
      .insert([article])
      .select()

    if (error) {
      console.error('创建文章失败 / Failed to create article:', error)
      return null
    }
    return data?.[0] || null
  } catch (err) {
    console.error('创建文章出错 / Error creating article:', err)
    return null
  }
}

/**
 * 更新文章
 * Update an existing article
 *
 * @param article - 更新后的文章对象 / Updated article object
 * @returns 是否成功 / Whether the operation succeeded
 */
export async function dbUpdateArticle(article: Article): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('articles')
      .update(article)
      .eq('id', article.id)

    if (error) {
      console.error('更新文章失败 / Failed to update article:', error)
      return false
    }
    return true
  } catch (err) {
    console.error('更新文章出错 / Error updating article:', err)
    return false
  }
}

/**
 * 删除文章
 * Delete an article
 *
 * @param id - 文章ID / Article ID
 * @returns 是否成功 / Whether the operation succeeded
 */
export async function dbDeleteArticle(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('删除文章失败 / Failed to delete article:', error)
      return false
    }
    return true
  } catch (err) {
    console.error('删除文章出错 / Error deleting article:', err)
    return false
  }
}

export default supabase
