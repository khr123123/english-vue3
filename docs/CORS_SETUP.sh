#!/bin/bash
# 添加 CORS 本地开发环境

# 需要在 Supabase Dashboard 手动添加以下 origin：
# 1. http://localhost:5173
# 2. http://localhost:3000
# 3. http://127.0.0.1:5173

# Supabase CORS 配置说明：
# - 进入项目 Settings → API
# - 在 CORS 部分添加 origin
# - 保存后生效

echo "✅ 请手动在 Supabase Dashboard 添加以下 CORS origins："
echo "http://localhost:5173"
echo "http://localhost:3000"
echo "http://127.0.0.1:5173"
