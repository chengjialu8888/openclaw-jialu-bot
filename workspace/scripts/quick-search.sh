#!/bin/bash
# AI日报快捷搜索指令 (中文)
# 用法: source quick-search.sh [指令] [关键词]

BASE_DIR="/workspace/projects/workspace"

# 加载API Keys
export BRAVE_API_KEY="${BRAVE_API_KEY:-BSAO1u2ig_-n63B26Z4ZpkPGMqF8yVo}"
export TAVILY_API_KEY="${TAVILY_API_KEY:-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}"
export QVERIS_API_KEY="${QVERIS_API_KEY:-sk-wp5RD3Dn8n7tOkVEsVpbxLyKR7g9MBoxhkaNtzd7mM0}"

# 过滤函数
filter_output() {
    grep -v "^📋\|^🔍\|^⚠️\|^💾\|^✅\|^📡\|^❌" | \
    grep -v "^总计\|^开始\|^完成\|^$" | \
    grep -v "API配置\|正在连接\|搜索失败\|API.*未配置\|网络不可达" | \
    sed 's/^[[:space:]]*//' | \
    grep -v "^[[:space:]]*$"
}

# 中文快捷指令
case "$1" in
    "搜新闻"|"新闻")
        # QVeris实时新闻
        echo "🔍 正在搜索实时新闻: $2"
        node "${BASE_DIR}/scripts/multi-search.mjs" "$2" --format markdown 2>/dev/null | filter_output
        ;;
    "搜深度"|"深度")
        # Tavily深度分析
        echo "🔍 正在深度分析: $2"
        node "${BASE_DIR}/scripts/multi-search.mjs" "$2" --format markdown 2>/dev/null | filter_output
        ;;
    "搜大厂"|"大厂")
        # 大厂动态专用
        echo "🔍 正在搜索大厂动态..."
        node "${BASE_DIR}/scripts/multi-search.mjs" \
            "$2 OpenAI Google Microsoft Meta Anthropic 字节 阿里 腾讯" \
            --format markdown 2>/dev/null | filter_output
        ;;
    "搜融资"|"融资")
        # 融资新闻专用
        echo "🔍 正在搜索融资动态..."
        node "${BASE_DIR}/scripts/multi-search.mjs" \
            "$2 AI startup funding 融资" \
            --format markdown 2>/dev/null | filter_output
        ;;
    "搜趋势"|"趋势")
        # 行业趋势
        echo "🔍 正在搜索行业趋势..."
        node "${BASE_DIR}/scripts/multi-search.mjs" \
            "$2 AI industry trends LLM agents" \
            --format markdown 2>/dev/null | filter_output
        ;;
    "搜全部"|"全部")
        # 全引擎搜索
        echo "🔍 全引擎搜索: $2"
        node "${BASE_DIR}/scripts/multi-search.mjs" "$2" --format markdown 2>/dev/null | filter_output
        ;;
    *)
        echo "🤖 AI日报快捷搜索指令"
        echo ""
        echo "用法: source quick-search.sh [指令] [关键词]"
        echo ""
        echo "📌 可用指令:"
        echo "  搜新闻/新闻 [关键词]    - 实时新闻搜索(QVeris)"
        echo "  搜深度/深度 [关键词]    - 深度分析(Tavily+评分)"
        echo "  搜大厂/大厂 [关键词]    - 大厂动态专用"
        echo "  搜融资/融资 [关键词]    - 融资新闻专用"
        echo "  搜趋势/趋势 [关键词]    - 行业趋势分析"
        echo "  搜全部/全部 [关键词]    - 全引擎搜索"
        echo ""
        echo "💡 示例:"
        echo "  source quick-search.sh 搜新闻 OpenAI"
        echo "  source quick-search.sh 搜大厂 Gemini"
        echo "  source quick-search.sh 搜融资 今天"
        ;;
esac
