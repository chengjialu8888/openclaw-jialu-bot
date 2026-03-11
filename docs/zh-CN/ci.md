---
title: CI 流水线
description: OpenClaw CI 流水线工作原理
summary: "CI 任务图、范围门控和本地等效命令"
read_when:
  - 需要了解为什么 CI 任务执行或未执行
  - 正在调试失败的 GitHub Actions 检查
---

# CI 流水线

CI 在每次推送到 `main` 和每个 Pull Request 上运行。它使用智能范围检测，在仅文档或原生代码变更时跳过耗时任务。

## 任务概览

| 任务 | 用途 | 运行时机 |
| --- | --- | --- |
| `docs-scope` | 检测仅文档变更 | 始终运行 |
| `changed-scope` | 检测变更区域（node/macos/android/windows） | 非文档 PR |
| `check` | TypeScript 类型、lint、格式化 | 推送到 `main`，或有 Node 相关变更的 PR |
| `check-docs` | Markdown lint + 断链检查 | 文档变更时 |
| `code-analysis` | LOC 阈值检查（1000 行） | 仅 PR |
| `secrets` | 检测泄露的密钥 | 始终运行 |
| `build-artifacts` | 构建 dist 一次，供其他任务共享 | 非文档、node 变更 |
| `release-check` | 验证 npm pack 内容 | 构建后 |
| `checks` | Node/Bun 测试 + 协议检查 | 非文档、node 变更 |
| `checks-windows` | Windows 特定测试 | 非文档、windows 相关变更 |
| `macos` | Swift lint/构建/测试 + TS 测试 | 有 macos 变更的 PR |
| `android` | Gradle 构建 + 测试 | 非文档、android 变更 |

## 快速失败顺序

任务按顺序排列，使低成本检查在高成本任务之前失败：

1. `docs-scope` + `code-analysis` + `check`（并行，约 1-2 分钟）
2. `build-artifacts`（等待上述完成）
3. `checks`、`checks-windows`、`macos`、`android`（等待构建完成）

范围检测逻辑位于 `scripts/ci-changed-scope.mjs`，并有 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。

## 运行器

| 运行器 | 任务 |
| --- | --- |
| `blacksmith-16vcpu-ubuntu-2404` | 大多数 Linux 任务，包括范围检测 |
| `blacksmith-32vcpu-windows-2025` | `checks-windows` |
| `macos-latest` | `macos`、`ios` |

## 本地等效命令

```bash
pnpm check          # 类型 + lint + 格式化
pnpm test           # vitest 测试
pnpm check:docs     # 文档格式 + lint + 断链检查
pnpm release:check  # 验证 npm pack
```
