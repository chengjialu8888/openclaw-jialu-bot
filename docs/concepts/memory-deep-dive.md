---
title: "Memory Deep Dive"
summary: "Comprehensive guide to OpenClaw memory architecture, best practices, and advanced patterns"
read_when:
  - You want to understand memory architecture in depth
  - You need memory optimization strategies
  - You want to implement custom memory patterns
  - You are troubleshooting memory-related issues
---

# Memory Deep Dive

This guide provides an in-depth exploration of OpenClaw's memory system, covering architecture, best practices, advanced patterns, and troubleshooting.

For the basics, see [Memory](/concepts/memory).

## Memory Architecture

OpenClaw uses a **two-layer memory model** inspired by how biological memory systems work:

### Layer 1: Working Memory (Daily Logs)

`memory/YYYY-MM-DD.md` files serve as **working memory** — the day-to-day scratch pad:

- **Append-only**: New entries are added chronologically
- **Time-indexed**: Each file covers one calendar day
- **Session-scoped**: Read at session start (today + yesterday by default)
- **Low ceremony**: Just write — no schema, no structure required

```markdown
<!-- memory/2026-03-11.md -->
## Meeting with Alice
- Discussed Q2 roadmap
- Decision: prioritize mobile app over desktop
- Action: Alice will send specs by Friday

## Research findings
- Found promising approach for token optimization
- Reference: paper by Zhang et al. (2025)
```

### Layer 2: Long-Term Memory (MEMORY.md)

`MEMORY.md` is **curated long-term memory** — the distilled knowledge base:

- **Structured**: Organized by topic, not chronology
- **Curated**: Manually or semi-automatically maintained
- **Persistent**: Loaded in private sessions only (security boundary)
- **Concise**: Facts, preferences, and decisions — not raw logs

```markdown
<!-- MEMORY.md -->
## People
- Alice: PM for mobile team, prefers async communication
- Bob: Backend lead, expert in distributed systems

## Decisions
- 2026-03: Prioritize mobile app over desktop (per Alice meeting)

## Preferences  
- User prefers concise responses
- Always include source links in research summaries
```

### How the Two Layers Interact

```
Session Start
    ├── Load MEMORY.md (if private session)
    ├── Load memory/today.md
    ├── Load memory/yesterday.md
    └── memory_search available for older entries
    
During Session
    ├── Agent writes to memory/today.md
    ├── Agent updates MEMORY.md for durable facts
    └── memory_search recalls from all memory files

Pre-Compaction
    └── memoryFlush trigger → Agent saves important context
```

## Writing Effective Memory

### What Belongs in Daily Logs

| Write This | Skip This |
|-----------|-----------|
| Decisions and their rationale | Casual conversation |
| Action items with owners | Repeated information |
| Key facts learned | Information already in MEMORY.md |
| User preferences discovered | Temporary task details |
| Meeting summaries | Raw data dumps |

### What Belongs in MEMORY.md

| Write This | Skip This |
|-----------|-----------|
| Durable facts about people/projects | Time-sensitive information |
| Confirmed preferences | Speculative notes |
| Important decisions with dates | Detailed meeting logs |
| Recurring patterns | One-time events |
| Security-relevant context | Publicly available information |

### Writing Tips

1. **Be specific**: "User prefers bullet lists over paragraphs" > "User has formatting preferences"
2. **Include dates**: "2026-03: Decided to use PostgreSQL" helps with temporal queries
3. **Add context**: "Chose PostgreSQL (over MongoDB) because of ACID requirements" explains _why_
4. **Use headers**: Structure helps both humans and `memory_search`
5. **Keep it concise**: Memory files are loaded into context — every token counts

## Search Optimization

### How memory_search Works

`memory_search` uses a combination of:
- **FTS5** (Full-Text Search): Fast lexical matching
- **Vector embeddings** (optional): Semantic similarity matching

### Writing Searchable Content

```markdown
<!-- Good: searchable, specific -->
## Database Decision (2026-03)
PostgreSQL selected for main database. Reasons: ACID compliance,
JSON support, team expertise. Alternative considered: MongoDB.

<!-- Bad: vague, hard to search -->
## Tech stuff
We picked a database today. It was a good discussion.
```

### Query Strategies

| Goal | Query Style |
|------|-------------|
| Find a specific decision | `"database decision PostgreSQL"` |
| Find everything about a person | `"Alice meetings preferences"` |
| Find recent context | `"this week project status"` |
| Find opinions/preferences | `"user prefers likes dislikes"` |

## Memory Maintenance

### Periodic Review (Recommended: Weekly)

During heartbeats or dedicated maintenance sessions:

1. **Scan recent daily logs** for information worth promoting
2. **Update MEMORY.md** with new durable facts
3. **Remove outdated entries** from MEMORY.md
4. **Archive old daily logs** (optional — they persist but aren't auto-loaded)

### Automated Maintenance

Use heartbeat checks to trigger memory maintenance:

```markdown
<!-- HEARTBEAT.md -->
## Memory Maintenance (every 3 days)
- Review recent memory/*.md files
- Update MEMORY.md with significant findings
- Remove outdated information
```

### Pre-Compaction Memory Flush

When a session approaches its context window limit, OpenClaw triggers an automatic memory flush:

```json5
{
  agents: {
    defaults: {
      compaction: {
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 4000,
        },
      },
    },
  },
}
```

This ensures important context survives compaction. See [Session Management + Compaction](/reference/session-management-compaction) for details.

## Advanced Patterns

### Entity Tracking

Create dedicated files for important entities:

```
memory/
  entities/
    project-atlas.md    # Everything about Project Atlas
    alice-pm.md         # Working relationship with Alice
    api-v2-migration.md # Ongoing migration notes
```

### Cross-Session Recall

For information that spans multiple sessions:
1. Write key findings to `MEMORY.md` or entity files
2. Use `memory_search` at session start for relevant context
3. Reference specific files with `memory_get` for detailed recall

### Memory-Driven Workflows

Combine memory with cron jobs for proactive recall:

```json5
// Cron job: Weekly memory consolidation
{
  schedule: { kind: "cron", expr: "0 9 * * 1" },
  payload: {
    kind: "agentTurn",
    message: "Review memory/ files from the past week. Consolidate important findings into MEMORY.md. Remove outdated entries."
  }
}
```

## Troubleshooting

### Memory Search Returns No Results

1. **Check file exists**: Verify `memory/` directory has `.md` files
2. **Check file content**: Ensure files aren't empty
3. **Rebuild index**: Memory search index may need refresh after manual edits
4. **Check workspace path**: Verify `agents.defaults.workspace` points to correct directory

### Memory Not Persisting Between Sessions

1. **Check workspace access**: Ensure workspace isn't read-only (`workspaceAccess: "ro"`)
2. **Check compaction**: If sessions compact frequently, enable `memoryFlush`
3. **Check file permissions**: Agent process needs write access to workspace

### MEMORY.md Loading in Wrong Contexts

`MEMORY.md` should only load in **private/main sessions**:
- ✅ Direct messages with the owner
- ❌ Group chats (security risk)
- ❌ Shared sessions

If MEMORY.md content appears in group contexts, check your `AGENTS.md` instructions.

## Further Reading

- [Memory (basics)](/concepts/memory)
- [Session Management + Compaction](/reference/session-management-compaction)
- [Agent Workspace](/concepts/agent-workspace)
- [Workspace Memory Research](/experiments/research/memory) (internal research notes)
