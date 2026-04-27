/**
 * utils/html.ts — HTML 工具函数 / HTML utility functions
 *
 * 提供HTML文本处理相关的辅助函数
 * Provides helper functions for HTML text processing
 */

/**
 * 从HTML字符串中提取纯文本
 * Strip HTML tags and return plain text
 *
 * @param html - 包含HTML标签的字符串 / HTML string with tags
 * @returns 纯文本内容 / Plain text content
 */
export function stripHtml(html: string): string {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return (tmp.textContent || '').trim()
}

/**
 * 生成文章内容摘要（截取前N个字符）
 * Generate a snippet from HTML content (first N characters)
 *
 * @param html - 富文本HTML内容 / Rich HTML content
 * @param maxLen - 最大字符数 / Maximum character count
 * @returns 截断后的纯文本摘要 / Truncated plain text snippet
 */
export function snippet(html: string, maxLen = 160): string {
  const text = stripHtml(html)
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text
}

/**
 * 格式化时间戳为 YYYY-MM-DD 格式
 * Format a timestamp to YYYY-MM-DD format
 *
 * @param ts - 时间戳（毫秒） / Timestamp in milliseconds
 * @returns 格式化的日期字符串 / Formatted date string
 */
export function formatDate(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`
}
