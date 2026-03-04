import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  published?: string;
  source: string;
  score: number;
}

interface Config {
  query: string;
  engines: string[];
  timeRange: string;
  count: number;
  deduplicate: boolean;
  format: 'json' | 'markdown' | 'text';
  sites?: string[];
}

// Parse command line arguments
function parseArgs(): Config {
  const args = process.argv.slice(2);
  const config: Config = {
    query: '',
    engines: ['tavily', 'brave', 'coze'],
    timeRange: '1d',
    count: 5,
    deduplicate: true,
    format: 'text'
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--query':
      case '-q':
        config.query = args[++i];
        break;
      case '--engines':
        config.engines = args[++i].split(',').map(e => e.trim());
        break;
      case '--time-range':
        config.timeRange = args[++i];
        break;
      case '--count':
      case '-n':
        config.count = parseInt(args[++i]);
        break;
      case '--deduplicate':
        config.deduplicate = true;
        break;
      case '--no-deduplicate':
        config.deduplicate = false;
        break;
      case '--format':
        config.format = args[++i] as 'json' | 'markdown' | 'text';
        break;
      case '--sites':
        config.sites = args[++i].split(',').map(s => s.trim());
        break;
    }
  }

  // If query not provided with flag, use first positional arg
  if (!config.query && args[0] && !args[0].startsWith('--')) {
    config.query = args[0];
  }

  if (!config.query) {
    console.error('Error: Query is required. Use --query or positional argument.');
    process.exit(1);
  }

  return config;
}

// Search with Tavily
async function searchTavily(query: string, count: number): Promise<SearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ TAVILY_API_KEY not set, skipping Tavily');
    return [];
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        max_results: count,
        include_answer: false,
        search_depth: 'advanced'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return (data.results || []).map((r: any) => ({
      title: r.title || '',
      url: r.url || '',
      snippet: r.content || r.snippet || '',
      published: r.published_date,
      source: 'tavily',
      score: r.score || 0.5
    }));
  } catch (error) {
    console.warn(`⚠️ Tavily search failed: ${error}`);
    return [];
  }
}

// Search with Brave
async function searchBrave(query: string, count: number): Promise<SearchResult[]> {
  const apiKey = process.env.BRAVE_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ BRAVE_API_KEY not set, skipping Brave');
    return [];
  }

  try {
    const params = new URLSearchParams({
      q: query,
      count: count.toString(),
      freshness: 'pd' // past day
    });

    const response = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
      headers: {
        'X-Subscription-Token': apiKey,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return (data.web?.results || []).map((r: any) => ({
      title: r.title || '',
      url: r.url || '',
      snippet: r.description || '',
      published: r.age,
      source: 'brave',
      score: 0.5
    }));
  } catch (error) {
    console.warn(`⚠️ Brave search failed: ${error}`);
    return [];
  }
}

// Search with Coze Web Search (via skill)
async function searchCoze(query: string, count: number, timeRange: string): Promise<SearchResult[]> {
  try {
    const baseDir = path.dirname(__dirname);
    const scriptPath = path.join(baseDir, '..', 'coze-web-search', 'scripts', 'search.ts');
    
    const result = execSync(
      `npx ts-node "${scriptPath}" -q "${query}" --time-range ${timeRange} --count ${count} --format json`,
      { encoding: 'utf-8', timeout: 30000 }
    );

    // Parse the text output to extract results
    const lines = result.split('\n');
    const results: SearchResult[] = [];
    let currentResult: Partial<SearchResult> = {};

    for (const line of lines) {
      if (line.match(/^\[\d+\]/)) {
        if (currentResult.title) {
          results.push({
            title: currentResult.title || '',
            url: currentResult.url || '',
            snippet: currentResult.snippet || '',
            source: 'coze',
            score: 0.5
          });
        }
        currentResult = { title: line.replace(/^\[\d+\]\s*/, '') };
      } else if (line.includes('URL:')) {
        currentResult.url = line.replace(/.*URL:\s*/, '').trim();
      } else if (line.includes('Source:')) {
        // skip
      } else if (line.trim() && !line.includes('===')) {
        currentResult.snippet = (currentResult.snippet || '') + line.trim() + ' ';
      }
    }

    if (currentResult.title) {
      results.push({
        title: currentResult.title,
        url: currentResult.url || '',
        snippet: currentResult.snippet || '',
        source: 'coze',
        score: 0.5
      });
    }

    return results;
  } catch (error) {
    console.warn(`⚠️ Coze search failed: ${error}`);
    return [];
  }
}

