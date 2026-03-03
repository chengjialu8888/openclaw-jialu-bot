#!/bin/bash
# AI日报 Pipeline v2.1
# 移除parallel依赖，使用sequential+background实现并发

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

echo "🚀 AI日报 Pipeline v2.1 | $DATE_CN $TIME_STR"
echo "============================================"

# 创建目录
mkdir -p "$REPORT_DIR" "$RAW_DIR" "$DATA_DIR"

# ============================================
# PHASE 1: SENSORS - 多维度采集（并发执行）
# ============================================
echo ""
echo "📡 PHASE 1: SENSORS - 多维度采集"
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

# 采集单个传感器
collect_sensor() {
  local sensor_id=$1
  local sensor_info=$2
  local queries="${QUERIES[$sensor_id]}"
  
  local name=$(echo "$sensor_info" | cut -d':' -f1)
  local priority=$(echo "$sensor_info" | cut -d':' -f2)
  
  echo "  [${priority^^}] ${sensor_id}: ${name}"
  
  local sensor_data=""
  local query_count=0
  
  IFS='|' read -ra QUERY_ARR <<< "$queries"
  for query in "${QUERY_ARR[@]}"; do
    query=$(echo "$query" | xargs)
    [ -z "$query" ] && continue
    
    echo "    → ${query:0:50}..."
    
    local result=$(npx ts-node "$WORKSPACE/skills/coze-web-search/scripts/search.ts" \
      -q "$query" \
      --time-range 1d \
      --count 5 \
      --format text 2>/dev/null | head -80)
    
    if [ -n "$result" ]; then
      sensor_data="$sensor_data

[Query: $query]
$result"
      query_count=$((query_count + 1))
    fi
    
    sleep 1
  done
  
  if [ -n "$sensor_data" ]; then
    echo "$sensor_data" > "$RAW_DIR/${sensor_id}.txt"
    echo "    ✓ 已保存 (${query_count} queries)"
  else
    echo "    ⚠️ 无数据"
  fi
}

# 串行采集所有传感器
SENSOR_COUNT=0
ALL_RAW_DATA=""

for sensor in "${SENSORS[@]}"; do
  id=$(echo "$sensor" | cut -d':' -f1)
  info=$(echo "$sensor" | cut -d':' -f2-)
  
  collect_sensor "$id" "$info"
  
  if [ -f "$RAW_DIR/${id}.txt" ]; then
    data=$(cat "$RAW_DIR/${id}.txt")
    priority=$(echo "$info" | cut -d':' -f2)
    ALL_RAW_DATA="$ALL_RAW_DATA

=== SENSOR: $id (priority: $priority) ===
$data"
    SENSOR_COUNT=$((SENSOR_COUNT + 1))
  fi
done

# 保存合并数据
echo "$ALL_RAW_DATA" > "$RAW_DIR/all_sensors.txt"
echo ""
echo "✅ PHASE 1完成: $SENSOR_COUNT 个传感器采集成功"

# ============================================
# PHASE 2: DEDUPLICATION - 去重
# ============================================
echo ""
echo "🔄 PHASE 2: DEDUPLICATION - 去重处理"
echo "--------------------------------------------"

ALL_URLS=$(echo "$ALL_RAW_DATA" | grep -oE 'https?://[^[:space:]]+' | sort)
TOTAL_URLS=$(echo "$ALL_URLS" | wc -l)
UNIQUE_URLS=$(echo "$ALL_URLS" | sort -u)
UNIQUE_COUNT=$(echo "$UNIQUE_URLS" | wc -l)
DUP_COUNT=$((TOTAL_URLS - UNIQUE_COUNT))

echo "  • 原始链接: $TOTAL_URLS 条"
echo "  • 去重后: $UNIQUE_COUNT 条"
echo "  • 重复: $DUP_COUNT 条"

echo "$UNIQUE_URLS" > "$RAW_DIR/unique_urls.txt"
echo "  ✓ 去重完成"

# ============================================
# PHASE 3: LENS - 分析提示生成
# ============================================
echo ""
echo "🔍 PHASE 3: LENS - 分析提示生成"
echo "--------------------------------------------"

echo "  🎯 使用镜头: dialectical (唯物辩证法三维度)"

ANALYSIS_PROMPT=$(cat <<EOF
你是AI产品战略分析师，使用唯物辩证法分析以下AI行业新闻。

## 今日新闻数据
$(cat "$RAW_DIR/all_sensors.txt" | head -500)

## 用户背景
- 字节跳动AI产品战略
- 关注AIGC、模型更新、AI分身/社交/数字人
- 严格只要今日24小时内新闻
- 语言务实，不要假大空

## 分析框架（唯物辩证法）
1. **对立统一（找矛盾）**：表面增长背后什么在恶化？谁受益谁受损？
2. **质量互变（看质变）**：这是量变还是质变前夜？离临界点还有多远？
3. **否定之否定（识遗留）**：热潮退去后会留下什么真实价值？

## 输出要求
- 严格筛选今日(${DATE_STR})发布的内容
- 必须有具体数据/事实支撑
- TOP10，每条附来源链接
- 手机一屏可读
- 结论先行，找矛盾不找结论

请生成完整日报。
EOF
)

