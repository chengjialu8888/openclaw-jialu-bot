#!/bin/bash
# Cron任务推送助手
# 在cron任务执行完成后调用，推送结果到飞书

WORKSPACE="/workspace/projects/workspace"
DATE_STR=$(date +"%Y-%m-%d")
DATE_CN=$(date +"%Y年%m月%d日")
TIME_STR=$(date +"%H:%M")

# 检查任务类型
TASK_TYPE=$1

if [ -z "$TASK_TYPE" ]; then
  echo "Usage: $0 <evomap|daily>"
  exit 1
fi

case "$TASK_TYPE" in
  evomap)
    REPORT_FILE="$WORKSPACE/memory/evomap_report_$(date +%Y%m%d).txt"
    if [ -f "$REPORT_FILE" ]; then
      echo "🌅 EvoMap 早餐汇报 | $DATE_CN"
      echo ""
      cat "$REPORT_FILE"
      echo ""
      echo "✅ 执行完成 | $TIME_STR"
    else
      echo "⚠️ EvoMap 报告未找到: $REPORT_FILE"
    fi
    ;;
    
  daily)
    REPORT_DIR="$WORKSPACE/memory/reports/$DATE_STR"
    if [ -f "$REPORT_DIR/flash_brief.txt" ]; then
      echo "📰 AI日报数据采集完成 | $DATE_CN"
      echo ""
      cat "$REPORT_DIR/flash_brief.txt"
      echo ""
      echo "📁 详细报告：$REPORT_DIR/"
      echo "✅ 执行完成 | $TIME_STR"
    else
      echo "⚠️ AI日报报告未找到"
    fi
    ;;
    
  *)
    echo "Unknown task type: $TASK_TYPE"
    echo "Usage: $0 <evomap|daily>"
    exit 1
    ;;
esac
