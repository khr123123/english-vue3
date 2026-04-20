import { createClient } from '@supabase/supabase-js'
import type { Article } from './types'

// 初始化 Supabase 客户端
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// ========== 文章操作 ==========

/** 获取所有文章 */
export async function getArticles(): Promise<Article[]> {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('❌ 获取文章失败:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('❌ 获取文章出错:', err)
    return []
  }
}

/** 创建文章 */
export async function createArticle(article: Article): Promise<Article | null> {
  try {
    const { data, error } = await supabase
      .from('articles')
      .insert([article])
      .select()

    if (error) {
      console.error('❌ 创建文章失败:', error)
      return null
    }

    console.log('✅ 文章创建成功')
    return data?.[0] || null
  } catch (err) {
    console.error('❌ 创建文章出错:', err)
    return null
  }
}

/** 更新文章 */
export async function updateArticle(article: Article): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('articles')
      .update(article)
      .eq('id', article.id)

    if (error) {
      console.error('❌ 更新文章失败:', error)
      return false
    }

    console.log('✅ 文章更新成功')
    return true
  } catch (err) {
    console.error('❌ 更新文章出错:', err)
    return false
  }
}

/** 删除文章 */
export async function deleteArticle(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('❌ 删除文章失败:', error)
      return false
    }

    console.log('✅ 文章删除成功')
    return true
  } catch (err) {
    console.error('❌ 删除文章出错:', err)
    return false
  }
}

export default supabase
