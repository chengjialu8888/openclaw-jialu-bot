#!/bin/bash
# 日终Token消耗统计与推送
# 每天23:59执行，汇总当日Token消耗并推送

WORKSPACE="/workspace/projects/workspace"
LOG_DIR="$WORKSPACE/memory/token_logs"
DATE_STR=$(date +"%Y-%m-%d")
DATE_CN=$(date +"%Y年%m月%d日")
REPORT_FILE="$WORKSPACE/memory/token_reports/${DATE_STR}.md"

mkdir -p "$WORKSPACE/memory/token_reports"

# 生成报告框架
# 注意：实际Token数据需要从OpenClaw后台或API获取
cat > "$REPORT_FILE" <<EOF
# 📊 Token消耗日报 | ${DATE_CN}

## 统计概况

| 指标 | 数值 |
|------|------|
| 总输入Token | [需从后台获取] |
| 总输出Token | [需从后台获取] |
| 总消耗Token | [需从后台获取] |
| 预估费用 | [需从后台获取] |

## 使用分析

- **高峰期**: [需分析]
- **主要用途**: [需分析]
- **优化建议**: [需分析]

---

*注：当前版本为框架，实际Token数据需要从OpenClaw后台API或日志中获取*
*建议集成方式：通过OpenClaw admin API或数据库查询*

生成时间: $(date +"%H:%M:%S")
EOF

echo "✅ Token日报已生成: $REPORT_FILE"

# 推送到队列（等待主会话推送）
if [ -f "$REPORT_FILE" ]; then
  /workspace/projects/workspace/scripts/push_queue.sh add "token_report" "📊 Token日报 | ${DATE_CN}" "$REPORT_FILE"
  echo "✅ 已加入推送队列"
fi
