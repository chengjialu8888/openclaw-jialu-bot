#!/bin/bash
# 护法祈福任务触发脚本
# 每天早上8点触发诵经祈福 + 冥想音乐

WORKSPACE_DIR="/workspace/projects/workspace"
TRIGGER_FILE="$WORKSPACE_DIR/memory/cron-trigger/dharma-morning.trigger"

mkdir -p "$WORKSPACE_DIR/memory/cron-trigger"
echo "$(date '+%Y-%m-%d %H:%M:%S')" > "$TRIGGER_FILE"
echo "Dharma morning ritual triggered at $(date)" >> "$WORKSPACE_DIR/logs/cron-dharma.log"