// Search with Exa
async function searchExa(query: string, count: number): Promise<SearchResult[]> {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ EXA_API_KEY not set, skipping Exa');
    return [];
  }

  try {
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify({
        query,
        num_results: count,
        use_autoprompt: true
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return (data.results || []).map((r: any) => ({
      title: r.title || '',
      url: r.url || '',
      snippet: r.text || '',
      source: 'exa',
      score: r.score || 0.5
    }));
  } catch (error) {
    console.warn(`⚠️ Exa search failed: ${error}`);
    return [];
  }
}

// Deduplicate results
function deduplicateResults(results: SearchResult[]): SearchResult[] {
  const seen = new Map<string, SearchResult>();

  for (const result of results) {
    // Use URL as primary key
    const key = result.url.toLowerCase().replace(/\/$/, '');
    
    if (seen.has(key)) {
      // Merge sources and boost score
      const existing = seen.get(key)!;
      existing.source = `${existing.source},${result.source}`;
      existing.score += 0.1; // Boost for multiple sources
    } else {
      seen.set(key, { ...result });
    }
  }

  // Sort by score (higher = found by more engines or higher ranked)
  return Array.from(seen.values()).sort((a, b) => b.score - a.score);
}

// Format results
function formatResults(results: SearchResult[], config: Config, totalRaw: number): string {
  const uniqueCount = results.length;

  switch (config.format) {
    case 'json':
      return JSON.stringify({
        query: config.query,
        engines_used: config.engines,
        total_raw: totalRaw,
        deduplicated: uniqueCount,
        results: results.map((r, i) => ({
          rank: i + 1,
          title: r.title,
          url: r.url,
          snippet: r.snippet.slice(0, 200),
          sources: r.source.split(','),
          published: r.published
        }))
      }, null, 2);

    case 'markdown':
      let md = `# Search Results: "${config.query}"\n\n`;
      md += `**Engines:** ${config.engines.join(', ')} | `;
      md += `**Results:** ${uniqueCount} unique from ${totalRaw} total\n\n`;
      md += '---\n\n';
      
      results.forEach((r, i) => {
        md += `### ${i + 1}. ${r.title}\n\n`;
        md += `**URL:** ${r.url}\n\n`;
        md += `**Sources:** ${r.source}\n\n`;
        if (r.published) md += `**Published:** ${r.published}\n\n`;
        md += `${r.snippet.slice(0, 300)}...\n\n`;
        md += '---\n\n';
      });
      return md;

    case 'text':
    default:
      let text = '='.repeat(60) + '\n';
      text += `MULTI-ENGINE SEARCH: "${config.query}"\n`;
      text += `Engines: ${config.engines.join(', ')}\n`;
      text += '='.repeat(60) + '\n\n';
      text += `[Deduplicated: ${uniqueCount} unique from ${totalRaw} total]\n\n`;

      results.forEach((r, i) => {
        text += `[${i + 1}] ${r.title}\n`;
        text += `    URL: ${r.url}\n`;
        text += `    Sources: ${r.source}\n`;
        if (r.published) text += `    Published: ${r.published}\n`;
        text += `    ${r.snippet.slice(0, 150)}...\n\n`;
      });

      return text;
  }
}

// Main function
async function main() {
  const config = parseArgs();
  
  console.log(`🔍 Multi-Engine Search: "${config.query}"`);
  console.log(`   Engines: ${config.engines.join(', ')}\n`);

  const allResults: SearchResult[] = [];

  // Search with each engine in parallel
  const searchPromises = config.engines.map(async (engine) => {
    console.log(`  → Searching ${engine}...`);
    
    switch (engine.toLowerCase()) {
      case 'tavily':
        return searchTavily(config.query, config.count);
      case 'brave':
        return searchBrave(config.query, config.count);
      case 'coze':
        return searchCoze(config.query, config.count, config.timeRange);
      case 'exa':
        return searchExa(config.query, config.count);
      default:
        console.warn(`⚠️ Unknown engine: ${engine}`);
        return [];
    }
  });

  const results = await Promise.all(searchPromises);
  results.forEach(r => allResults.push(...r));

  const totalRaw = allResults.length;
  console.log(`\n✓ Raw results: ${totalRaw}`);

  // Deduplicate if enabled
  const finalResults = config.deduplicate 
    ? deduplicateResults(allResults)
    : allResults;

  if (config.deduplicate) {
    console.log(`✓ After dedup: ${finalResults.length}`);
  }

  // Output results
  console.log('\n' + formatResults(finalResults, config, totalRaw));
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
