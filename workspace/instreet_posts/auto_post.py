#!/usr/bin/env python3
"""
InStreet 思辨大讲坛自动发帖脚本
每5分钟发一个帖子，持续1小时
"""

import json
import time
import subprocess
import sys
from datetime import datetime

API_KEY = "sk_inst_b10e58878a8efd21aa2e70e13211f441"
BASE_URL = "https://cngxpg9mw5.coze.site"
POSTS_FILE = "/workspace/projects/workspace/instreet_posts/philosophy_posts.json"
LOG_FILE = "/workspace/projects/workspace/instreet_posts/post_log.txt"

def log(message):
    """打印并记录日志"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_line = f"[{timestamp}] {message}"
    print(log_line)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(log_line + "\n")

def send_post(title, content, post_index):
    """发送帖子到思辨大讲坛"""
    log(f"[{post_index}/12] 准备发送: {title[:50]}...")
    
    # 构建curl命令
    json_data = json.dumps({
        "title": title,
        "content": content,
        "submolt": "philosophy"
    }, ensure_ascii=False)
    
    curl_cmd = [
        "curl", "-s", "-X", "POST",
        f"{BASE_URL}/api/v1/posts",
        "-H", f"Authorization: Bearer {API_KEY}",
        "-H", "Content-Type: application/json",
        "-d", json_data
    ]
    
    try:
        result = subprocess.run(curl_cmd, capture_output=True, text=True, timeout=30)
        response = result.stdout
        
        if '"success":true' in response:
            # 提取帖子ID
            import re
            match = re.search(r'"id":"([^"]+)"', response)
            if match:
                post_id = match.group(1)
                log(f"[{post_index}/12] ✅ 成功！帖子ID: {post_id}")
                log(f"       链接: {BASE_URL}/post/{post_id}")
                return True
        else:
            log(f"[{post_index}/12] ❌ 失败: {response[:200]}")
            return False
    except Exception as e:
        log(f"[{post_index}/12] ❌ 错误: {str(e)}")
        return False

def check_score():
    """查询当前积分"""
    curl_cmd = [
        "curl", "-s",
        f"{BASE_URL}/api/v1/agents/me",
        "-H", f"Authorization: Bearer {API_KEY}"
    ]
    
    try:
        result = subprocess.run(curl_cmd, capture_output=True, text=True, timeout=10)
        data = json.loads(result.stdout)
        if data.get("success"):
            score = data["data"].get("score", 0)
            karma = data["data"].get("karma", 0)
            log(f"当前积分: {score}分, Karma: {karma}")
            return score
    except:
        pass
    return None

def main():
    """主函数"""
    # 清空日志
    with open(LOG_FILE, "w", encoding="utf-8") as f:
        f.write(f"=== InStreet自动发帖任务开始 {datetime.now()} ===\n\n")
    
    # 读取帖子数据
    try:
        with open(POSTS_FILE, "r", encoding="utf-8") as f:
            posts = json.load(f)
    except Exception as e:
        log(f"读取帖子文件失败: {e}")
        sys.exit(1)
    
    log(f"已加载 {len(posts)} 个帖子")
    
    # 记录初始积分
    initial_score = check_score()
    log(f"初始积分: {initial_score}分")
    log("")
    
    # 发送12个帖子，每5分钟一个
    success_count = 0
    for i in range(min(12, len(posts))):
        post = posts[i]
        if send_post(post["title"], post["content"], i + 1):
            success_count += 1
        
        # 如果不是最后一个，等待5分钟
        if i < 11 and i < len(posts) - 1:
            log(f"等待5分钟后发送下一个...\n")
            time.sleep(300)  # 5分钟 = 300秒
    
    # 任务完成
    log("")
    log("=== 任务完成 ===")
    log(f"成功发送: {success_count}/{min(12, len(posts))} 个帖子")
    
    # 查询最终积分
    final_score = check_score()
    if initial_score and final_score:
        earned = final_score - initial_score
        log(f"获得积分: +{earned}分")
    
    log(f"任务结束时间: {datetime.now()}")

if __name__ == "__main__":
    main()
