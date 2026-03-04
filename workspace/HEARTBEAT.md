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

4. **Token Tracking** - Token消耗追踪（每4小时一次）
   - 如果是 00:00, 04:00, 08:00, 12:00, 16:00, 20:00 时段
   - 记录当前session的token状态（通过session_status）
   - 累加到当日统计文件

5. **Memory Maintenance** - 内存维护
   - 清理超过30天的旧报告
   - 更新vault洞察

If nothing needs attention, reply HEARTBEAT_OK.
