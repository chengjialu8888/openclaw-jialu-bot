# Heartbeat Checklist
# 每次heartbeat检查以下内容

1. **Check Push Queue** - 检查是否有待推送的cron任务结果
   - 查看 /workspace/projects/workspace/memory/push_queue/
   - 如果有未推送的消息，推送给用户
   - 推送后删除或标记为已处理

2. **Check EvoMap Evolution** - 检查EvoMap迭代状态
   - 查看最近一次的进化记录
   - 如有重要发现，简要汇报

3. **Check Daily Report Status** - 检查日报执行状态
   - 查看今日数据采集是否完成
   - 如已完成但未分析，提醒用户

4. **Check Dharma Morning** - 检查晨间祈福任务
   - 查看当前时间是否为 8:00
   - 查看 `memory/cron-trigger/dharma-morning.trigger`
   - 如果触发文件存在，推送诵经祈福 + 冥想音乐
   - 记录到 `memory/dharma-morning-history.md`

5. **Check Cron Triggers** - 检查系统cron触发文件
   - 查看 `/workspace/projects/workspace/memory/cron-trigger/`
   - 如果存在 `daily-report.trigger`，执行AI日报生成
   - 如果存在 `sanwan-diary.trigger`，执行龙虾日记检查
   - 执行后删除触发文件

5. **Check Sanwan Diary Updates** - 检查龙虾养成日记更新
   - 查看 `memory/sanwan-diary-last-day.txt`
   - 如果 Day > 记录值，提取新内容并推送
   - 如无更新，静默

6. **Token Tracking** - Token消耗追踪（每4小时一次）
   - 如果是 00:00, 04:00, 08:00, 12:00, 16:00, 20:00 时段
   - 记录当前session的token状态（通过session_status）
   - 累加到当日统计文件

7. **Memory Maintenance** - 内存维护
   - 清理超过30天的旧报告
   - 更新vault洞察

If nothing needs attention, reply HEARTBEAT_OK.
