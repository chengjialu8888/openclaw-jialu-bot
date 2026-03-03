/**
 * Meta-Knowledge System - 核心实现
 * 
 * 元知识工程系统 - 让 Genius 越用越聪明的免疫系统
 */

import { skill } from '../../../../../skill-utils';

export default skill({
  name: 'meta-knowledge',
  description: '元知识工程系统 - 错误沉淀、知识时效、A-B-C自举循环、自动上下文加载',
  
  // ============ 1. 错误沉淀机制 ============
  
  async recordLearning({ error, correction, context }) {
    const learningId = `Learning-${String(await this.getLearningCount() + 1).padStart(3, '0')}`;
    const timestamp = new Date().toISOString().split('T')[0];
    
    // 根因分析 (简化版，实际可调用 LLM 深入分析)
    const rootCause = await this.analyzeRootCause(error, correction);
    
    // 提炼规则
    const rule = await this.extractRule(error, correction, rootCause);
    
    // 构建学习记录
    const learningEntry = `
## ${learningId} 🔴 [${timestamp}] ${error.type || '通用错误'}

**场景:** ${context.scenario}
**错误:** ${error.description}
**根因:** ${rootCause}
**修正规则:** ${rule}
**关联技能:** ${context.skill || 'general'}
**生效状态:** active

---
`;

    // 追加到 learnings.md
    await this.appendToFile('workspace/learnings.md', learningEntry);
    
    // 触发 B-Layer 评估 (如果达到阈值)
    if (await this.shouldTriggerBLayer()) {
      await this.triggerBLayerReview();
    }
    
    return {
      learningId,
      status: 'recorded',
      message: `已记录 ${learningId}，下次自动生效`
    };
  },

  // ============ 2. 知识时效性管理 ============
  
  async checkKnowledgeTTL() {
    const ttlConfig = await this.readYAML('workspace/knowledge-ttl.yaml');
    const learnings = await this.parseLearnings();
    
    const now = new Date();
    const expiredItems = [];
    const upcomingItems = [];
    
    for (const entry of learnings) {
      const age = (now - new Date(entry.date)) / (1000 * 60 * 60 * 24); // days
      const ttl = this.getTTLForType(entry.type, ttlConfig);
      
      if (age > ttl) {
        expiredItems.push({ ...entry, age, ttl });
      } else if (age > ttl - 3) {
        upcomingItems.push({ ...entry, daysLeft: ttl - age });
      }
    }
    
    return {
      expired: expiredItems,
      upcoming: upcomingItems,
      report: this.generateTTLReport(expiredItems, upcomingItems)
    };
  },

  async archiveKnowledge(knowledgeId) {
    // 标记为已归档
    await this.updateLearningStatus(knowledgeId, 'archived');
    
    // 移动到归档目录
    const entry = await this.getLearning(knowledgeId);
    await this.appendToFile(
      `workspace/archive/${new Date().toISOString().slice(0, 7)}/learnings-archive.md`,
      entry.content
    );
    
    return { status: 'archived', knowledgeId };
  },

  // ============ 3. A-B-C 层切换与控制 ============
  
  async enterLayer(layerName, task) {
    const layers = {
      'A': {
        file: 'workspace/bootstrap/A-layer.md',
        role: '执行者',
        description: '直接交付结果，不思考改进'
      },
      'B': {
        file: 'workspace/bootstrap/B-layer.md',
        role: '改进者',
        description: '监控系统，沉淀规则，优化策略'
      },
      'C': {
        file: 'workspace/bootstrap/C-layer.md',
        role: '设计者',
        description: '优化机制本身，设计元规则'
      }
    };
    
    const layer = layers[layerName];
    if (!layer) throw new Error(`未知层级: ${layerName}`);
    
    // 加载对应层级的上下文
    const layerContext = await this.readFile(layer.file);
    
    return {
      layer: layerName,
      role: layer.role,
      context: layerContext,
      task,
      instruction: `进入 ${layerName}-Layer: ${layer.description}\n任务: ${task}`
    };
  },

  async improveSkill(skillName) {
    // 进入 B-Layer 模式
    const bLayer = await this.enterLayer('B', `改进技能: ${skillName}`);
    
    // 分析该技能相关的学习记录
    const relevantLearnings = await this.getLearningsBySkill(skillName);
    
    // 识别模式
    const patterns = await this.identifyPatterns(relevantLearnings);
    
    // 生成改进建议
    const suggestions = await this.generateImprovements(skillName, patterns);
    
    return {
      layer: 'B',
      skill: skillName,
      learnings: relevantLearnings,
      patterns,
      suggestions,
      nextStep: '用户确认后更新 A-layer.md'
    };
  },

  // ============ 4. 自动上下文加载 ============
  
  async loadContext(userInput) {
    const contextFiles = [];
    
    // Layer 0: 元知识系统 (必载)
    contextFiles.push({
      file: 'workspace/META-KNOWLEDGE.md',
      reason: '系统架构理解',
      priority: 0
    });
    
    // Layer 1: 身份层 (必载)
    contextFiles.push(
      { file: 'workspace/IDENTITY.md', reason: '身份定义', priority: 1 },
      { file: 'workspace/SOUL.md', reason: '判断力原则', priority: 1 },
      { file: 'workspace/USER.md', reason: '用户档案', priority: 1 }
    );
    
    // Layer 2: 最新学习 (必载)
    const recentLearnings = await this.getRecentLearnings(10);
    contextFiles.push({
      file: 'workspace/learnings.md',
      reason: '最新学习记录',
      priority: 2,
      excerpt: recentLearnings
    });
    
    // 动态加载: 关键词匹配
    const keywords = this.extractKeywords(userInput);
    const dynamicFiles = await this.matchFilesByKeywords(keywords);
    
    // 合并并去重
    const allFiles = [...contextFiles, ...dynamicFiles];
    const uniqueFiles = this.deduplicateByPriority(allFiles);
    
    // 限制加载数量 (避免上下文过长)
    const finalFiles = uniqueFiles.slice(0, 6);
    
    // 读取文件内容
    const loadedContext = await Promise.all(
      finalFiles.map(async (item) => ({
        ...item,
        content: await this.readFile(item.file)
      }))
    );
    
    return {
      keywords,
      loadedFiles: finalFiles.map(f => f.file),
      context: loadedContext,
      summary: `已加载 ${finalFiles.length} 个上下文文件，关键词: ${keywords.join(', ')}`
    };
  },

  // 关键词映射表
  keywordMap: {
    '日报': ['A-layer.md', 'USER.md'],
    'daily': ['A-layer.md', 'USER.md'],
    'report': ['A-layer.md', 'USER.md'],
    '竞品': ['A-layer.md'],
    'competitor': ['A-layer.md'],
    '趋势': ['A-layer.md', 'SOUL.md'],
    'trend': ['A-layer.md', 'SOUL.md'],
    '错了': ['B-layer.md', 'learnings.md'],
    '不对': ['B-layer.md', 'learnings.md'],
    '改进': ['C-layer.md', 'B-layer.md'],
    '优化': ['C-layer.md', 'B-layer.md'],
    '信息源': ['USER.md'],
    'source': ['USER.md'],
    '时效': ['knowledge-ttl.yaml'],
    '过期': ['knowledge-ttl.yaml']
  },

  // ============ 辅助方法 ============
  
  async getLearningCount() {
    // 读取 learnings.md 统计数量
    const content = await this.readFile('workspace/learnings.md');
    const matches = content.match(/Learning-\d+/g);
    return matches ? Math.max(...matches.map(m => parseInt(m.split('-')[1]))) : 0;
  },

  async analyzeRootCause(error, correction) {
    // 简化分析，实际可调用 LLM
    return `从"${error.description}"到"${correction}"，根因是执行标准不明确`;
  },

  async extractRule(error, correction, rootCause) {
    // 提炼可执行规则
    return `以后遇到类似情况，应该: ${correction}`;
  },

  async shouldTriggerBLayer() {
    const count = await this.getLearningCount();
    return count % 10 === 0; // 每10条触发一次
  },

  async triggerBLayerReview() {
    return this.enterLayer('B', '定期回顾：已积累10条学习，分析模式');
  },

  extractKeywords(text) {
    // 简单的关键词提取
    const words = text.toLowerCase().split(/\s+/);
    return Object.keys(this.keywordMap).filter(kw => 
      words.some(w => w.includes(kw.toLowerCase()))
    );
  },

  async matchFilesByKeywords(keywords) {
    const files = [];
    for (const kw of keywords) {
      const mapped = this.keywordMap[kw];
      if (mapped) {
        mapped.forEach(file => {
          files.push({
            file: `workspace/${file}`,
            reason: `关键词"${kw}"匹配`,
            priority: 3
          });
        });
      }
    }
    return files;
  },

  deduplicateByPriority(files) {
    const seen = new Map();
    for (const f of files) {
      if (!seen.has(f.file) || seen.get(f.file).priority > f.priority) {
        seen.set(f.file, f);
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.priority - b.priority);
  },

  // ============ 文件操作辅助 ============
  
  async readFile(path) {
    // 实际实现中调用文件系统
    return `[File content: ${path}]`;
  },

  async appendToFile(path, content) {
    // 实际实现中调用文件系统
    console.log(`Appending to ${path}`);
  },

  async readYAML(path) {
    // 实际实现中解析 YAML
    return {};
  },

  async parseLearnings() {
    // 解析 learnings.md
    return [];
  },

  async getRecentLearnings(n) {
    // 获取最近 n 条学习
    return [];
  },

  async getLearningsBySkill(skill) {
    // 获取关联到某技能的学习
    return [];
  },

  async identifyPatterns(learnings) {
    // 识别模式
    return { patterns: [] };
  },

  async generateImprovements(skill, patterns) {
    // 生成改进建议
    return [];
  },

  getTTLForType(type, config) {
    const defaults = {
      'breaking_news': 7,
      'product_update': 30,
      'strategic_judgment': 90,
      'meta_rule': 0 // 永不过期
    };
    return defaults[type] || 30;
  },

  generateTTLReport(expired, upcoming) {
    return `
TTL 检查报告:
- 已过期: ${expired.length} 条
- 即将过期: ${upcoming.length} 条
- 建议操作: ${expired.length > 0 ? '请审查过期知识' : '无需操作'}
`;
  }
});
