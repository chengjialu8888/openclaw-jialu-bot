# AI日报搜索快捷指令 (添加到 ~/.bashrc)
# 用法: 复制以下内容到 ~/.bashrc，然后 source ~/.bashrc

# 基础路径
export AI_DAILY_DIR="/workspace/projects/workspace"

# API Keys
export BRAVE_API_KEY="BSAO1u2ig_-n63B26Z4ZpkPGMqF8yVo"
export TAVILY_API_KEY="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"
export QVERIS_API_KEY="sk-wp5RD3Dn8n7tOkVEsVpbxLyKR7g9MBoxhkaNtzd7mM0"

# 中文快捷指令 (避免coze web search)
搜新闻() {
    local keyword="${1:-AI新闻}"
    echo "🔍 实时新闻搜索: $keyword"
    node "$AI_DAILY_DIR/scripts/multi-search.mjs" "$keyword" --format markdown 2>/dev/null | \
        grep -v "^📋\|^🔍\|^✅\|^📡" | sed 's/^[[:space:]]*//'
}

搜深度() {
    local keyword="${1:-AI分析}"
    echo "🔍 深度分析: $keyword"
    node "$AI_DAILY_DIR/scripts/multi-search.mjs" "$keyword" --format markdown 2>/dev/null | \
        grep -v "^📋\|^🔍\|^✅\|^📡" | sed 's/^[[:space:]]*//'
}

搜大厂() {
    local keyword="${1:-最新动态}"
    echo "🔍 大厂动态: $keyword"
    node "$AI_DAILY_DIR/scripts/multi-search.mjs" \
        "$keyword OpenAI Google Microsoft Meta Anthropic 字节 阿里 腾讯" \
        --format markdown 2>/dev/null | \
        grep -v "^📋\|^🔍\|^✅\|^📡" | sed 's/^[[:space:]]*//'
}

搜融资() {
    local keyword="${1:-AI startup}"
    echo "🔍 融资动态: $keyword"
    node "$AI_DAILY_DIR/scripts/multi-search.mjs" \
        "$keyword funding 融资" \
        --format markdown 2>/dev/null | \
        grep -v "^📋\|^🔍\|^✅\|^📡" | sed 's/^[[:space:]]*//'
}

搜趋势() {
    local keyword="${1:-AI趋势}"
    echo "🔍 行业趋势: $keyword"
    node "$AI_DAILY_DIR/scripts/multi-search.mjs" \
        "$keyword AI industry trends LLM agents" \
        --format markdown 2>/dev/null | \
        grep -v "^📋\|^🔍\|^✅\|^📡" | sed 's/^[[:space:]]*//'
}

搜全部() {
    local keyword="${1:-AI}"
    echo "🔍 全引擎搜索: $keyword"
    node "$AI_DAILY_DIR/scripts/multi-search.mjs" "$keyword" --format markdown 2>/dev/null | \
        grep -v "^📋\|^🔍\|^✅\|^📡" | sed 's/^[[:space:]]*//'
}

# 显示帮助
搜帮助() {
    echo "🤖 AI日报快捷搜索指令"
    echo ""
    echo "📌 可用指令:"
    echo "  搜新闻 [关键词]  - 实时新闻搜索(QVeris)"
    echo "  搜深度 [关键词]  - 深度分析(Tavily)"
    echo "  搜大厂 [关键词]  - 大厂动态专用"
    echo "  搜融资 [关键词]  - 融资新闻专用"
    echo "  搜趋势 [关键词]  - 行业趋势分析"
    echo "  搜全部 [关键词]  - 全引擎搜索"
    echo "  搜帮助          - 显示此帮助"
    echo ""
    echo "💡 示例:"
    echo "  搜新闻 OpenAI"
    echo "  搜大厂 Gemini"
    echo "  搜融资 今天"
    echo "  搜趋势 Agents"
}

# 简化别名
alias 新闻=搜新闻
alias 深度=搜深度
alias 大厂=搜大厂
alias 融资=搜融资
alias 趋势=搜趋势
