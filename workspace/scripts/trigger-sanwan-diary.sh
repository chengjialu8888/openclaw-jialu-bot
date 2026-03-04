#!/bin/bash
# 龙虾日记监控触发脚本

WORKSPACE_DIR="/workspace/projects/workspace"
TRIGGER_FILE="$WORKSPACE_DIR/memory/cron-trigger/sanwan-diary.trigger"

mkdir -p "$WORKSPACE_DIR/memory/cron-trigger"
echo "$(date '+%Y-%m-%d %H:%M:%S')" > "$TRIGGER_FILE"
echo "Sanwan diary check triggered at $(date)" >> "$WORKSPACE_DIR/memory/cron-trigger.log"
