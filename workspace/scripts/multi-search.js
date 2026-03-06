#!/usr/bin/env node
/**
 * Multiple Search Engine 工作流
 * 综合调用 Brave / Tavily / Eva API 进行搜索
 */

const axios = require('axios');
const fs = require('fs');

// API配置（从环境变量或配置文件读取）
const CONFIG = {
    brave: {
        apiKey: process.env.BRAVE_API_KEY,
        endpoint: 'https://api.search.brave.com/res/v1/web/search'
    },
    tavily: {
        apiKey: process.env.TAVILY_API_KEY,
        endpoint: 'https://api.tavily.com/search'
    },
    eva: {
        apiKey: process.env.EVA_API_KEY,
        endpoint: '' // Eva API endpoint需要确认
    }
};

// 搜索Brave
async function searchBrave(query, count = 10) {
    if (!CONFIG.brave.apiKey) {
        console.log('⚠️  Brave API Key未配置');
        return null;
    }
    
    try {
        const response = await axios.get(CONFIG.brave.endpoint, {
            headers: {
                'X-Subscription-Token': CONFIG.brave.apiKey,
                'Accept': 'application/json'
            },
            params: {
                q: query,
                count: count,
                offset: 0,
                mkt: 'zh-CN',
                freshness: 'day' // 最近24小时
            }
        });
        
        return {
            source: 'Brave',
            results: response.data.web?.results?.map(r => ({
                title: r.title,
                url: r.url,
                snippet: r.description,
                published: r.age
            })) || []
        };
    } catch (error) {
        console.error('Brave搜索失败:', error.message);
        return null;
    }
}

// 搜索Tavily
async function searchTavily(query, count = 10) {
    if (!CONFIG.tavily.apiKey) {
        console.log('⚠️  Tavily API Key未配置');
        return null;
    }
    
    try {
        const response = await axios.post(CONFIG.tavily.endpoint, {
            api_key: CONFIG.tavily.apiKey,
            query: query,
            search_depth: 'advanced',
            include_answer: true,
            max_results: count,
            time_range: 'day' // 最近24小时
        });
        
        return {
            source: 'Tavily',
            answer: response.data.answer,
            results: response.data.results?.map(r => ({
                title: r.title,
                url: r.url,
                snippet: r.content,
                score: r.score
            })) || []
        };
    } catch (error) {
        console.error('Tavily搜索失败:', error.message);
        return null;
    }
}

// 综合搜索 - 合并多个引擎结果
async function multiSearch(query, countPerEngine = 5) {
    console.log(`🔍 开始多引擎搜索: "${query}"\n`);
    
    const results = [];
    
    // 并行调用多个搜索引擎
    const [braveResult, tavilyResult] = await Promise.all([
        searchBrave(query, countPerEngine),
        searchTavily(query, countPerEngine)
    ]);
    
    if (braveResult) results.push(braveResult);
    if (tavilyResult) results.push(tavilyResult);
    
    return {
        query,
        timestamp: new Date().toISOString(),
        engines: results.length,
        data: results
    };
}

// 生成Markdown报告
function generateMarkdownReport(searchResults) {
    let md = `# 🔍 多引擎搜索结果\n\n`;
    md += `**查询**: ${searchResults.query}\n`;
    md += `**时间**: ${searchResults.timestamp}\n`;
    md += `**引擎数**: ${searchResults.engines}\n\n`;
    md += `---\n\n`;
    
    for (const engine of searchResults.data) {
        md += `## ${engine.source}\n\n`;
        
        if (engine.answer) {
            md += `**AI摘要**: ${engine.answer}\n\n`;
        }
        
        md += `### 搜索结果\n\n`;
        
        engine.results.forEach((r, i) => {
            md += `${i + 1}. **[${r.title}](${r.url})**\n`;
            md += `   - ${r.snippet?.substring(0, 200) || '无摘要'}...\n`;
            if (r.published) md += `   - 发布时间: ${r.published}\n`;
            if (r.score) md += `   - 相关度: ${r.score.toFixed(2)}\n`;
            md += `\n`;
        });
        
        md += `---\n\n`;
    }
    
    return md;
}

// 主函数
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length < 1) {
        console.log('用法: node multi-search.js "搜索关键词" [--format markdown|json]');
        console.log('');
        console.log('环境变量配置:');
        console.log('  BRAVE_API_KEY   - Brave Search API Key');
        console.log('  TAVILY_API_KEY  - Tavily API Key');
        console.log('  EVA_API_KEY     - Eva API Key (可选)');
        process.exit(1);
    }
    
    const query = args[0];
    const format = args.includes('--format') ? args[args.indexOf('--format') + 1] : 'markdown';
    
    const results = await multiSearch(query, 5);
    
    if (results.engines === 0) {
        console.log('❌ 所有搜索引擎都未返回结果，请检查API配置');
        process.exit(1);
    }
    
    if (format === 'json') {
        console.log(JSON.stringify(results, null, 2));
    } else {
        const md = generateMarkdownReport(results);
        console.log(md);
        
        // 保存到文件
        const filename = `/tmp/multi_search_${Date.now()}.md`;
        fs.writeFileSync(filename, md);
        console.log(`\n💾 报告已保存: ${filename}`);
    }
}

main().catch(console.error);
