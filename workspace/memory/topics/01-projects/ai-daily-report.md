# AI产品动态观察日报

**类型**: Project  
**创建**: 2026-03-06  
**更新**: 2026-03-06  
**状态**: 🔄 进行中

---

## 项目目标

为Jialu提供每日AI行业动态观察，覆盖大厂、初创、行业生态、KOL观点四个维度。

---

## 技术架构

### 定时任务（Crontab）
```
# 日报：每天10:30
30 10 * * * → daily_report.sh

# 周报：周五17:00
0 17 * * 5 → weekly_report.sh

# Gateway守护
* * * * * → 检查并重启gateway进程
```

### 搜索引擎
- **主引擎**: Tavily API ✅ 正常工作
- **备用引擎**: Brave API ⚠️ 网络不可达（快速跳过）
- **超时设置**: 3秒检测，8秒主请求

### 搜索范围
| 维度 | 关键词示例 |
|------|-----------|
| 大厂动态 | OpenAI, Google, Microsoft, Meta, Anthropic, 字节, 阿里, 腾讯 |
| 初创公司 | AI startup, funding, product launch |
| 行业生态 | AI industry, trends, LLM, agents |
| KOL观点 | Andrej Karpathy, Peter Yang, A16Z, Sequoia |

---

## 输出格式

- 保存位置: `/tmp/ai_daily_report_YYYY-MM-DD.md`
- 标记文件: `/tmp/ai_daily_report_YYYY-MM-DD.pending`
- 发送方式: Heartbeat检测pending文件 → 飞书私聊发送

---

## 运行状态

| 组件 | 状态 | 备注 |
|------|------|------|
| Tavily API | ✅ 正常 | AI摘要+相关度评分 |
| Brave API | ❌ 网络不可达 | 不影响主流程 |
| 日报脚本 | ✅ 已配置 | 每日10:30执行 |
| 周报脚本 | ✅ 已配置 | 周五17:00执行 |
| 定时任务 | ✅ 已写入crontab | 包含API Keys |

---

## 待优化项

- [ ] 脚本日志过滤（去除API检查输出）
- [ ] KOL搜索策略优化（改用人物+twitter）
- [ ] 报告内容去重和精炼
- [ ] 添加更多中文信息源

---

## 关联文件

- [daily_report.sh](/workspace/projects/workspace/scripts/daily_report.sh)
- [weekly_report.sh](/workspace/projects/workspace/scripts/weekly_report.sh)
- [multi-search.mjs](/workspace/projects/workspace/scripts/multi-search.mjs)

---

## 关联主题

- 向上: [[信息采集系统]]
- 同级: [[自画像演化]]
- 资源: [[Tavily API文档]]
