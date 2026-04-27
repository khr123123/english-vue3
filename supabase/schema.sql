-- ==========================================================================
-- Supabase 数据库初始化脚本 / Supabase Database Initialization Script
-- ==========================================================================
--
-- 本脚本创建以下表：
-- 1. books  — 书籍表（书架上的每一本书）
-- 2. articles — 文章表（每篇文章归属于某本书）
--
-- This script creates:
-- 1. books  — Books table (each book on the bookshelf)
-- 2. articles — Articles table (each article belongs to a book)
--
-- 使用方法 / Usage:
-- 在 Supabase SQL Editor 中执行本脚本即可
-- Run this script in the Supabase SQL Editor
-- ==========================================================================

-- 删除旧表（如果存在） / Drop old tables if they exist
DROP TABLE IF EXISTS articles CASCADE;
DROP TABLE IF EXISTS books CASCADE;

-- ==========================================================================
-- 1. 创建书籍表 / Create books table
-- ==========================================================================
CREATE TABLE books (
  -- 唯一标识 / Primary key
  id TEXT PRIMARY KEY,
  -- 书名 / Book title
  title VARCHAR(255) NOT NULL,
  -- 描述 / Description
  description TEXT,
  -- 封面颜色主题 / Cover color theme
  color VARCHAR(20) DEFAULT 'blue',
  -- 封面图标(emoji) / Cover icon (emoji)
  icon VARCHAR(10) DEFAULT '📘',
  -- 创建时间戳(毫秒) / Created timestamp (ms)
  "createdAt" BIGINT NOT NULL,
  -- 更新时间戳(毫秒) / Updated timestamp (ms)
  "updatedAt" BIGINT NOT NULL,
  -- 数据库自动记录的创建时间 / DB auto-recorded creation time
  "createdAtDb" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================================================
-- 2. 创建文章表 / Create articles table
-- ==========================================================================
CREATE TABLE articles (
  -- 唯一标识 / Primary key
  id TEXT PRIMARY KEY,
  -- 所属书籍ID / Book foreign key
  "bookId" TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  -- 文章标题 / Title
  title VARCHAR(255) NOT NULL,
  -- 副标题 / Subtitle
  subtitle TEXT,
  -- 主题分类 / Theme
  theme VARCHAR(100),
  -- 难度等级 / Difficulty level
  level VARCHAR(50),
  -- 富文本内容 / Rich HTML content
  content TEXT,
  -- 生词列表(JSON) / Vocab list (JSON)
  vocab JSONB DEFAULT '[]'::jsonb,
  -- 笔记列表(JSON) / Notes list (JSON)
  notes JSONB DEFAULT '[]'::jsonb,
  -- 关键词列表(JSON) / Keywords list (JSON)
  keywords JSONB DEFAULT '[]'::jsonb,
  -- 排序序号 / Sort order within the book
  "sortOrder" INTEGER DEFAULT 0,
  -- 创建时间戳(毫秒) / Created timestamp (ms)
  "createdAt" BIGINT NOT NULL,
  -- 更新时间戳(毫秒) / Updated timestamp (ms)
  "updatedAt" BIGINT NOT NULL,
  -- 数据库自动记录的创建时间 / DB auto-recorded creation time
  "createdAtDb" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================================================
-- 3. 启用行级安全策略 (RLS) / Enable Row Level Security
-- ==========================================================================
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- ==========================================================================
-- 4. 权限策略（开发环境：允许所有操作） / Policies (dev: allow all)
-- ==========================================================================

-- ===== books 权限 / Books policies =====

CREATE POLICY "books_select_all" ON books
  FOR SELECT USING (true);

CREATE POLICY "books_insert_all" ON books
  FOR INSERT WITH CHECK (true);

CREATE POLICY "books_update_all" ON books
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "books_delete_all" ON books
  FOR DELETE USING (true);

-- ===== articles 权限 / Articles policies =====

CREATE POLICY "articles_select_all" ON articles
  FOR SELECT USING (true);

CREATE POLICY "articles_insert_all" ON articles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "articles_update_all" ON articles
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "articles_delete_all" ON articles
  FOR DELETE USING (true);

-- ==========================================================================
-- 5. 创建索引以提高查询性能 / Create indexes for query performance
-- ==========================================================================

-- 书籍按创建时间排序 / Books ordered by creation time
CREATE INDEX idx_books_created_at
  ON books("createdAt" DESC);

-- 文章按书籍ID和排序序号查询 / Articles by book ID and sort order
CREATE INDEX idx_articles_book_id
  ON articles("bookId");

CREATE INDEX idx_articles_sort_order
  ON articles("bookId", "sortOrder" ASC);

CREATE INDEX idx_articles_created_at
  ON articles("createdAt" DESC);
