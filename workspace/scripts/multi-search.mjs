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
    },
    searxng: {
        endpoint: process.env.SEARXNG_ENDPOINT || 'http://localhost:8080',
        enabled: !!process.env.SEARXNG_ENDPOINT
    },
    qveris: {
        apiKey: process.env.QVERIS_API_KEY,
        enabled: !!process.env.QVERIS_API_KEY,
        newsToolId: 'newsdata.news.search.v1.b65ccc56'  // 新闻搜索工具ID
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

// 搜索SearXNG
async function searchSearxng(query, count = 10) {
    if (!CONFIG.searxng.enabled) {
        console.log('⚠️  SearXNG 未配置 (需设置 SEARXNG_ENDPOINT 环境变量)');
        return null;
    }
    
    try {
        console.log('  📡 正在连接 SearXNG...');
        
        const url = new URL(`${CONFIG.searxng.endpoint}/search`);
        url.searchParams.append('q', query);
        url.searchParams.append('format', 'json');
        url.searchParams.append('categories', 'general');
        url.searchParams.append('language', 'zh-CN');
        url.searchParams.append('time_range', 'day');
        
        const response = await fetchWithTimeout(url, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'OpenClaw-Bot/1.0'
            }
        }, 15000);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        
        // 取前count条结果
        const results = data.results?.slice(0, count).map(r => ({
            title: r.title,
            url: r.url,
            snippet: r.content,
            engine: r.engine,
            score: r.score
        })) || [];
        
        return {
            source: 'SearXNG',
            results: results,
            engines: data.engines || []
        };
    } catch (error) {
        console.error(`  ❌ SearXNG搜索失败: ${error.message}`);
        return null;
    }
}

// 搜索QVeris (实时新闻数据)
async function searchQveris(query, count = 10) {
    if (!CONFIG.qveris.enabled) {
        console.log('⚠️  QVeris 未配置 (需设置 QVERIS_API_KEY 环境变量)');
        return null;
    }
    
    try {
        console.log('  📡 正在连接 QVeris (实时新闻)...');
        
        const response = await fetchWithTimeout('https://qveris.ai/api/v1/tools/execute', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CONFIG.qveris.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tool_id: CONFIG.qveris.newsToolId,
                parameters: {
                    q: query,
                    size: count,
                    language: 'en',
                    from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 24小时内
                },
                max_response_size: 20480,
                timeout_ms: 30000
            })
        }, 35000);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        
        // 解析QVeris返回的新闻结果
        let results = [];
        if (data.result && Array.isArray(data.result)) {
            results = data.result.slice(0, count).map(r => ({
                title: r.title || '无标题',
                url: r.link || r.url || '',
                snippet: r.description || r.content || '',
                published: r.pubDate || r.publishedAt || '',
                source: r.source_id || r.source?.name || 'QVeris'
            }));
        }
        
        return {
            source: 'QVeris',
            results: results,
            total: data.result?.length || 0
        };
    } catch (error) {
        console.error(`  ❌ QVeris搜索失败: ${error.message}`);
        return null;
    }
}

// 综合搜索 - 合并多个引擎结果
async function multiSearch(query, countPerEngine = 5) {
    console.log(`\n🔍 开始多引擎搜索: "${query}"\n`);
    
    const results = [];
    
    // 并行调用多个搜索引擎
    const [braveResult, tavilyResult, searxngResult, qverisResult] = await Promise.all([
        searchBrave(query, countPerEngine),
        searchTavily(query, countPerEngine),
        searchSearxng(query, countPerEngine),
        searchQveris(query, countPerEngine)
    ]);
    
    if (braveResult) {
        results.push(braveResult);
        console.log(`  ✅ Brave: ${braveResult.results.length} 条结果`);
    }
    if (tavilyResult) {
        results.push(tavilyResult);
        console.log(`  ✅ Tavily: ${tavilyResult.results.length} 条结果`);
    }
    if (searxngResult) {
        results.push(searxngResult);
        console.log(`  ✅ SearXNG: ${searxngResult.results.length} 条结果 (引擎: ${searxngResult.engines?.join(', ') || 'N/A'})`);
    }
    if (qverisResult) {
        results.push(qverisResult);
        console.log(`  ✅ QVeris: ${qverisResult.results.length}/${qverisResult.total} 条实时新闻`);
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
        
        if (engine.engines) {
            md += `**聚合引擎**: ${engine.engines.join(', ')}\n\n`;
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
        console.log('  BRAVE_API_KEY     - Brave Search API Key');
        console.log('  TAVILY_API_KEY    - Tavily API Key');
        console.log('  SEARXNG_ENDPOINT  - SearXNG 实例地址 (例如: http://localhost:8080)');
        console.log('  QVERIS_API_KEY    - QVeris API Key (实时新闻数据)');
        console.log('');
        console.log('SearXNG 部署指南:');
        console.log('  1. Docker部署: docker run -d --name searxng -p 8080:8080 searxng/searxng');
        console.log('  2. 设置环境变量: export SEARXNG_ENDPOINT=http://localhost:8080');
        console.log('  3. 运行搜索脚本');
        console.log('');
        console.log('QVeris 安装指南:');
        console.log('  1. mkdir -p ~/.openclaw/skills/qveris/scripts');
        console.log('  2. curl -fSL https://qveris.ai/skill/SKILL.md -o ~/.openclaw/skills/qveris/SKILL.md');
        console.log('  3. curl -fSL https://qveris.ai/skill/scripts/qveris_tool.mjs -o ~/.openclaw/skills/qveris/scripts/qveris_tool.mjs');
        console.log('  4. export QVERIS_API_KEY=your_key_here');
        process.exit(1);
    }
    
    const query = args[0];
    const format = args.includes('--format') ? args[args.indexOf('--format') + 1] : 'markdown';
    
    // 检查API配置
    console.log('\n📋 API配置检查:');
    console.log(`  Brave API: ${CONFIG.brave.apiKey ? '✅ 已配置' : '❌ 未配置'}`);
    console.log(`  Tavily API: ${CONFIG.tavily.apiKey ? '✅ 已配置' : '❌ 未配置'}`);
    console.log(`  SearXNG: ${CONFIG.searxng.enabled ? `✅ 已配置 (${CONFIG.searxng.endpoint})` : '❌ 未配置 (设置 SEARXNG_ENDPOINT)'}`);
    console.log(`  QVeris: ${CONFIG.qveris.enabled ? '✅ 已配置 (实时新闻)' : '❌ 未配置 (设置 QVERIS_API_KEY)'}`);
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
