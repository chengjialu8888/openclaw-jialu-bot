**描述：** 将 OpenClaw 连接到 IRC 频道和私信

**摘要：** IRC 插件安装配置、访问控制与故障排查

**阅读时机：**

- 你想将 OpenClaw 连接到 IRC 频道或私信
- 你正在配置 IRC 白名单、群组策略或 @提及过滤

---

# IRC

当你希望 OpenClaw 出现在经典频道（`#room`）和私信中时可以使用 IRC。IRC 作为扩展插件提供，但在主配置中的 `channels.irc` 下进行配置。

## 快速开始

1. 在 `~/.openclaw/openclaw.json` 中启用 IRC 配置。
2. 至少设置以下内容：

```json
{
  "channels": {
    "irc": {
      "enabled": true,
      "host": "irc.libera.chat",
      "port": 6697,
      "tls": true,
      "nick": "openclaw-bot",
      "channels": ["#openclaw"]
    }
  }
}
```

3. 启动/重启网关：

```bash
openclaw gateway run
```

## 安全默认值

- `channels.irc.dmPolicy` 默认为 `"pairing"`（配对模式）。
- `channels.irc.groupPolicy` 默认为 `"allowlist"`（白名单模式）。
- 当 `groupPolicy="allowlist"` 时，需要设置 `channels.irc.groups` 来定义允许的频道。
- 除非你有意接受明文传输，否则请使用 TLS（`channels.irc.tls=true`）。

## 访问控制

IRC 频道有两个独立的"控制门"：

1. **频道访问**（`groupPolicy` + `groups`）：机器人是否接受来自某个频道的消息。
2. **发送者访问**（`groupAllowFrom` / 按频道配置的 `groups["#channel"].allowFrom`）：谁可以在该频道内触发机器人。

配置项说明：

- 私信白名单（私信发送者访问）：`channels.irc.allowFrom`
- 群组发送者白名单（频道发送者访问）：`channels.irc.groupAllowFrom`
- 按频道控制（频道 + 发送者 + 提及规则）：`channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` 允许未配置的频道（**但默认仍受提及过滤限制**）

白名单条目应使用稳定的发送者身份（`nick!user@host`）。
仅使用昵称匹配是不稳定的，只有在 `channels.irc.dangerouslyAllowNameMatching: true` 时才启用。

### 常见坑：`allowFrom` 是用于私信的，不是用于频道

如果你看到日志类似：

- `irc: drop group sender alice!ident@host (policy=allowlist)`

……这意味着该发送者在**群组/频道**消息中不被允许。修复方法：

- 设置 `channels.irc.groupAllowFrom`（全局适用于所有频道），或
- 设置按频道的发送者白名单：`channels.irc.groups["#channel"].allowFrom`

示例（允许 `#tuirc-dev` 中的任何人与机器人对话）：

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": { allowFrom: ["*"] },
      },
    },
  },
}
```

## 回复触发（@提及）

即使频道已通过 `groupPolicy` + `groups` 允许，且发送者也被允许，OpenClaw 在群组环境下默认仍采用**提及过滤**机制。

这意味着你可能会看到类似 `drop channel … (missing-mention)` 的日志，除非消息包含与机器人匹配的提及模式。

若要让机器人在 IRC 频道中**无需提及也能回复**，请禁用该频道的提及过滤：

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": {
          requireMention: false,
          allowFrom: ["*"],
        },
      },
    },
  },
}
```

或者**允许所有** IRC 频道（无需按频道白名单）且仍然无需提及即可回复：

```json5
{
  channels: {
    irc: {
      groupPolicy: "open",
      groups: {
        "#*": {
          requireMention: false,
        },
      },
    },
  },
}
```

---

*翻译完成日期：2026-03-11*
*译者：Archivist (Day 3)*
