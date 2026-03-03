# AI日报系统 v2.0 - Signex架构 + Agent调度

> Signal + Nexus — where signals converge.  
> 多Skills整合 | Agent并行调度 | 唯物辩证法分析

## 架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        AGENT ORCHESTRATOR                        │
│                    (并行调度 + 故障恢复 + 监控)                    │
└──────────────┬────────────────────────────────┬─────────────────┘
               │                                │
    ┌──────────▼──────────┐          ┌──────────▼──────────┐
    │      SENSORS        │          │       SKILLS        │
    │  (8个维度并行采集)   │          │  (多源数据收集)      │
    ├─────────────────────┤          ├─────────────────────┤
    │ • bigtech (critical)│          │ • coze-web-search   │
    │ • model_tech (high) │          │ • tavily-search     │
    │ • aigc_apps (high)  │          │ • brave-search      │
    │ • ai_avatar (high)  │          │ • github-trending   │
    │ • ai_social (high)  │          │ • product-hunt      │
    │ • chinese (high)    │          │ • arxiv-api         │
    │ • agent_tools (med) │          │ • x-api             │
    │ • research (med)    │          └─────────────────────┘
    └──────────┬──────────┘
               │
    ┌──────────▼──────────┐
    │    DEDUPLICATION    │
    │    (智能去重清洗)    │
    ├─────────────────────┤
    │ • URL去重           │
    │ • 标题相似度(0.85)   │
    │ • 时间过滤(24h)      │
    │ • 优先级排序         │
    └──────────┬──────────┘
               │
    ┌──────────▼──────────┐
    │  CONTENT EXTRACTION │
    │    (内容提取)        │
    └──────────┬──────────┘
               │
    ┌──────────▼──────────┐          ┌─────────────────────┐
    │       LENS          │          │       VAULT         │
    │   (AI分析视角)       │◄────────►│  (跨日期洞察存储)    │
    ├─────────────────────┤          ├─────────────────────┤
    │ • dialectical       │          │ • paradigm_shift    │
    │   (唯物辩证法)       │          │ • structural_tension│
    │ • flash_brief       │          │ • inflection_signals│
    │ • dual_take         │          │ • emergent_patterns │
    │ • timeline_trace    │          │ • strategic_implic. │
    └──────────┬──────────┘          └─────────────────────┘
               │
    ┌──────────▼──────────┐
    │       REPORT        │
    │    (报告生成)        │
    ├─────────────────────┤
    │ • TOP10信号         │
    │ • 结构性结论         │
    │ • Vault引用         │
    │ • 飞书推送          │
    └─────────────────────┘
```

## 核心特性

### 1. 多Skills数据收集

| Skill | 用途 | 数据源 |
|-------|------|--------|
| `coze-web-search` | 通用搜索 | Web |
| `tavily-search` | 深度搜索 | AI摘要 |
| `brave-search` | 隐私搜索 | 实时结果 |
| `github-trending` | 开源动态 | GitHub |
| `product-hunt` | 产品发布 | PH API |
| `arxiv-api` | 学术论文 | arXiv |
| `x-api` | KOL动态 | Twitter/X |

### 2. Agent并行调度

```yaml
# 8个传感器并行采集
concurrency:
  max_parallel_sensors: 4
  max_parallel_queries: 3

# Pipeline阶段
stages:
  - collect      # 并行采集
  - deduplicate  # 智能去重
  - extract      # 内容提取
  - analyze      # AI分析
  - report       # 报告生成
  - vault        # 洞察更新
  - notify       # 推送通知
