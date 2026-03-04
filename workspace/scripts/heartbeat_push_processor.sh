#!/bin/bash
# Heartbeat 推送处理器
# 检查推送队列并返回待推送的消息

WORKSPACE="/workspace/projects/workspace"
QUEUE_DIR="$WORKSPACE/memory/push_queue"

if [ ! -d "$QUEUE_DIR" ]; then
  exit 0
fi

# 获取所有待推送的文件（按时间排序）
PENDING_FILES=$(ls -1t "$QUEUE_DIR"/*.json 2>/dev/null | head -5)

if [ -z "$PENDING_FILES" ]; then
  exit 0
fi

# 处理每个待推送的文件
for file in $PENDING_FILES; do
  if [ -f "$file" ]; then
    # 解析 JSON 并输出内容
    TYPE=$(cat "$file" | grep '"type"' | cut -d'"' -f4)
    TITLE=$(cat "$file" | grep '"title"' | cut -d'"' -f4)
    
    echo "📤 待推送消息 ($TYPE): $TITLE"
    echo "---"
    
    # 输出内容（从JSON中提取）
    cat "$file" | grep '"content"' | sed 's/.*"content": "//' | sed 's/"$//' | sed 's/\\n/\n/g'
    
    echo ""
    echo "---"
    
    # 标记为已处理（移动到已处理目录）
    mkdir -p "$QUEUE_DIR/processed"
    mv "$file" "$QUEUE_DIR/processed/"
  fi
done
