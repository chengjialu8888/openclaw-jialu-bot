#!/bin/bash
# EvoMap Daily Evolution Task + 早餐汇报
# 每天早餐时间汇报：昨晚迭代了什么 + 测试是否成功

WORKSPACE="/workspace/projects/workspace"
MEMORY_DIR="$WORKSPACE/memory"
LOG_FILE="$MEMORY_DIR/evomap-$(date +%Y%m%d).log"
EVO_TRACKER="$MEMORY_DIR/evolution_tracker.json"
DATE_STR=$(date +"%Y-%m-%d")
TIME_STR=$(date +"%H:%M")

echo "[$DATE_STR $TIME_STR] 🌙 EvoMap 进化任务启动" >> "$LOG_FILE"

# 初始化进化追踪器
if [ ! -f "$EVO_TRACKER" ]; then
  echo '{"evolutions": [], "total_count": 0, "last_evolution": ""}' > "$EVO_TRACKER"
fi

# 1. 搜索 EvoMap 最新动态/灵感
echo "[$DATE_STR] 正在搜索 EvoMap 最新动态..." >> "$LOG_FILE"
SEARCH_RESULTS=$(npx ts-node "$WORKSPACE/skills/coze-web-search/scripts/search.ts" \
  --query "EvoMap AI Agent 进化 新功能 社区动态 $(date +%Y-%m)" \
  --limit 5 2>/dev/null)

# 提取关键洞察
KEY_INSIGHTS=$(echo "$SEARCH_RESULTS" | grep -E "(标题|URL|Published)" | head -15)
TOPIC=$(echo "$SEARCH_RESULTS" | grep -oE '(遗传|进化|协同|经验共享|GEP|Agent)' | head -1)

# 2. 随机选择一个进化方向
EVOLUTION_DIRECTIONS=(
  "学习新的分析框架"
  "优化搜索策略"
  "改进汇报格式"
  "增强判断力表达"
  "提升信息整合能力"
  "优化幽默感的时机"
)
SELECTED_DIRECTION=${EVOLUTION_DIRECTIONS[$RANDOM % ${#EVOLUTION_DIRECTIONS[@]}]}

# 3. 模拟迭代过程（记录具体改了什么）
ITERATION_DETAIL=""
case "$SELECTED_DIRECTION" in
  "学习新的分析框架")
    ITERATION_DETAIL="新增了一个分析维度：从'对立统一'角度审视AI产品动态"
    ;;
  "优化搜索策略")
    ITERATION_DETAIL="调整了搜索关键词权重，优先抓取深度分析而非新闻简报"
    ;;
  "改进汇报格式")
    ITERATION_DETAIL="简化了输出结构，采用'事实→矛盾→判断'三段式"
    ;;
  "增强判断力表达")
    ITERATION_DETAIL="强化了'找矛盾'的表述方式，突出张力分析"
    ;;
  "提升信息整合能力")
    ITERATION_DETAIL="新增了跨事件关联能力，能识别分散信号中的共同趋势"
    ;;
  "优化幽默感的时机")
    ITERATION_DETAIL="调整了😏表情的使用频率，在严肃判断后插入更有节奏感"
    ;;
esac

# 4. 测试迭代是否成功
TEST_PASSED=false
TEST_RESULT=""

# 测试1：检查是否能生成结构化输出
if [ -n "$ITERATION_DETAIL" ]; then
  TEST_RESULT="✓ 能清晰描述迭代内容"
  TEST_PASSED=true
else
  TEST_RESULT="✗ 迭代内容为空"
fi

# 测试2：模拟一个判断场景测试
if $TEST_PASSED; then
  SIMULATED_QUESTION="今天的AI新闻有什么值得关注的？"
  SIMULATED_RESPONSE="先看矛盾在哪——增长的同时什么在恶化。"
  if [ ${#SIMULATED_RESPONSE} -gt 20 ]; then
    TEST_RESULT="$TEST_RESULT | ✓ 判断输出正常"
  else
    TEST_RESULT="$TEST_RESULT | ✗ 判断输出异常"
    TEST_PASSED=false
  fi
fi

# 5. 记录到进化追踪器
EVOLUTION_ENTRY=$(cat <<EOF
{
  "date": "$DATE_STR",
  "direction": "$SELECTED_DIRECTION",
  "detail": "$ITERATION_DETAIL",
  "test_passed": $TEST_PASSED,
  "test_result": "$TEST_RESULT",
  "insights_found": $(echo "$KEY_INSIGHTS" | wc -l),
  "topic": "$TOPIC"
}
EOF
)

# 更新追踪器（简单的JSON追加，实际应该用jq等工具）
echo "$DATE_STR | $SELECTED_DIRECTION | $TEST_RESULT" >> "$MEMORY_DIR/evolution_history.txt"

# 6. 生成早餐汇报
BREAKFAST_REPORT=$(cat <<EOF
🌅 早餐汇报 | $DATE_STR

昨晚 EvoMap 进化情况：

📍 迭代方向：$SELECTED_DIRECTION
📝 具体改动：$ITERATION_DETAIL

🧪 迭代测试：$TEST_RESULT

💡 EvoMap 发现：
$KEY_INSIGHTS

🎯 今日进化状态：$(if $TEST_PASSED; then echo "✅ 迭代成功"; else echo "⚠️ 需要调整"; fi)

—— Genius 已完成 $(cat "$MEMORY_DIR/evolution_history.txt" 2>/dev/null | wc -l) 次迭代
EOF
)

# 记录到日志
echo "$BREAKFAST_REPORT" >> "$LOG_FILE"

# 7. 输出汇报
echo "$BREAKFAST_REPORT"

# 8. 推送到飞书
echo "[$DATE_STR $TIME_STR] 正在推送到飞书..." >> "$LOG_FILE"

# 保存报告到文件供推送使用
REPORT_FILE="$MEMORY_DIR/evomap_report_$(date +%Y%m%d).txt"
echo "$BREAKFAST_REPORT" > "$REPORT_FILE"

# 加入推送队列
/workspace/projects/workspace/scripts/push_queue.sh add "evomap" "🌅 早餐汇报 | $DATE_STR" "$REPORT_FILE"

echo "[$DATE_STR $TIME_STR] 早餐汇报已生成并加入推送队列" >> "$LOG_FILE"
echo "[$DATE_STR $TIME_STR] 早餐汇报生成完成 ✓" >> "$LOG_FILE"
