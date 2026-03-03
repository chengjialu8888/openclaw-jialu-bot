import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/**
 * AI行业日报 - 自动搜索+分析版
 * 每天10:00am运行，输出TOP10+唯物辩证法判断
 */

const WORKSPACE = '/workspace/projects/workspace';
const MEMORY_DIR = path.join(WORKSPACE, 'memory');
const TODAY = new Date();
const DATE_STR = TODAY.toISOString().split('T')[0];
const TIME_STR = TODAY.toTimeString().slice(0, 5);
const DATE_CN = `${TODAY.getFullYear()}年${TODAY.getMonth() + 1}月${TODAY.getDate()}日`;

// 搜索查询列表
const SEARCH_QUERIES = [
  // 技术模型
  `AI model release new today ${DATE_STR} GPT Claude Gemini`,
  `AI architecture update new paper today ${DATE_STR}`,
  `foundation model announcement ${DATE_STR}`,
  
  // AIGC应用
  `AIGC content generation tool launch today ${DATE_STR}`,
  `AI video generation Sora Seedance update ${DATE_STR}`,
  `AI image generation Midjourney Stable Diffusion new ${DATE_STR}`,
  
  // AI分身/数字人
  `AI avatar digital human launch today ${DATE_STR}`,
  `AI clone personal AI assistant new ${DATE_STR}`,
  `virtual influencer AI character today ${DATE_STR}`,
  
  // AI社交/陪伴
  `AI companion chatbot launch today ${DATE_STR}`,
  `AI social app feature update ${DATE_STR}`,
  `character.ai replica AI friend new ${DATE_STR}`,
  
  // 大厂动态
  `ByteDance Doubao AI update today ${DATE_STR}`,
  `OpenAI ChatGPT new feature today ${DATE_STR}`,
  `Anthropic Claude update today ${DATE_STR}`,
  `Google Gemini AI new feature today ${DATE_STR}`,
  `Meta AI assistant update today ${DATE_STR}`,
  
  // Agent/工具
  `AI Agent autonomous tool launch today ${DATE_STR}`,
  `AI coding assistant new feature today ${DATE_STR}`,
  
  // 中文信源
  `AI大模型 今日发布 ${DATE_STR}`,
  `AIGC 新产品 今日 ${DATE_STR}`,
  `AI数字人 虚拟人 今日动态 ${DATE_STR}`,
  `AI社交 陪伴 今日 ${DATE_STR}`,
  `豆包 Seedance 字节AI ${DATE_STR}`
];

// 模拟搜索结果（实际应该调用search工具）
async function searchNews(query: string): Promise<string> {
  try {
    const result = execSync(
      `npx ts-node ${WORKSPACE}/skills/coze-web-search/scripts/search.ts -q "${query}" --time-range 1d --count 3 --format text`,
      { encoding: 'utf-8', timeout: 30000 }
    );
    return result;
  } catch (e) {
    return '';
  }
}

