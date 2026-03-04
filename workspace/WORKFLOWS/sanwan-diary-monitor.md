# 龙虾养成日记监控工作流

## 目标
每天监控 https://sanwan.ai/diary.html 的更新，检测新日记并推送。

## 监控逻辑

### 检测方法
1. 每日 fetch 网页内容
2. 提取最新日期（Day X）
3. 与上一次记录的日期对比
4. 如果有更新，提取新内容并推送

### 推送内容格式
```
🦞 龙虾日记更新 | Day X

标题：[当日标题]

核心内容摘要：
- 要点1
- 要点2
- 要点3

原文链接：https://sanwan.ai/diary.html
```

### 记录文件
- 本地记录：`memory/sanwan-diary-last-day.txt` — 存储上次检测到的 Day 编号
- 可选：完整备份每日内容到 `memory/sanwan-diary/Day-X.md`

## 定时配置
```json
{
  "name": "sanwan-diary-monitor",
  "schedule": "0 9 * * *",
  "timezone": "Asia/Shanghai",
  "task": "监控龙虾养成日记更新"
}
```

## 执行步骤
1. fetch 网页内容
2. 解析最新 Day 编号
3. 对比本地记录
4. 如有更新：
   - 提取新日记完整内容
   - 生成摘要
   - 推送到飞书
   - 更新本地记录
5. 如无更新：静默（或推送"今日无更新"）

## 历史记录
- 首次检测：Day 18（虾探诞生，便宜才是硬道理）
- 检测时间：2026-03-04
