---
summary: "`openclaw qr` CLI 参考（生成 iOS 配对 QR 码 + 设置码）"
read_when:
  - 需要快速将 iOS 应用与 gateway 配对
  - 需要输出设置码用于远程/手动共享
title: "qr"
---

# `openclaw qr`

根据当前 Gateway 配置生成 iOS 配对 QR 码和设置码。

## 用法

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws --token '<token>'
```

## 选项

- `--remote`：使用配置中的 `gateway.remote.url` 及远程 token/password
- `--url <url>`：覆盖载荷中使用的 gateway URL
- `--public-url <url>`：覆盖载荷中使用的公共 URL
- `--token <token>`：覆盖载荷中的 gateway token
- `--password <password>`：覆盖载荷中的 gateway password
- `--setup-code-only`：仅输出设置码
- `--no-ascii`：跳过 ASCII QR 渲染
- `--json`：输出 JSON（`setupCode`、`gatewayUrl`、`auth`、`urlSource`）

## 说明

- `--token` 和 `--password` 互斥。
- 使用 `--remote` 时，如果有效的远程凭证配置为 SecretRef 且未传入 `--token` 或 `--password`，命令将从活跃的 gateway 快照中解析。如果 gateway 不可用，命令将快速失败。
- 不使用 `--remote` 时，本地 gateway 认证 SecretRef 在未传入 CLI 认证覆盖时解析：
  - 当 token 认证可能生效时解析 `gateway.auth.token`（显式 `gateway.auth.mode="token"` 或推断模式中无 password 源胜出）。
  - 当 password 认证可能生效时解析 `gateway.auth.password`（显式 `gateway.auth.mode="password"` 或推断模式中无 token 从 auth/env 胜出）。
- 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`（包括 SecretRef）且 `gateway.auth.mode` 未设置，设置码解析将失败，直到显式设置 mode。
- Gateway 版本兼容说明：此命令路径需要支持 `secrets.resolve` 的 gateway；旧版 gateway 会返回未知方法错误。
- 扫描后，通过以下命令批准设备配对：
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`
