---
summary: "`openclaw secrets` CLI 参考（reload、audit、configure、apply）"
read_when:
  - 运行时重新解析 secret 引用
  - 审计明文残留和未解析的引用
  - 配置 SecretRef 并执行单向清理
title: "secrets"
---

# `openclaw secrets`

使用 `openclaw secrets` 管理 SecretRef 并保持运行时快照健康。

命令角色：

- `reload`：网关 RPC（`secrets.reload`），重新解析引用并在完全成功时原子性替换运行时快照（不写入配置）。
- `audit`：只读扫描配置/认证/生成的模型存储及遗留残留，检查明文、未解析引用和优先级漂移。
- `configure`：交互式配置向导，用于提供商设置、目标映射和预检（需要 TTY）。
- `apply`：执行已保存的计划（`--dry-run` 仅验证），然后清理目标明文残留。

推荐操作流程：

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

CI/门禁退出码说明：

- `audit --check` 发现问题时返回 `1`。
- 存在未解析引用时返回 `2`。

相关文档：

- Secrets 指南：[Secrets 管理](/gateway/secrets)
- 凭证表面：[SecretRef 凭证表面](/reference/secretref-credential-surface)
- 安全指南：[安全](/gateway/security)

## 重新加载运行时快照

重新解析 secret 引用并原子性替换运行时快照。

```bash
openclaw secrets reload
openclaw secrets reload --json
```

说明：

- 使用网关 RPC 方法 `secrets.reload`。
- 如果解析失败，网关保留最后已知良好快照并返回错误（无部分激活）。
- JSON 响应包含 `warningCount`。

## 审计

扫描 OpenClaw 状态，检查：

- 明文密钥存储
- 未解析的引用
- 优先级漂移（`auth-profiles.json` 凭证覆盖 `openclaw.json` 引用）
- 生成的 `agents/*/agent/models.json` 残留（提供商 `apiKey` 值和敏感提供商头信息）
- 遗留残留（旧版认证存储条目、OAuth 提醒）

头信息残留说明：

- 敏感提供商头信息检测基于名称启发式（常见的认证/凭证头名称和片段，如 `authorization`、`x-api-key`、`token`、`secret`、`password` 和 `credential`）。

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
```

退出行为：

- `--check` 发现问题时以非零退出码退出。

## 配置（交互式）

启动交互式配置向导。

```bash
openclaw secrets configure
```

说明：

- 需要 TTY（终端）环境。
- 引导设置提供商凭证和目标映射。
- 输出计划文件供 `apply` 使用。

## 应用计划

执行已保存的配置计划。

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
```

说明：

- `--dry-run` 仅验证，不执行更改。
- 成功后自动清理目标明文残留。
- 建议执行后运行 `audit --check` 确认。