```

### 3. 唯物辩证法Lens (默认)

**对立统一（找矛盾）**
- 表面增长背后什么在恶化？
- 谁受益谁受损？
- 张力在哪里？

**质量互变（看质变）**
- 这是量变还是质变前夜？
- 离临界点还有多远？

**否定之否定（识遗留）**
- 热潮退去后留下什么？
- 什么是真实的、可持续的价值？

### 4. Vault跨日期洞察

持续追踪的结构性信号：
1. **AI助手进化为"价值观载体"** (paradigm_shift)
2. **消费AI进入"信任经济"阶段** (paradigm_shift)
3. **DAU信仰进入黄昏期** (structural_tension)
4. **具身智能2028年生死线** (inflection_signals)

## 目录结构

```
daily/
├── README.md                    # 本文档
├── sensors/
│   └── config.yaml             # 传感器配置（8维度+多Skills）
├── lens/
│   └── config.yaml             # 分析镜头配置（4种视角）
├── vault/
│   └── insights.yaml           # 跨日期洞察存储
├── memory/
│   └── user_profile.yaml       # 用户偏好学习
├── agent/
│   ├── orchestrator.yaml       # Agent调度配置
│   └── analyze.sh              # AI分析执行脚本
└── pipeline/
    └── run_daily.sh            # 一键执行脚本

memory/
├── raw/YYYY-MM-DD/             # 每日原始数据
│   ├── all_sensors.txt
│   ├── analysis_prompt.txt
│   └── unique_urls.txt
└── reports/YYYY-MM-DD/         # 每日报告
    ├── daily_report.md
    ├── flash_brief.txt
    ├── vault_update.md
    └── metadata.json
```

## 使用方法

### 一键执行完整Pipeline

```bash
# 手动执行
./daily/pipeline/run_daily.sh

# 指定日期
./daily/pipeline/run_daily.sh 2026-03-03
```

### AI分析生成最终报告

```bash
# 使用AI分析数据并生成报告
./daily/agent/analyze.sh

# 或指定日期
./daily/agent/analyze.sh 2026-03-03
```

### 定时任务

```bash
# 编辑cron配置
crontab -e

# 每天10:00自动执行
0 10 * * * /workspace/projects/workspace/daily/pipeline/run_daily.sh

# 10:15 AI分析生成报告
15 10 * * * /workspace/projects/workspace/daily/agent/analyze.sh
```

### 快速简报（Flash Brief）

Pipeline执行后自动生成 `flash_brief.txt`：

```
⚡ 快速简报 | 2026年3月3日

📊 数据采集:
- 传感器: 8个
- 原始信号: 156条
- 去重后: 89条

🔍 覆盖领域:
- bigtech (critical)
- model_tech (high)
- aigc_apps (high)
- ...

🎯 下一步:
AI分析Agent正在处理...
```

## 配置说明

### 环境变量

```bash
# 在 .env 文件中配置
TAVILY_API_KEY=tvly-xxx
BRAVE_API_KEY=BSxxx
EXA_API_KEY=exa-xxx
PRODUCT_HUNT_API_KEY=xxx
X_API_KEY=xxx
```

### 传感器优先级

| 优先级 | 传感器 | 说明 |
|--------|--------|------|
| critical | bigtech | 字节/OpenAI/Anthropic等 |
| high | model_tech, aigc_apps, ai_avatar, ai_social, chinese | 核心关注领域 |
| medium | agent_tools, research | 补充领域 |

### 用户偏好

编辑 `daily/memory/user_profile.yaml`：

```yaml
preferences:
  focus_areas:
    AIGC: 1.0
    AI分身: 0.9
    AI社交: 0.9
    AI数字人: 0.9
    字节竞品: 1.0
  
  language_style:
    - 直接，不废话
    - 务实，不假大空
    - 有判断，有立场
```

## 升级日志

### v2.0 (2026-03-03)
- ✅ Signex架构重构
- ✅ 8传感器并行采集
- ✅ 多Skills整合（coze/tavily/brave/github/ph/arxiv/x）
- ✅ Agent调度器（orchestrator.yaml）
- ✅ 智能去重（URL+相似度）
- ✅ 唯物辩证法Lens（默认）
- ✅ Vault跨日期洞察
- ✅ Flash Brief快速简报
- ✅ 用户偏好Memory系统

### v1.0 (2026-03-02)
- 基础日报功能
- 简单搜索采集
- 基础分析报告

---

*Powered by Claude Code | Inspired by Signex | 唯物辩证法驱动*
