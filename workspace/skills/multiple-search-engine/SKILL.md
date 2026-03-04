---
name: multiple-search-engine
description: Aggregate multiple search engines (Tavily, Brave, Exa, Coze) into unified search results with deduplication and ranking.
homepage: https://github.com/openclaw/openclaw
metadata:
  openclaw:
    emoji: 🔍
    requires:
      bins: [npx, node]
---

# Multiple Search Engine

Aggregate results from multiple search engines for comprehensive coverage and better results.

## Supported Engines

- **Tavily** - AI-powered search with summaries
- **Brave** - Privacy-focused search
- **Exa** - Neural/semantic search
- **Coze Web Search** - General web search

## Quick Start

### Basic Search

```bash
npx ts-node {baseDir}/scripts/search.ts "AI news today"
```

### With Options

```bash
npx ts-node {baseDir}/scripts/search.ts \
  --query "AI news today" \
  --engines "tavily,brave,coze" \
  --time-range 1d \
  --count 10 \
  --deduplicate \
  --format markdown
```

### Site-Specific Search

```bash
npx ts-node {baseDir}/scripts/search.ts \
  --query "OpenAI news" \
  --sites "openai.com,techcrunch.com" \
  --engines "tavily,brave"
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--query, -q` | Search query (required) | - |
| `--engines` | Comma-separated engines to use | `tavily,brave,coze` |
| `--time-range` | `1d`, `1w`, `1m` | `1d` |
| `--count, -n` | Results per engine | `5` |
| `--deduplicate` | Remove duplicate results | `true` |
| `--format` | `json`, `markdown`, `text` | `text` |
| `--sites` | Limit to specific sites | - |

## Environment Variables

```bash
TAVILY_API_KEY=tvly-xxx
BRAVE_API_KEY=BSxxx
EXA_API_KEY=exa-xxx
```

## Output Format

### Text (default)

```
============================================================
MULTI-ENGINE SEARCH RESULTS (3 engines)
============================================================

[Deduplicated: 15 unique from 23 total]

[1] OpenAI announces GPT-5
    URL: https://openai.com/blog/gpt-5
    Sources: tavily, brave
    Published: 2026-03-03T10:00:00Z
    
[2] Google Gemini updates
    URL: https://blog.google/gemini
    Sources: coze
    Published: 2026-03-03T09:30:00Z
```

### JSON

```json
{
  "query": "AI news today",
  "engines_used": ["tavily", "brave", "coze"],
  "total_raw": 23,
  "deduplicated": 15,
  "results": [
    {
      "title": "OpenAI announces GPT-5",
      "url": "https://openai.com/blog/gpt-5",
      "sources": ["tavily", "brave"],
      "published": "2026-03-03T10:00:00Z"
    }
  ]
}
```

## Deduplication Logic

1. **URL exact match** - Same URL = same result
2. **Title similarity** - >85% similar titles merged
3. **Source tracking** - Keep track of which engines found each result
4. **Ranking** - Boost results found by multiple engines

## Engine Priority

When engines return conflicting info:
1. Tavily (AI summaries, freshness)
2. Brave (privacy, quality)
3. Exa (semantic relevance)
4. Coze (broad coverage)
