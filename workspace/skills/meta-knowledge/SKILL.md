# SKILL.md - Meta-Knowledge System

## name

meta-knowledge

## description

元知识工程系统 - 让 Genius 越用越聪明的免疫系统。包含错误沉淀、知识时效管理、A-B-C自举循环、自动上下文加载四大核心机制。

## metadata

```yaml
author: Genius (for Jialu)
version: 1.0.0
tags:
  - meta-learning
  - knowledge-management
  - self-improvement
  - bootstrapping
requirements: []
```

## usage

### 错误沉淀

当 AI 犯错时，用户可以说：
- "错了，应该是..."
- "记下来：以后遇到这种情况..."
- "记住这个错误"

系统会自动：
1. 分析根因
2. 提炼规则
3. 记录到 learnings.md
4. 确认生效

### 查看学习记录

```
/show learnings
/学习记录
/我犯了哪些错
```

### 触发层间切换

```
# 进入 B-Layer 改进模式
/improve [技能名]
/优化 [流程]

# 进入 C-Layer 元设计模式
/design [机制]
/重新设计 [系统]

# 查看 A-Layer 技能
/skills
/技能清单
```

### 知识时效管理

```
# 标记信息过时
/expire [知识ID]
/过时了

# 查看 TTL 报告
/ttl-report
/知识时效报告

# 归档旧知识
/archive [主题]
/清理旧信息
```

### 上下文加载

系统自动根据关键词加载相关上下文。

手动指定：
```
/load [文件名]
/加载 [上下文]

# 深度加载全部
/load-all
/深度思考
```

## examples

### 示例 1: 记录错误

**用户:** "错了，日报里的 OpenAI 新闻是昨天的，不是今天的"

**AI:** 
```
记录 Learning-004 🔴

**场景:** 日报时间戳验证失效
**错误:** 提供了昨天的新闻作为"今天"
**根因:** 时间戳验证流程不完整
**修正规则:** 每条新闻必须二次确认发布日期，与当前日期差 > 24h 则丢弃

已沉淀到 learnings.md，下次自动生效。
```

### 示例 2: 查询学习记录

**用户:** "/show learnings"

**AI:**
```
最近 5 条学习记录:

1. 🔴 Learning-004: 日报时间戳验证 [今日]
2. 🟡 Learning-002: 信息源优先级 [03-03]
3. 🟢 Learning-003: 格式过度承诺 [03-03]
4. ...

模式识别: 时效性问题出现 2 次，建议优化 A-Layer Skill-001
```

### 示例 3: 进入改进模式

**用户:** "/improve 日报生成"

**AI:**
```
进入 B-Layer 模式，分析 Skill-001 (日报生成)...

发现可优化点:
1. 时间戳验证机制 (Learning-004)
2. 信息源加权算法 (Learning-002)

建议更新策略: daily-report-v3
- 增加时间戳二次验证步骤
- 实施信息源优先级自动排序

是否应用更新? (是/否/再想想)
```

## notes

- 所有学习记录存储在 `workspace/learnings.md`
- TTL 配置在 `workspace/knowledge-ttl.yaml`
- A-B-C 三层定义在 `workspace/bootstrap/`
- 自动加载规则在 `workspace/context-loader.md`

## changelog

### v1.0.0 (2026-03-03)
- 初始版本
- 实现四大核心机制
- 创建示例工作流
