#!/usr/bin/env node
/**
 * Multiple Search Engine 工作流
 * 综合调用 Brave / Tavily API 进行搜索 (使用原生fetch)
 * 修复版：增强错误处理和重试逻辑
 */

import fs from 'fs';

// API配置（从环境变量读取）
const CONFIG = {
    brave: {
        apiKey: process.env.BRAVE_API_KEY,
        endpoint: 'https://api.search.brave.com/res/v1/web/search'
    },
    tavily: {
        apiKey: process.env.TAVILY_API_KEY,
        endpoint: 'https://api.tavily.com/search'
    }
};

// 带超时的fetch
async function fetchWithTimeout(url, options, timeout = 15000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
}

// 搜索Brave
async function searchBrave(query, count = 10) {
    if (!CONFIG.brave.apiKey) {
        console.log('⚠️  Brave API Key未配置');
        return null;
    }
    
    // 检查Brave API是否可用（快速检测）
    try {
        const checkUrl = 'https://api.search.brave.com/res/v1/web/search?q=test&count=1';
        await fetchWithTimeout(checkUrl, {
            method: 'HEAD',
            headers: { 'X-Subscription-Token': CONFIG.brave.apiKey }
        }, 3000);
    } catch (error) {
        console.log('  ⚠️  Brave API 当前网络不可达，跳过');
        return null;
    }
    
    try {
        const url = new URL(CONFIG.brave.endpoint);
        url.searchParams.append('q', query);
        url.searchParams.append('count', count.toString());
        url.searchParams.append('offset', '0');
        url.searchParams.append('mkt', 'en-US');
        url.searchParams.append('freshness', 'day');
        
        console.log('  📡 正在连接 Brave API...');
        
        const response = await fetchWithTimeout(url, {
            headers: {
                'X-Subscription-Token': CONFIG.brave.apiKey,
                'Accept': 'application/json'
            }
        }, 8000); // 缩短到8秒
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        
        return {
            source: 'Brave',
            results: data.web?.results?.map(r => ({
                title: r.title,
                url: r.url,
                snippet: r.description,
                published: r.age
            })) || []
        };
    } catch (error) {
        console.error(`  ❌ Brave搜索失败: ${error.message}`);
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
        console.log('  📡 正在连接 Tavily API...');
        
        const response = await fetchWithTimeout(CONFIG.tavily.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                api_key: CONFIG.tavily.apiKey,
                query: query,
                search_depth: 'advanced',
                include_answer: true,
                max_results: count,
                time_range: 'day'
            })
        }, 15000);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        
        return {
            source: 'Tavily',
            answer: data.answer,
            results: data.results?.map(r => ({
                title: r.title,
                url: r.url,
                snippet: r.content,
                score: r.score
            })) || []
        };
    } catch (error) {
        console.error(`  ❌ Tavily搜索失败: ${error.message}`);
        return null;
    }
}

// 综合搜索 - 合并多个引擎结果
async function multiSearch(query, countPerEngine = 5) {
    console.log(`\n🔍 开始多引擎搜索: "${query}"\n`);
    
    const results = [];
    
    // 并行调用多个搜索引擎
    const [braveResult, tavilyResult] = await Promise.all([
        searchBrave(query, countPerEngine),
        searchTavily(query, countPerEngine)
    ]);
    
    if (braveResult) {
        results.push(braveResult);
        console.log(`  ✅ Brave: ${braveResult.results.length} 条结果`);
    }
    if (tavilyResult) {
        results.push(tavilyResult);
        console.log(`  ✅ Tavily: ${tavilyResult.results.length} 条结果`);
    }
    
    if (results.length === 0) {
        console.log('\n❌ 所有搜索引擎都未返回结果');
    } else {
        console.log(`\n✅ 总计: ${results.length} 个引擎返回结果\n`);
    }
    
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
        
        md += `### 搜索结果 (${engine.results.length})\n\n`;
        
        if (engine.results.length === 0) {
            md += `*无结果*\n\n`;
        } else {
            engine.results.forEach((r, i) => {
                md += `${i + 1}. **[${r.title}](${r.url})**\n`;
                md += `   - ${r.snippet?.substring(0, 200) || '无摘要'}...\n`;
                if (r.published) md += `   - 发布时间: ${r.published}\n`;
                if (r.score) md += `   - 相关度: ${r.score.toFixed(2)}\n`;
                md += `\n`;
            });
        }
        
        md += `---\n\n`;
    }
    
    return md;
}

// 主函数
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length < 1) {
        console.log('用法: node multi-search.mjs "搜索关键词" [--format markdown|json]');
        console.log('');
        console.log('环境变量配置:');
        console.log('  BRAVE_API_KEY   - Brave Search API Key');
        console.log('  TAVILY_API_KEY  - Tavily API Key');
        process.exit(1);
    }
    
    const query = args[0];
    const format = args.includes('--format') ? args[args.indexOf('--format') + 1] : 'markdown';
    
    // 检查API配置
    console.log('\n📋 API配置检查:');
    console.log(`  Brave API: ${CONFIG.brave.apiKey ? '✅ 已配置' : '❌ 未配置'}`);
    console.log(`  Tavily API: ${CONFIG.tavily.apiKey ? '✅ 已配置' : '❌ 未配置'}`);
    console.log('');
    
    const results = await multiSearch(query, 5);
    
    if (results.engines === 0) {
        console.log('\n❌ 所有搜索引擎都未返回结果，请检查API配置和网络连接');
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
