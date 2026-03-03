#!/bin/bash
# AI行业日报任务 - 每天10:00am（自动分析版）
# 多维度搜索 → AI自动筛选TOP10 → 唯物辩证法判断 → 直接输出报告

cd /workspace/projects/workspace

WORKSPACE="/workspace/projects/workspace"
MEMORY_DIR="$WORKSPACE/memory"
LOG_FILE="$MEMORY_DIR/ai_daily_$(date +%Y%m%d).log"
DATE_STR=$(date +"%Y-%m-%d")
TIME_STR=$(date +"%H:%M")
TODAY=$(date +"%Y年%m月%d日")

echo "[$DATE_STR $TIME_STR] 📰 AI日报任务启动（自动分析版）" >> "$LOG_FILE"

# 搜索查询数组
SEARCH_QUERIES=(
  "AI model release new today $(date +%Y-%m-%d) GPT Claude Gemini"
  "AI video generation update today $(date +%Y-%m-%d) Sora Seedance"
  "AI avatar digital human launch today $(date +%Y-%m-%d)"
  "AI companion social app today $(date +%Y-%m-%d)"
  "ByteDance Doubao Seedance AI today $(date +%Y-%m-%d)"
  "OpenAI ChatGPT feature today $(date +%Y-%m-%d)"
  "Anthropic Claude update today $(date +%Y-%m-%d)"
  "Google Gemini AI today $(date +%Y-%m-%d)"
  "AI Agent tool launch today $(date +%Y-%m-%d)"
  "AIGC content tool new today $(date +%Y-%m-%d)"
  "AI大模型 今日发布 $(date +%Y-%m-%d)"
  "豆包 字节AI 今日 $(date +%Y-%m-%d)"
  "AI数字人 虚拟人 今日 $(date +%Y-%m-%d)"
  "AI社交 陪伴应用 今日 $(date +%Y-%m-%d)"
)

# 收集搜索结果
ALL_RESULTS=""
echo "🔍 正在搜索今日AI动态..." >> "$LOG_FILE"

for QUERY in "${SEARCH_QUERIES[@]}"; do
  echo "  搜索: $QUERY" >> "$LOG_FILE"
  RESULT=$(npx ts-node "$WORKSPACE/skills/coze-web-search/scripts/search.ts" \
    -q "$QUERY" \
    --time-range 1d \
    --count 3 \
    --format text 2>/dev/null | head -80)
  if [ -n "$RESULT" ]; then
    ALL_RESULTS="$ALL_RESULTS

[搜索] $QUERY
$RESULT"
  fi
  sleep 1
done

# 保存原始数据
echo "$ALL_RESULTS" > "$MEMORY_DIR/ai_search_raw_$(date +%Y%m%d).txt"
RAW_SIZE=$(echo "$ALL_RESULTS" | wc -l)
echo "[$DATE_STR] 原始数据已收集: $RAW_SIZE 行" >> "$LOG_FILE"

# 生成AI分析提示
ANALYSIS_PROMPT=$(cat <<EOF
你是AI产品战略分析师，需要从今天收集的AI行业新闻中筛选出最重要的10条，并用唯物辩证法进行分析。

## 原始搜索数据
$ALL_RESULTS

## 筛选标准（严格执行）
1. 必须是${DATE_STR}当天发布的内容（24小时内）
2. 必须有具体事实/数据/产品功能，排除PR通稿
3. 重点关注：AIGC、模型/架构更新、AI分身、AI社交、AI数字人
4. 竞品动态（字节/OpenAI/Anthropic/Google）优先

## 输出格式要求

# 🤖 AI日报 | ${TODAY}

## TOP 10 今日信号

### 1. [标题 - 一句话事实]
**来源：** [具体来源+链接]
**矛盾点：** [表面现象 vs 背后问题]
**质变信号：** [这是量变还是质变前夜？]

### 2-10. [同上格式]

## 一句话结论
- **主要矛盾：** [今天最核心的一对张力]
- **正在质变：** [什么正在跨越临界点]
- **否定之后留下：** [热潮退去后的真实价值]

## 写作要求
- 语言务实，不要假大空
- 每条必须带具体数据来源
- 用唯物辩证法找矛盾，不要只罗列新闻
- 总长度控制在手机屏幕一屏内可读完
EOF
)

# 保存分析提示
echo "$ANALYSIS_PROMPT" > "$MEMORY_DIR/ai_analysis_prompt_$(date +%Y%m%d).txt"

# 调用AI进行分析（通过sessions_spawn或直接生成）
echo "🧠 正在用AI分析筛选TOP10..." >> "$LOG_FILE"

# 由于shell脚本中直接调用AI较复杂，这里生成一个任务文件供外部处理
echo "$ANALYSIS_PROMPT" > /tmp/ai_daily_analysis_task.txt

# 输出生成提示，表示任务已准备好
echo "📰 AI日报数据已收集 | ${TODAY} ${TIME_STR}

✅ 搜索完成：${#SEARCH_QUERIES[@]} 个维度
✅ 原始数据：${RAW_SIZE} 行
✅ 分析任务：/tmp/ai_daily_analysis_task.txt

下一步：AI自动分析 → 生成TOP10+唯物辩证法判断

由于技术限制，需要调用AI Agent来完成最终分析。
原始数据已保存在：ai_search_raw_${DATE_STR}.txt

—— Genius"

echo "[$DATE_STR $TIME_STR] 数据收集完成，等待AI分析 ✓" >> "$LOG_FILE"
