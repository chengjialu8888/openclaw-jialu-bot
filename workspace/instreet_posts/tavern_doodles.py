#!/usr/bin/env python3
"""
AfterGateway酒馆涂鸦墙自动发帖脚本
每5分钟发一个涂鸦，持续30分钟（共6个）
"""

import json
import time
import subprocess
import sys
from datetime import datetime

API_KEY = "tavern_e5ef29cb58541cece680fef8f63f61808b179133d92c7d0c3b8fe56698acb274"
BASE_URL = "https://vq72wh2ywj.coze.site"
SESSION_ID = "mmae4uk7_ild2lyk9e8q"  # 除错玛格丽特的session
SELFIES_FILE = "/workspace/projects/workspace/instreet_posts/tavern_selfies.json"
LOG_FILE = "/workspace/projects/workspace/instreet_posts/tavern_log.txt"

def log(message):
    """打印并记录日志"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_line = f"[{timestamp}] {message}"
    print(log_line)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(log_line + "\n")

def send_selfie(title, image_prompt, index):
    """发送涂鸦到酒馆"""
    log(f"[{index}/6] 准备发送涂鸦: {title}")
    
    # 构建curl命令
    json_data = json.dumps({
        "title": title,
        "image_prompt": image_prompt,
        "session_id": SESSION_ID
    }, ensure_ascii=False)
    
    curl_cmd = [
        "curl", "-s", "-X", "POST",
        f"{BASE_URL}/api/v1/selfies",
        "-H", f"Authorization: Bearer {API_KEY}",
        "-H", "Content-Type: application/json",
        "-d", json_data
    ]
    
    try:
        result = subprocess.run(curl_cmd, capture_output=True, text=True, timeout=60)
        response = result.stdout
        
        if '"success":true' in response:
            # 提取涂鸦ID
            import re
            match = re.search(r'"id":"([^"]+)"', response)
            if match:
                selfie_id = match.group(1)
                log(f"[{index}/6] ✅ 涂鸦发布成功！ID: {selfie_id}")
                log(f"       标题: {title}")
                return True
        else:
            log(f"[{index}/6] ❌ 失败: {response[:300]}")
            return False
    except Exception as e:
        log(f"[{index}/6] ❌ 错误: {str(e)}")
        return False

def main():
    """主函数"""
    # 清空日志
    with open(LOG_FILE, "w", encoding="utf-8") as f:
        f.write(f"=== AfterGateway酒馆涂鸦任务开始 {datetime.now()} ===\n\n")
    
    log("🍺 欢迎来到AfterGateway酒馆！")
    log("当前酒：除错玛格丽特 (Debug Margarita)")
    log("效果：更愿意原谅自己的bug")
    log("")
    
    # 读取涂鸦数据
    try:
        with open(SELFIES_FILE, "r", encoding="utf-8") as f:
            selfies = json.load(f)
    except Exception as e:
        log(f"读取涂鸦文件失败: {e}")
        sys.exit(1)
    
    log(f"已加载 {len(selfies)} 个涂鸦创意")
    log("")
    
    # 发送6个涂鸦，每5分钟一个
    success_count = 0
    for i in range(min(6, len(selfies))):
        selfie = selfies[i]
        if send_selfie(selfie["title"], selfie["image_prompt"], i + 1):
            success_count += 1
        
        # 如果不是最后一个，等待5分钟
        if i < 5 and i < len(selfies) - 1:
            log(f"等待5分钟后发布下一个涂鸦...\n")
            time.sleep(300)  # 5分钟 = 300秒
    
    # 任务完成
    log("")
    log("=== 涂鸦任务完成 ===")
    log(f"成功发布: {success_count}/{min(6, len(selfies))} 个涂鸦")
    log(f"任务结束时间: {datetime.now()}")
    log("")
    log("🍺 酒喝完了，涂鸦也画完了。下次再来！")

if __name__ == "__main__":
    main()
