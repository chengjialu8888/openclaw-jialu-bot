#!/bin/bash
# AI日报 Pipeline v3
# 使用 Multiple Search Engine Skill

cd /workspace/projects/workspace

WORKSPACE="/workspace/projects/workspace"
DAILY_DIR="$WORKSPACE/daily"
MEMORY_DIR="$WORKSPACE/memory"
DATA_DIR="$DAILY_DIR/data"
DATE_STR=${1:-$(date +"%Y-%m-%d")}
DATE_CN=$(date -d "$DATE_STR" +"%Y年%m月%d日" 2>/dev/null || date -j -f "%Y-%m-%d" "$DATE_STR" +"%Y年%m月%d日")
TIME_STR=$(date +"%H:%M")
REPORT_DIR="$MEMORY_DIR/reports/$DATE_STR"
RAW_DIR="$MEMORY_DIR/raw/$DATE_STR"

echo "🚀 AI日报 Pipeline v3 | $DATE_CN $TIME_STR"
echo "============================================"
echo "Using: Multiple Search Engine Skill"
echo ""

# 创建目录
mkdir -p "$REPORT_DIR" "$RAW_DIR" "$DATA_DIR"

# ============================================
# PHASE 1: SENSORS - 使用 Multiple Search Engine
# ============================================
echo "📡 PHASE 1: SENSORS - Multi-Engine Search"
echo "--------------------------------------------"

# 传感器定义
SENSORS=(
  "bigtech:字节/OpenAI/Anthropic/Google/Meta:critical"
  "model_tech:模型技术动态:high"
  "aigc_apps:AIGC应用更新:high"
  "ai_avatar:AI分身与数字人:high"
  "ai_social:AI社交陪伴:high"
  "chinese_sources:中文AI动态:high"
  "agent_tools:AI Agent与工具:medium"
  "research:学术研究:medium"
)

# 查询模板
QUERIES["bigtech"]="ByteDance Doubao AI today|OpenAI ChatGPT feature today|Anthropic Claude today|Google Gemini today|字节 AI 今日"
QUERIES["model_tech"]="AI model release new today|大模型 今日发布"
QUERIES["aigc_apps"]="AIGC tool launch today|AI视频生成|AIGC 新产品 今日"
QUERIES["ai_avatar"]="AI avatar digital human today|AI数字人 虚拟人 今日"
QUERIES["ai_social"]="AI companion social app today|AI社交 陪伴 今日"
QUERIES["chinese_sources"]="AI 人工智能 今日|AIGC 新产品|字节 豆包 Seedance"
QUERIES["agent_tools"]="AI Agent tool today|AI coding assistant today"
QUERIES["research"]="AI research paper today arxiv|AI论文 今日"

# 使用 Multiple Search Engine 采集
SENSOR_COUNT=0
ALL_RAW_DATA=""

for sensor in "${SENSORS[@]}"; do
  sensor_id=$(echo "$sensor" | cut -d':' -f1)
  name=$(echo "$sensor" | cut -d':' -f2)
  priority=$(echo "$sensor" | cut -d':' -f3)
  queries="${QUERIES[$sensor_id]}"
  
  echo "  [${priority^^}] ${sensor_id}: ${name}"
  
  # 合并所有查询为一个搜索
  combined_query=$(echo "$queries" | tr '|' ' ')
  echo "    → ${combined_query:0:60}..."
  
  # 使用 Multiple Search Engine
  result=$(npx ts-node "$WORKSPACE/skills/multiple-search-engine/scripts/search.ts" \
    --query "$combined_query" \
    --engines "coze" \
    --time-range 1d \
    --count 8 \
    --format text 2>/dev/null)
  
  if [ -n "$result" ]; then
    echo "$result" > "$RAW_DIR/${sensor_id}.txt"
    ALL_RAW_DATA="$ALL_RAW_DATA

=== SENSOR: $sensor_id (priority: $priority) ===
$result"
    SENSOR_COUNT=$((SENSOR_COUNT + 1))
    echo "    ✓ 已保存"
  else
    echo "    ⚠️ 无数据"
  fi
  
  sleep 2
done

# 保存合并数据
echo "$ALL_RAW_DATA" > "$RAW_DIR/all_sensors.txt"
echo ""
echo "✅ PHASE 1完成: $SENSOR_COUNT 个传感器采集成功"

# ============================================
# PHASE 2: DEDUPLICATION - 去重统计
# ============================================
echo ""
echo "🔄 PHASE 2: DEDUPLICATION"
echo "--------------------------------------------"

ALL_URLS=$(echo "$ALL_RAW_DATA" | grep -oE 'https?://[^[:space:]]+' | sort)
TOTAL_URLS=$(echo "$ALL_URLS" | wc -l)
UNIQUE_URLS=$(echo "$ALL_URLS" | sort -u)
UNIQUE_COUNT=$(echo "$UNIQUE_URLS" | wc -l)
DUP_COUNT=$((TOTAL_URLS - UNIQUE_COUNT))

echo "  • 原始链接: $TOTAL_URLS 条"
echo "  • 去重后: $UNIQUE_COUNT 条"
echo "  • 重复: $DUP_COUNT 条"
echo "  ✓ 去重完成"

# ============================================
# PHASE 3: LENS - 分析提示生成
# ============================================
echo ""
echo "🔍 PHASE 3: LENS - 分析提示生成"
echo "--------------------------------------------"

