# Memory Index - 记忆索引与导航

> 🧠 基于三层记忆模型 + PARA方法 + Zettelkasten笔记法
> 核心原则：「够用就好，复杂是敌人」

---

## 📋 待办看板（聚合所有待办）

| 待办项 | 来源 | 优先级 | 状态 |
|--------|------|--------|------|
| AI行业日报定时任务 | daily/2026-03-06.md | P0 | ✅ 已配置 |
| AI行业周报定时任务 | daily/2026-03-06.md | P0 | ✅ 已配置 |
| GitHub备份提醒（每天19:00） | daily/2026-03-06.md | P0 | ✅ 已配置 |
| 多引擎搜索集成 | daily/2026-03-06.md | P1 | ✅ 已完成 |
| 自画像v5.0最终版 | daily/2026-03-06.md | P1 | ✅ 已完成 |
| 日报脚本日志过滤 | daily/2026-03-06.md | P1 | ✅ 已完成 |
| 自画像保存到workspace | daily/2026-03-06.md | P1 | ✅ 已完成 |
| AGENTS.md升级（OpenClaw-PM V2） | daily/2026-03-06.md | P1 | ✅ 已完成 |

---

## 📁 PARA 导航

### 01-Projects（当前项目）
- [AI产品动态观察日报](./topics/01-projects/ai-daily-report.md) 🔄 进行中
  - 每日10:30自动搜索AI行业动态
  - Tavily API集成，Brave API备用
  - 覆盖大厂、初创、行业生态、KOL观点

### 02-Areas（长期领域）
- [Jialu用户画像](./topics/02-areas/user-profile.md) ✅ 已建立
  - 字节跳动AI产品战略
  - 日报偏好：深度>表面，2C>2B，软件>硬件
  - 信息源矩阵已记录
- [自画像演化](./topics/02-areas/self-portrait-evolution.md) ✅ 已建立
  - v1.0→v5.0完整演化记录
  - 视觉符号系统已建立
- [唯物辩证法方法论](./topics/02-areas/dialectical-materialism.md) ✅ 已建立
  - 三大核心规律
  - 日常判断操作手册

### 03-Resources（参考资料）
- [待填充...](./topics/03-resources/)

### 04-Archives（归档）
- [待填充...](./topics/04-archives/)

---

## 📅 每日日志

| 日期 | 主题 | 待办数 |
|------|------|--------|
| [2026-03-06](./daily/2026-03-06.md) | 记忆系统迭代+自画像最终版 | 4 |

---

## 🔍 快速链接

**核心文件**
- [SOUL.md](/workspace/projects/workspace/SOUL.md) - 性格、价值观、视觉人格
- [USER.md](/workspace/projects/workspace/USER.md) - 用户画像
- [AGENTS.md](/workspace/projects/workspace/AGENTS.md) - 工作手册
- [MEMORY.md](/workspace/projects/workspace/MEMORY.md) - 长期记忆核心

**工具脚本**
- `/workspace/projects/workspace/scripts/daily_report.sh` - 日报脚本
- `/workspace/projects/workspace/scripts/weekly_report.sh` - 周报脚本
- `/workspace/projects/workspace/scripts/multi-search.mjs` - 多引擎搜索

---

## 📝 写入规则

| 场景 | 写入位置 | 格式 |
|------|----------|------|
| 当天发生的事 | memory/daily/YYYY-MM-DD.md | 因→改→待 |
| 重要决策/洞察 | memory/topics/对应PARA分类 | 原子笔记 |
| 用户偏好更新 | MEMORY.md | 简洁记录 |
| 每次写入后 | 本文件(index.md) | 更新索引 |

---

## 🛡️ 安全提示

- 群聊/共享上下文：只加载L1工作记忆+L2当日日志
- 主会话（与Jialu直接对话）：加载全部三层+索引
- MEMORY.md 包含敏感信息，不对外泄露
