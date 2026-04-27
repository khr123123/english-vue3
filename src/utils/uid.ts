/**
 * utils/uid.ts — 唯一ID生成器 / Unique ID generator
 *
 * 使用随机字符串 + 时间戳组合生成简短的唯一ID
 * Generates a short unique ID using random characters + timestamp
 */

/**
 * 生成一个简短的唯一标识符
 * Generate a short unique identifier
 *
 * @returns {string} 类似 "k3x8m2a1nt5" 的唯一字符串
 */
export function uid(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4)
}
