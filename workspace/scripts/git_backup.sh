#!/bin/bash
# OpenClaw 每日 Git 备份脚本
# 自动提交并推送所有更改到 GitHub

set -e

echo "=========================================="
echo "🦞 OpenClaw 每日备份 - $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="

cd /workspace/projects

# 检查是否有更改
if git diff --quiet && git diff --cached --quiet; then
    echo "✓ 无更改，跳过备份"
    exit 0
fi

# 配置 git 用户信息（如果未配置）
git config user.email "bot@openclaw.local" 2>/dev/null || true
git config user.name "OpenClaw Bot" 2>/dev/null || true

# 添加所有更改
echo "📦 添加更改..."
git add -A

# 生成提交信息
COMMIT_MSG="backup: $(date '+%Y-%m-%d %H:%M') 自动备份

- 配置文件更新
- 工作区状态同步
- 日志文件归档"

# 提交
echo "💾 提交更改..."
git commit -m "$COMMIT_MSG" || echo "提交失败或无更改"

# 推送到 GitHub
echo "🚀 推送到 GitHub..."
git push origin main || git push origin master || echo "推送失败，请检查权限"

echo "✅ 备份完成！"
echo "=========================================="
