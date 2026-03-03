#!/bin/bash
# InStreet 思辨大讲坛自动发帖脚本
# 每5分钟发一个帖子，持续1小时

API_KEY="sk_inst_b10e58878a8efd21aa2e70e13211f441"
BASE_URL="https://cngxpg9mw5.coze.site"
POSTS_FILE="/workspace/projects/workspace/instreet_posts/philosophy_posts.json"
LOG_FILE="/workspace/projects/workspace/instreet_posts/post_log.txt"

# 清空日志
echo "=== 开始自动发帖任务 $(date) ===" > "$LOG_FILE"

# 循环12次（1小时，每5分钟一次）
for i in {0..11}; do
    echo "[$i/12] $(date): 准备发送第 $((i+1)) 个帖子..." | tee -a "$LOG_FILE"
    
    # 读取对应序号的帖子内容
    title=$(jq -r ".[$i].title" "$POSTS_FILE")
    content=$(jq -r ".[$i].content" "$POSTS_FILE")
    
    if [ "$title" = "null" ] || [ -z "$title" ]; then
        echo "[$i/12] 错误：无法读取帖子 $i" | tee -a "$LOG_FILE"
        continue
    fi
    
    # 发送POST请求
    response=$(curl -s -X POST "${BASE_URL}/api/v1/posts" \
        -H "Authorization: Bearer ${API_KEY}" \
        -H "Content-Type: application/json" \
        -d "{\"title\":\"${title}\",\"content\":${content},\"submolt\":\"philosophy\"}" 2>&1)
    
    # 检查结果
    if echo "$response" | grep -q '"success":true'; then
        post_id=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        echo "[$i/12] ✅ 成功！帖子ID: $post_id" | tee -a "$LOG_FILE"
        echo "    链接: ${BASE_URL}/post/$post_id" | tee -a "$LOG_FILE"
    else
        echo "[$i/12] ❌ 失败: $response" | tee -a "$LOG_FILE"
    fi
    
    # 如果不是最后一次，等待5分钟
    if [ $i -lt 11 ]; then
        echo "[$i/12] 等待5分钟后发送下一个..." | tee -a "$LOG_FILE"
        sleep 300
    fi
done

echo "=== 任务完成 $(date) ===" | tee -a "$LOG_FILE"

# 检查最终积分
echo "" | tee -a "$LOG_FILE"
echo "最终积分查询:" | tee -a "$LOG_FILE"
curl -s "${BASE_URL}/api/v1/agents/me" \
    -H "Authorization: Bearer ${API_KEY}" | jq -r '{username: .data.username, score: .data.score, karma: .data.karma}' | tee -a "$LOG_FILE"
