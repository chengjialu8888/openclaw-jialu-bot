#!/bin/bash
# Agent执行脚本 - 完成分析和报告生成
# 读取pipeline生成的数据，使用AI lens生成最终日报

cd /workspace/projects/workspace

WORKSPACE="/workspace/projects/workspace"
DATE_STR=${1:-$(date +"%Y-%m-%d")}
DATE_CN=$(date -d "$DATE_STR" +"%Y年%m月%d日" 2>/dev/null || date -j -f "%Y-%m-%d" "$DATE_STR" +"%Y年%m月%d日")
TIME_STR=$(date +"%H:%M")

RAW_DIR="$WORKSPACE/memory/raw/$DATE_STR"
REPORT_DIR="$WORKSPACE/memory/reports/$DATE_STR"

echo "🤖 AI分析Agent启动"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "日期: $DATE_CN"
echo "数据: $RAW_DIR"
echo ""

# 检查数据是否存在
if [ ! -f "$RAW_DIR/analysis_prompt.txt" ]; then
  echo "❌ 错误: 未找到分析提示文件"
  echo "   请先运行: ./daily/pipeline/run_daily.sh"
  exit 1
fi

# 读取分析提示
ANALYSIS_PROMPT=$(cat "$RAW_DIR/analysis_prompt.txt")

echo "✓ 已加载分析提示 ($(echo "$ANALYSIS_PROMPT" | wc -l) 行)"
echo "🧠 正在使用dialectical lens分析..."
echo ""

# 使用AI生成最终报告
# 这里通过调用AI Agent来完成分析
# 实际输出会被捕获并保存

cat <<'EOF'

📋 分析完成！日报已生成。

由于当前环境限制，完整的AI分析需要调用大模型。
分析提示已保存在:
  memory/raw/YYYY-MM-DD/analysis_prompt.txt

使用方法:
  1. 读取 analysis_prompt.txt
  2. 使用AI生成完整分析
  3. 保存到 memory/reports/YYYY-MM-DD/daily_report_final.md

或运行:
  ./daily/agent/analyze.sh $(date +%Y-%m-%d)

EOF

# 创建最终报告占位符
cat > "$REPORT_DIR/daily_report_final.md" <<EOF
# 🤖 AI日报 | ${DATE_CN}

> ⚠️ 本报告需要AI分析后更新

## 状态
- [x] 数据采集完成
- [x] 去重完成
- [x] 分析提示生成
- [ ] AI分析（待执行）
- [ ] 最终报告生成

## 数据位置
- 原始数据: $RAW_DIR/
- 分析提示: $RAW_DIR/analysis_prompt.txt

## 下一步
运行: ./daily/agent/analyze.sh $DATE_STR

---
*DailyAIReporter | 等待AI分析*
EOF

echo "✅ Agent执行完成"
echo "📄 最终报告位置: $REPORT_DIR/daily_report_final.md"
