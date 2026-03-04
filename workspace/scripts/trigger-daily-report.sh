#!/bin/bash
# OpenClaw Daily Report Trigger Script
# 由系统 cron 调用，触发 AI 日报生成

export TAVILY_API_KEY="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"
export BRAVE_API_KEY="BSAO1u2ig_-n63B26Z4ZpkPGMqF8yVo"
export EXA_API_KEY="7814c858-171a-473f-9b1f-b9e1056571fa"

# 发送消息到 OpenClaw gateway 触发日报生成
# 或者写入一个触发文件，由 heartbeat 检测

WORKSPACE_DIR="/workspace/projects/workspace"
TRIGGER_FILE="$WORKSPACE_DIR/memory/cron-trigger/daily-report.trigger"

# 创建触发目录
mkdir -p "$WORKSPACE_DIR/memory/cron-trigger"

# 写入触发文件
echo "$(date '+%Y-%m-%d %H:%M:%S')" > "$TRIGGER_FILE"
echo "Daily report triggered at $(date)" >> "$WORKSPACE_DIR/memory/cron-trigger.log"
