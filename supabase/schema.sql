-- ========== Supabase 数据库初始化脚本 ==========
-- 创建文章表并配置权限

-- 删除旧表（如果存在）
DROP TABLE IF EXISTS articles CASCADE;

-- ========== 创建文章表 ==========
CREATE TABLE articles (
  id TEXT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  subtitle TEXT,
  theme VARCHAR(100),
  level VARCHAR(50),
  content TEXT,
  vocab JSONB DEFAULT '[]'::jsonb,
  notes JSONB DEFAULT '[]'::jsonb,
  keywords JSONB DEFAULT '[]'::jsonb,
  "createdAt" BIGINT NOT NULL,
  "updatedAt" BIGINT NOT NULL,
  "createdAtDb" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========== 启用 RLS ==========
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- ========== 权限策略 ==========

-- 1. 允许所有人读取
CREATE POLICY "Allow read for all users"
  ON articles FOR SELECT
  USING (true);

-- 2. 允许所有人创建（开发环境）
CREATE POLICY "Allow all users to create"
  ON articles FOR INSERT
  WITH CHECK (true);

-- 3. 允许所有人更新（开发环境）
CREATE POLICY "Allow all users to update"
  ON articles FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 4. 允许所有人删除（开发环境）
CREATE POLICY "Allow all users to delete"
  ON articles FOR DELETE
  USING (true);

-- ========== 创建索引以提高查询性能 ==========
CREATE INDEX idx_articles_created_at 
  ON articles("createdAt" DESC);

CREATE INDEX idx_articles_created_at_db 
  ON articles("createdAtDb" DESC);