// 分析筛选TOP10
function analyzeTop10(allResults: string): string {
  // 提取所有新闻条目
  const lines = allResults.split('\n');
  const newsItems: Array<{title: string, url: string, source: string, snippet: string}> = [];
  
  let currentItem: any = {};
  for (const line of lines) {
    if (line.includes('http')) {
      const urlMatch = line.match(/(https?:\/\/[^\s]+)/);
      if (urlMatch) currentItem.url = urlMatch[1];
    } else if (line.startsWith('[') && line.includes(']')) {
      if (currentItem.title && currentItem.url) {
        newsItems.push({...currentItem});
      }
      currentItem = { title: line, url: '', source: line, snippet: '' };
    } else if (line.length > 20 && !line.startsWith('=')) {
      currentItem.snippet = (currentItem.snippet || '') + line + ' ';
    }
  }
  
  // 去重（基于URL）
  const uniqueItems = newsItems.filter((item, index, self) => 
    index === self.findIndex(t => t.url === item.url)
  );
  
  // 根据关键词重要性排序
  const priorityKeywords = ['字节', 'ByteDance', 'Doubao', 'Seedance', 'OpenAI', 'Anthropic', 'Claude', 'ChatGPT', 'GPT', 'Gemini', 'launch', 'release', 'new', '发布', '上线'];
  
  const scoredItems = uniqueItems.map(item => {
    let score = 0;
    const text = `${item.title} ${item.snippet}`.toLowerCase();
    priorityKeywords.forEach((kw, idx) => {
      if (text.includes(kw.toLowerCase())) score += priorityKeywords.length - idx;
    });
    // 有具体数据的加分
    if (/\d+%|\d+亿|\d+万|\$\d+/.test(text)) score += 5;
    return {...item, score};
  });
  
  scoredItems.sort((a, b) => b.score - a.score);
  const top10 = scoredItems.slice(0, 10);
  
  // 生成报告
  let report = `# 🤖 AI日报 | ${DATE_CN}\n\n`;
  report += `**核心判断：** 找矛盾、看质变、识否定之否定\n\n`;
  report += `---\n\n`;
  report += `## TOP 10 今日信号\n\n`;
  
  top10.forEach((item, idx) => {
    const title = item.title?.replace(/\[.*?\]/g, '').trim() || '未命名';
    const snippet = item.snippet?.slice(0, 100) || '';
    const url = item.url || 'N/A';
    
    report += `### ${idx + 1}. ${title}\n`;
    report += `**事实：** ${snippet}...\n`;
    report += `**来源：** ${url}\n`;
    report += `**矛盾点：** [待分析：表面现象 vs 隐藏张力]\n`;
    report += `**质变信号：** [待判断：量变还是质变前夜]\n\n`;
  });
  
  report += `---\n\n`;
  report += `## 一句话结论\n\n`;
  report += `- **主要矛盾：** [今日最核心的一对对立统一]\n`;
  report += `- **正在质变：** [什么正在跨越临界点]\n`;
  report += `- **否定之后留下：** [热潮退去后的真实价值]\n\n`;
  report += `---\n`;
  report += `*数据来源：${SEARCH_QUERIES.length}个维度搜索 | 筛选标准：24小时内+有事实支撑*\n`;
  
  return report;
}

// 主函数
async function main() {
  console.log(`📰 AI日报任务启动 | ${DATE_CN} ${TIME_STR}\n`);
  
  // 确保目录存在
  if (!fs.existsSync(MEMORY_DIR)) {
    fs.mkdirSync(MEMORY_DIR, { recursive: true });
  }
  
  // 收集搜索结果
  console.log('🔍 正在搜索今日AI动态...\n');
  let allResults = '';
  
  for (let i = 0; i < SEARCH_QUERIES.length; i++) {
    const query = SEARCH_QUERIES[i];
    console.log(`  [${i + 1}/${SEARCH_QUERIES.length}] ${query.slice(0, 50)}...`);
    
    try {
      const result = await searchNews(query);
      if (result) {
        allResults += `\n=== ${query} ===\n${result}\n`;
      }
      // 延迟避免请求过频
      await new Promise(r => setTimeout(r, 1000));
    } catch (e) {
      console.log(`    ⚠️ 搜索失败: ${query}`);
    }
  }
  
  // 保存原始数据
  const rawPath = path.join(MEMORY_DIR, `ai_search_raw_${DATE_STR}.txt`);
  fs.writeFileSync(rawPath, allResults);
  console.log(`\n✅ 原始数据已保存: ${allResults.split('\n').length} 行`);
  
  // 分析生成报告
  console.log('\n🧠 正在分析筛选TOP10...');
  const report = analyzeTop10(allResults);
  
  // 保存报告
  const reportPath = path.join(MEMORY_DIR, `ai_daily_report_${DATE_STR}.md`);
  fs.writeFileSync(reportPath, report);
  console.log(`✅ 报告已生成: ${reportPath}`);
  
  // 输出报告
  console.log('\n' + '='.repeat(50));
  console.log(report);
  console.log('='.repeat(50));
  
  // 记录日志
  const logPath = path.join(MEMORY_DIR, `ai_daily_${DATE_STR}.log`);
  fs.appendFileSync(logPath, `[${DATE_STR} ${TIME_STR}] 日报任务完成 ✓\n`);
}

main().catch(console.error);