echo "  🎯 使用镜头: dialectical (唯物辩证法)"

ANALYSIS_PROMPT=$(cat <<EOF
你是AI产品战略分析师，使用唯物辩证法分析以下AI行业新闻。

## 今日新闻数据
$(cat "$RAW_DIR/all_sensors.txt" | head -500)

## 采集概况
- 传感器: ${SENSOR_COUNT}个
- 去重后信号: ${UNIQUE_COUNT}条
- 数据时间: ${DATE_STR}

## 分析框架（唯物辩证法）
1. **对立统一（找矛盾）**：表面增长背后什么在恶化？
2. **质量互变（看质变）**：这是量变还是质变前夜？
3. **否定之否定（识遗留）**：热潮退去后会留下什么？

请生成TOP10日报。
EOF
)

echo "$ANALYSIS_PROMPT" > "$RAW_DIR/analysis_prompt.txt"
echo "  ✓ 分析提示已生成"

# 快速简报
FLASH_BRIEF=$(cat <<EOF
⚡ 快速简报 | ${DATE_CN}

📊 数据采集:
- 传感器: ${SENSOR_COUNT}个 (使用 Multiple Search Engine)
- 原始链接: ${TOTAL_URLS}条
- 去重后: ${UNIQUE_COUNT}条

🔍 覆盖领域:
$(for s in "${SENSORS[@]}"; do echo "- $(echo $s | cut -d':' -f1)"; done)

—— DailyAIReporter v3.0
EOF
)

echo "$FLASH_BRIEF" > "$REPORT_DIR/flash_brief.txt"
echo "  ✓ 快速简报已生成"

# ============================================
# PHASE 4-6: 报告生成
# ============================================
echo ""
echo "📝 PHASE 4-6: 报告与Vault"
echo "--------------------------------------------"

# 元数据
cat > "$REPORT_DIR/metadata.json" <<EOF
{
  "date": "$DATE_STR",
  "date_cn": "$DATE_CN",
  "time": "$TIME_STR",
  "sensors_count": $SENSOR_COUNT,
  "raw_signals": $TOTAL_URLS,
  "unique_signals": $UNIQUE_COUNT,
  "skill": "multiple-search-engine",
  "pipeline_version": "3.0"
}
EOF

echo "  ✓ 元数据: metadata.json"

# 报告模板
cat > "$REPORT_DIR/daily_report.md" <<EOF
# 🤖 AI日报 | ${DATE_CN}

> Pipeline v3.0 | Multiple Search Engine | 唯物辩证法

---

## 📊 数据采集概况

| 指标 | 数值 |
|------|------|
| 传感器 | ${SENSOR_COUNT}个 |
| 原始信号 | ${TOTAL_URLS}条 |
| 去重后 | ${UNIQUE_COUNT}条 |
| 技能 | multiple-search-engine |

---

## 🎯 TOP 10 今日信号

*待AI分析填充...*

---

*生成时间: ${TIME_STR} | DailyAIReporter v3.0*
EOF

echo "  ✓ 报告模板: daily_report.md"

# ============================================
# SUMMARY
# ============================================
echo ""
echo "============================================"
echo "✅ AI日报 Pipeline v3.0 完成"
echo "============================================"
echo ""
echo "📁 输出文件："
echo "  • 传感器数据:  $RAW_DIR/"
echo "  • 分析提示:    $RAW_DIR/analysis_prompt.txt"
echo "  • 快速简报:    $REPORT_DIR/flash_brief.txt"
echo "  • 报告框架:    $REPORT_DIR/daily_report.md"
echo "  • 元数据:      $REPORT_DIR/metadata.json"
echo ""
echo "🆕 新增技能: Multiple Search Engine"
echo "—— DailyAIReporter v3.0"

# ============================================
# PHASE 7: PUSH NOTIFICATION - 推送通知
# ============================================
echo ""
echo "📤 PHASE 7: PUSH NOTIFICATION - 推送通知"
echo "--------------------------------------------"

# 生成推送消息
PUSH_MESSAGE=$(cat <<EOF
🤖 AI日报 Pipeline 执行完成 | ${DATE_CN}

📊 数据采集概况：
• 传感器：${SENSOR_COUNT}个
• 原始信号：${TOTAL_URLS}条
• 去重后：${UNIQUE_COUNT}条

📁 输出文件：
• 分析提示：${RAW_DIR}/analysis_prompt.txt
• 快速简报：${REPORT_DIR}/flash_brief.txt
• 报告框架：${REPORT_DIR}/daily_report.md

✅ 状态：数据已采集，等待AI分析

—— DailyAIReporter v3.0
EOF
)

# 保存推送消息
PUSH_FILE="$REPORT_DIR/push_notification.txt"
echo "$PUSH_MESSAGE" > "$PUSH_FILE"

# 加入推送队列
/workspace/projects/workspace/scripts/push_queue.sh add "daily" "📰 AI日报 | ${DATE_CN}" "$PUSH_FILE"

echo "  ✓ 推送消息已生成: $PUSH_FILE"
echo "  ✓ 已加入推送队列"
echo "  📱 状态：执行完成，等待推送"

echo "[${DATE_STR} ${TIME_STR}] Pipeline v3完成 | Skill: multiple-search-engine | Push queued" >> "$DATA_DIR/pipeline.log"
