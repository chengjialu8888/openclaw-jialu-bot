#!/bin/bash
# 推送通知队列系统
# 将推送请求加入队列，等待主会话处理

WORKSPACE="/workspace/projects/workspace"
QUEUE_DIR="$WORKSPACE/memory/push_queue"
mkdir -p "$QUEUE_DIR"

# 创建推送请求
# 用法: ./push_queue.sh add <type> <title> <content_file>
# 或: ./push_queue.sh add <type> <title> "content string"

ACTION=$1
TYPE=$2
TITLE=$3
CONTENT=$4

if [ "$ACTION" != "add" ]; then
  echo "Usage: $0 add <type> <title> <content>"
  exit 1
fi

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
QUEUE_FILE="$QUEUE_DIR/${TYPE}_${TIMESTAMP}.json"

# 如果 CONTENT 是文件路径，读取文件内容
if [ -f "$CONTENT" ]; then
  CONTENT_DATA=$(cat "$CONTENT")
else
  CONTENT_DATA="$CONTENT"
fi

# 创建 JSON 格式的推送请求（转义特殊字符）
ESCAPED_CONTENT=$(echo "$CONTENT_DATA" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g')

cat > "$QUEUE_FILE" <<EOF
{
  "type": "$TYPE",
  "title": "$TITLE",
  "content": "$ESCAPED_CONTENT",
  "timestamp": "$(date -Iseconds)",
  "date_str": "$(date +%Y-%m-%d)",
  "time_str": "$(date +%H:%M)"
}
EOF

echo "✅ 推送请求已加入队列: $QUEUE_FILE"
