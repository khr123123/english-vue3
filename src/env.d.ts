/**
 * env.d.ts — 环境类型声明 / Environment type declarations
 *
 * 为 TypeScript 提供以下类型支持：
 * - .vue 单文件组件模块声明
 * - Vite 环境变量类型（VITE_SUPABASE_URL 等）
 *
 * Provides TypeScript type support for:
 * - .vue single-file component module declarations
 * - Vite environment variable types (VITE_SUPABASE_URL, etc.)
 */

/// <reference types="vite/client" />

/** Vue 单文件组件模块声明 / Vue SFC module declaration */
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

/**
 * Vite 环境变量类型声明
 * Vite environment variable type declarations
 */
interface ImportMetaEnv {
  /** Supabase 项目 URL / Supabase project URL */
  readonly VITE_SUPABASE_URL: string
  /** Supabase 匿名密钥 / Supabase anonymous key */
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