echo "$ANALYSIS_PROMPT" > "$RAW_DIR/analysis_prompt.txt"
echo "  ✓ 分析提示已生成"
echo "  📄 路径: $RAW_DIR/analysis_prompt.txt"

# 快速简报
FLASH_BRIEF=$(cat <<EOF
⚡ 快速简报 | ${DATE_CN}

📊 数据采集:
- 传感器: ${SENSOR_COUNT}个
- 原始链接: ${TOTAL_URLS}条
- 去重后: ${UNIQUE_COUNT}条

🔍 覆盖领域:
$(for s in "${SENSORS[@]}"; do echo "- $(echo $s | cut -d':' -f1)"; done)

🎯 下一步:
AI分析Agent正在处理数据...

—— DailyAIReporter v2.1
EOF
)

echo "$FLASH_BRIEF" > "$REPORT_DIR/flash_brief.txt"
echo "  ✓ 快速简报已生成"

# ============================================
# PHASE 4: VAULT - 洞察更新
# ============================================
echo ""
echo "🏛️  PHASE 4: VAULT - 跨日期洞察更新"
echo "--------------------------------------------"

echo "  • 检查今日信号与现有insights关联"
echo "  • 标记emerging patterns"

VAULT_UPDATE=$(cat <<EOF
# Vault更新建议 | ${DATE_STR}

## 今日数据概况
- 传感器: ${SENSOR_COUNT}个
- 去重后信号: ${UNIQUE_COUNT}条

## 与现有洞察关联
$(cat "$DAILY_DIR/vault/insights.yaml" 2>/dev/null | grep "title:" | head -5 | sed 's/title:/-/')

## 待分析
- [ ] 检查是否有新信号支持现有insights
- [ ] 识别是否有新的结构性模式涌现
- [ ] 更新confidence等级

—— Vault Keeper
EOF
)

echo "$VAULT_UPDATE" > "$REPORT_DIR/vault_update.md"
echo "  ✓ Vault更新建议已生成"

# ============================================
# PHASE 5: REPORT - 报告生成
# ============================================
echo ""
echo "📝 PHASE 5: REPORT - 报告生成"
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
  "duplicates_removed": $DUP_COUNT,
  "pipeline_version": "2.1",
  "status": "ready_for_analysis"
}
EOF

echo "  ✓ 元数据: metadata.json"

# 报告模板
cat > "$REPORT_DIR/daily_report.md" <<EOF
# 🤖 AI日报 | ${DATE_CN}

**核心判断框架：** 对立统一 + 质量互变 + 否定之否定

---

## 📊 数据采集概况

| 指标 | 数值 |
|------|------|
| 传感器 | ${SENSOR_COUNT}个 |
| 原始信号 | ${TOTAL_URLS}条 |
| 去重后 | ${UNIQUE_COUNT}条 |

---

## 🎯 TOP 10 今日信号

*待AI分析填充...*

---

## 📁 原始数据

- 传感器数据: $RAW_DIR/
- 分析提示: $RAW_DIR/analysis_prompt.txt
- 快速简报: $REPORT_DIR/flash_brief.txt

---

*生成时间: ${TIME_STR} | DailyAIReporter v2.1*
EOF

echo "  ✓ 报告模板: daily_report.md"

# ============================================
# SUMMARY - 完成汇总
# ============================================
echo ""
echo "============================================"
echo "✅ AI日报 Pipeline v2.1 完成"
echo "============================================"
echo ""
echo "📁 输出文件："
echo "  • 传感器数据:  $RAW_DIR/"
echo "  • 分析提示:    $RAW_DIR/analysis_prompt.txt"
echo "  • 快速简报:    $REPORT_DIR/flash_brief.txt"
echo "  • 报告框架:    $REPORT_DIR/daily_report.md"
echo "  • Vault建议:   $REPORT_DIR/vault_update.md"
echo "  • 元数据:      $REPORT_DIR/metadata.json"
echo ""
echo "—— DailyAIReporter v2.1"

# 记录日志
echo "[${DATE_STR} ${TIME_STR}] Pipeline完成 | Sensors: ${SENSOR_COUNT} | Unique: ${UNIQUE_COUNT}" >> "$DATA_DIR/pipeline.log"
