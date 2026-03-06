#!/bin/bash
# AI行业日报脚本 - 每天10:30执行
# 使用多引擎搜索(Brave/Tavily)获取当天及前一天的AI行业动态

BASE_DIR="/workspace/projects/workspace"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M')
DATE_STR=$(date '+%Y-%m-%d')

# 设置API Key
export BRAVE_API_KEY="BSAO1u2ig_-n63B26Z4ZpkPGMqF8yVo"
export TAVILY_API_KEY="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"

echo "[$TIMESTAMP] 开始生成日报..."

# 生成日报内容
REPORT="📊 AI行业日报 | ${DATE_STR}

"

# 过滤函数 - 移除所有日志输出，只保留搜索结果
filter_output() {
    # 多阶段过滤
    grep -v "^📋\|^🔍\|^⚠️\|^💾\|^✅\|^📡\|^❌" | \
    grep -v "^总计\|^开始\|^完成\|^$" | \
    grep -v "API配置\|正在连接\|搜索失败\|API.*未配置\|网络不可达" | \
    grep -v "Brave API\|Tavily API\|Tavily:\|条结果" | \
    sed '/^$/N;/^\n$/d' | \
    sed '/^# 🔍 多引擎搜索结果/,/^---$/d' | \
    grep -v "^\*\*查询:\|^\*\*时间:\|^\*\*引擎数:" | \
    grep -v "^## Tavily$\|^### 搜索结果" | \
    sed 's/^[[:space:]]*//' | \
    grep -v "^[[:space:]]*$"  # 删除纯空行
}

# 1. 大厂动态 - 使用多引擎搜索
echo "搜索大厂动态..."
BIGTECH=$(node "${BASE_DIR}/scripts/multi-search.mjs" \
    "AI大厂动态 OpenAI Google Microsoft Meta Anthropic 字节 阿里 腾讯" \
    --format markdown 2>/dev/null | filter_output)

# 2. 初创公司动态
echo "搜索初创公司动态..."
STARTUPS=$(node "${BASE_DIR}/scripts/multi-search.mjs" \
    "AI startup funding product launch artificial intelligence" \
    --format markdown 2>/dev/null | filter_output)

# 3. 行业生态
echo "搜索行业生态..."
ECOSYSTEM=$(node "${BASE_DIR}/scripts/multi-search.mjs" \
    "AI industry ecosystem trends LLM agents" \
    --format markdown 2>/dev/null | filter_output)

# 4. AI KOL动态 - 优化搜索策略
echo "搜索AI KOL动态..."
KOL=$(node "${BASE_DIR}/scripts/multi-search.mjs" \
    "AI industry analysis commentary thought leaders 2025" \
    --format markdown 2>/dev/null | filter_output)

# 组合报告
REPORT+="**【大厂动态】**
${BIGTECH}

---

**【初创公司】**
${STARTUPS}

---

**【行业生态】**
${ECOSYSTEM}

---

**【KOL观点】**
${KOL}

---
⏰ 生成时间: ${TIMESTAMP}"

# 保存报告文件（带有待发送标记）
REPORT_FILE="/tmp/ai_daily_report_${DATE_STR}.md"
echo "$REPORT" > "$REPORT_FILE"

# 创建标记文件，表示有新报告待发送
touch "/tmp/ai_daily_report_${DATE_STR}.pending"

echo "日报生成完成: $REPORT_FILE"
echo "已标记为待发送（pending文件已创建）"
