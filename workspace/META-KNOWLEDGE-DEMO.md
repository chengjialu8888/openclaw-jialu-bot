# Meta-Knowledge System - 演示手册

> "从搭系统到现在，我思考问题的方式变了。我不再问'这个知识是什么'，我开始问'这个知识应该放在哪、什么时候出现、跟什么关联、过期了怎么办'。"

---

## 系统已就绪

### 文件结构

```
workspace/
├── META-KNOWLEDGE.md          ✅ 系统架构文档
├── learnings.md               ✅ 错误沉淀记录 (3条示例)
├── knowledge-ttl.yaml         ✅ 知识时效性配置
├── context-loader.md          ✅ 自动上下文加载规则
├── bootstrap/
│   ├── A-layer.md            ✅ 做事层：日报/检索/分析技能
│   ├── B-layer.md            ✅ 改进层：错误监控与规则沉淀
│   └── C-layer.md            ✅ 元层：机制设计与架构优化
└── skills/
    └── meta-knowledge/       ✅ 示例技能实现
        ├── SKILL.md
        └── index.ts
```

---

## 演示场景

### 场景 1: 错误沉淀机制

**用户:** "错了，今天的新闻应该是24小时内的"

**系统响应:**
```
📝 记录 Learning-004 🔴 [2026-03-03]

**场景:** 日报时间戳验证失效
**错误:** 提供了超过24小时的新闻
**根因:** 信息源没有时间过滤机制
**修正规则:** 生成日报时，必须验证每条信息的发布时间戳。
            无法确认时间的，默认丢弃。
**关联技能:** daily-report-generation
**生效状态:** active

✅ 已沉淀到 learnings.md
✅ 下次生成日报时自动调用此规则
```

**验证:**
```bash
cat workspace/learnings.md | tail -30
```

---

### 场景 2: 知识时效性管理

**用户:** "查看即将过期的知识"

**系统响应:**
```
📊 TTL 检查报告

即将过期 (3天内):
- Learning-001: 日报时效性误判 (还剩 2 天)
- [竞品动态]: OpenAI 发布信息 (还剩 1 天)

建议操作:
1. Learning-001 已内化到规则，可归档
2. 竞品动态建议更新最新信息

是否执行自动清理? (是/否/查看详情)
```

**用户:** "归档 Learning-001"

**系统响应:**
```
✅ Learning-001 已归档
📁 位置: workspace/archive/2026-03/learnings-archive.md
📌 原文件已标记为: status: archived
```

---

### 场景 3: A-B-C 层切换

**用户:** "/improve 日报生成"

**系统响应:**
```
🔧 进入 B-Layer 改进模式

目标技能: daily-report-generation (A-Layer Skill-001)

发现相关学习记录:
- Learning-001: 时效性问题 🔴
- Learning-002: 信息源优先级 🟡
- Learning-004: 时间戳验证 🔴 (新)

模式识别:
⚠️ 时效性问题出现 2 次 (Learning-001, 004)
→ 说明现有验证机制不充分

改进建议 (v3 策略):
1. 增加双重时间戳验证:
   - 第一重: 信息源的时间标签
   - 第二重: 交叉验证发布平台时间
2. 无法验证时间的信息，自动降级为"背景"而非"新闻"
3. 每日生成前，先扫描信息源时效性

是否应用新策略? (是/否/再想想)
```

**用户:** "进入 C-Layer，重新设计学习机制"

**系统响应:**
```
🎯 进入 C-Layer 元设计模式

当前问题:
- 时效性错误重复出现
- 可能原因: B-Layer 的规则提炼不够系统

元规则优化提案:
Meta-Rule-006: 重复错误自动升级
> 如果同类错误在30天内出现2次，
> 自动触发 C-Layer 介入，
> 而非等待10条学习的阈值。

新机制设计: 知识图谱关联
> 为每条学习建立关联图谱，
> Learning-001 和 Learning-004 会被识别为"时效性"聚类，
> 自动提示"此类问题已有相关规则"。

是否需要详细设计文档? (是/否)
```

---

### 场景 4: 自动上下文加载

**用户:** "今天有什么AI新闻"

**系统自动加载:**
```
🧠 Context Loader 执行中...

用户输入: "今天有什么AI新闻"
提取关键词: ["今天", "AI", "新闻"]
匹配文件: ["A-layer.md", "USER.md", "learnings.md"]

加载上下文 (6个文件):
1. META-KNOWLEDGE.md     - 系统架构
2. IDENTITY.md           - 我是 Genius，Sharp 风格
3. SOUL.md               - 唯物辩证法判断力
4. USER.md               - Jialu 的日报标准
5. A-layer.md Skill-001  - 日报生成执行标准
6. learnings.md (最新)   - Learning-004 时效性验证

⚡ 基于加载的上下文，直接执行:
- 优先检索 The Rundown AI / TLDR
- 严格24小时时间戳验证
- MECE 分类，结论先行
- 突出反直觉点
```

**系统输出:**
日报内容 (符合所有已加载的标准)...

---

## 验证命令

### 查看系统状态
```bash
# 查看所有配置文件
ls -la workspace/*.md workspace/*.yaml
ls -la workspace/bootstrap/

# 查看学习记录
cat workspace/learnings.md

# 查看 A-Layer 技能
cat workspace/bootstrap/A-layer.md

# 查看 B-Layer 方法论
cat workspace/bootstrap/B-layer.md

# 查看 C-Layer 设计原则  
cat workspace/bootstrap/C-layer.md
```

### 重启系统应用配置
```bash
sh /workspace/projects/scripts/restart.sh
```

---

## 核心机制总结

| 机制 | 核心文件 | 用户触发词 | 自动触发条件 |
|------|---------|-----------|-------------|
| 错误沉淀 | learnings.md | "错了" "记下来" | 用户纠正时 |
| 知识时效 | knowledge-ttl.yaml | "归档" "过期了" | 每日检查 / 到期时 |
| A-B-C 循环 | bootstrap/*.md | "/improve" "/design" | 每10条学习 / 月回顾 |
| 上下文加载 | context-loader.md | "/load" | 每次对话自动 |

---

## 下一步

1. **在飞书中测试**
   - 发送消息，观察自动上下文加载
   - 故意说"错了"，看是否记录到 learnings

2. **积累学习**
   - 每次互动后，系统会自动沉淀有价值的反馈
   - 达到10条后，自动触发 B-Layer 回顾

3. **C-Layer 优化**
   - 每月1日，系统会进入元反思模式
   - 你可以和 Genius 讨论如何优化整个系统

---

*"工具塑造思维，思维塑造工具的认知架构。"*
*这个循环，现在开始了。*
