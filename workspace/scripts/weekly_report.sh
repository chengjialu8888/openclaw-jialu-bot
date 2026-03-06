#!/bin/bash
# AI行业周报脚本 - 周五17:00执行
# 使用多引擎搜索(Brave/Tavily)获取本周AI行业动态

BASE_DIR="/workspace/projects/workspace"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M')
DATE_STR=$(date '+%Y-%m-%d')
WEEK_STR=$(date '+%Y-W%V')

# 设置API Key
export BRAVE_API_KEY="BSAO1u2ig_-n63B26Z4ZpkPGMqF8yVo"
export TAVILY_API_KEY="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"

echo "[$TIMESTAMP] 开始生成周报..."

# 生成周报内容
REPORT="📈 AI行业周报 | ${WEEK_STR}（截至${DATE_STR}）

"

# 1. 大厂动态汇总 - 使用多引擎搜索
echo "搜索本周大厂动态..."
BIGTECH=$(node "${BASE_DIR}/scripts/multi-search.mjs" \
    "AI大厂 OpenAI Google Microsoft Meta Anthropic 字节跳动 阿里 腾讯 百度 产品发布" \
    --format markdown 2>/dev/null | grep -v "^🔍\|^⚠️\|^💾" || echo "搜索失败")

# 2. 初创公司融资/产品
echo "搜索本周初创动态..."
STARTUPS=$(node "${BASE_DIR}/scripts/multi-search.mjs" \
    "AI startup funding series seed venture capital product launch" \
    --format markdown 2>/dev/null | grep -v "^🔍\|^⚠️\|^💾" || echo "搜索失败")

# 3. 行业趋势分析
echo "搜索本周行业趋势..."
ECOSYSTEM=$(node "${BASE_DIR}/scripts/multi-search.mjs" \
    "AI industry trends analysis LLM agents automation 2025" \
    --format markdown 2>/dev/null | grep -v "^🔍\|^⚠️\|^💾" || echo "搜索失败")

# 4. KOL观点汇总
echo "搜索本周KOL观点..."
KOL=$(node "${BASE_DIR}/scripts/multi-search.mjs" \
    "AI analysis Andrej Karpathy A16Z Sequoia Peter Yang Justine Moore" \
    --format markdown 2>/dev/null | grep -v "^🔍\|^⚠️\|^💾" || echo "搜索失败")

# 组合报告
REPORT+="**【本周大厂动态汇总】**
${BIGTECH}

---

**【初创公司融资/产品】**
${STARTUPS}

---

**【行业趋势分析】**
${ECOSYSTEM}

---

**【KOL观点洞察】**
${KOL}

---
⏰ 生成时间: ${TIMESTAMP}"

# 保存报告文件（带有待发送标记）
REPORT_FILE="/tmp/ai_weekly_report_${WEEK_STR}.md"
echo "$REPORT" > "$REPORT_FILE"

# 创建标记文件，表示有新报告待发送
touch "/tmp/ai_weekly_report_${WEEK_STR}.pending"

echo "周报生成完成: $REPORT_FILE"
echo "已标记为待发送（pending文件已创建）"
