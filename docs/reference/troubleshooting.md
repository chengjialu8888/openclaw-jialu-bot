---
summary: "OpenClaw 常见问题排查指南：Gateway 连接、模型调用、Memory 搜索、Cron 任务、Channel 连接"
read_when:
  - Gateway 无法连接
  - 模型调用报错
  - Memory 搜索无结果
  - Cron 任务未触发
  - Channel 连接失败
title: "Troubleshooting Guide"
---

# Troubleshooting Guide

本文档提供 OpenClaw 常见问题的排查步骤和解决方案。

## 1. Gateway 连不上

### 症状
- `openclaw gateway status` 显示未运行
- 连接超时或拒绝访问

### 排查步骤

**1.1 检查 Gateway 进程状态**
```bash
ps aux | grep openclaw
# 或直接查看 gateway 状态
openclaw gateway status
```

**1.2 检查端口占用**
```bash
lsof -i :18789
netstat -tlnp | grep 18789
```
默认端口 18789 被占用会导致启动失败。

**1.3 查看 Gateway 日志**
```bash
# 查看最近日志
openclaw gateway logs --lines 50

# 实时日志
openclaw gateway logs -f
```
重点关注 ERROR 或 FATAL 关键字。

**1.4 检查配置文件**
```bash
# 验证配置语法
cat ~/.openclaw/openclaw.json | jq .
```
确保 JSON 格式正确，无语法错误。

**1.5 常见错误解决方案**

| 错误类型 | 解决方案 |
|---------|---------|
| 端口占用 | `pkill -f openclaw` 后重启 |
| 配置文件错误 | 检查 JSON 语法，确保必填字段存在 |
| 权限不足 | 确保运行用户有 ~/.openclaw 目录读写权限 |
| systemd 不可用 | 使用脚本启动：`sh scripts/start.sh` |

---

## 2. Model 报错

### 症状
- 调用模型时返回错误
- 会话中模型响应失败

### 排查步骤

**2.1 检查模型配置**
```bash
openclaw config get model
```
确认模型名称、提供商、API Key 正确配置。

**2.2 验证 API Key 有效**
```bash
# 测试模型调用
openclaw model test
```
部分模型需要确认 API Key 有足够配额。

**2.3 检查模型日志**
```bash
openclaw gateway logs | grep -i "model\|error"
```
查找具体的错误信息，如配额超限、网络超时等。

**2.4 常见错误及解决方案**

| 错误信息 | 可能原因 | 解决方案 |
|---------|---------|---------|
| `invalid_api_key` | API Key 错误或过期 | 在配置中更新 API Key |
| `rate_limit_exceeded` | 请求频率过高 | 降低调用频率或升级配额 |
| `model_not_found` | 模型名称错误 | 确认模型名称拼写正确 |
| `timeout` | 网络问题或模型响应慢 | 检查网络，增加超时时间 |
| `insufficient_quota` | 账户配额不足 | 充值或更换模型 |

**2.5 环境变量检查**
```bash
# 查看相关环境变量
env | grep -i "api\|key\|model"
```
确保没有冲突的环境变量覆盖配置。

---

## 3. Memory 搜索无结果

### 症状
- Memory 搜索返回空结果
- 确认存在的内容无法被检索

### 排查步骤

**3.1 检查 Memory 文件是否存在**
```bash
ls -la ~/.openclaw/memory/
ls -la workspace/memory/
```
确认 Memory 文件路径配置正确。

**3.2 验证 Memory 索引**
```bash
openclaw memory status
```
检查索引是否正常构建。

**3.3 测试搜索命令**
```bash
# 使用精确关键词测试
openclaw memory search "具体关键词"
```
排除搜索条件过于宽泛或模糊的问题。

**3.4 检查文件权限**
```bash
ls -la ~/.openclaw/memory/
```
确保 Gateway 进程有读取权限。

**3.5 常见原因**

| 原因 | 解决方案 |
|-----|---------|
| 关键词不匹配 | 使用更精确的关键词或短语搜索 |
| 索引未更新 | 手动触发索引重建：`openclaw memory rebuild` |
| 编码问题 | 确保文件编码为 UTF-8 |
| 路径配置错误 | 检查 `openclaw.json` 中 memory.path 配置 |

---

## 4. Cron 不触发

### 症状
- 定时任务未按预期执行
- 手动运行正常但自动执行失败

### 排查步骤

**4.1 检查 Cron 配置**
```bash
openclaw cron list
```
确认任务已正确注册。

**4.2 验证 Cron 服务状态**
```bash
# 系统 cron
systemctl status cron
# 或查看进程
ps aux | grep cron
```

**4.3 检查时区配置**
```bash
date
timedatectl
```
确保系统时区与配置中的时区一致。

**4.4 查看 Cron 执行日志**
```bash
# 系统日志
tail -f /var/log/syslog | grep cron
# 或
journalctl -u cron -f
```

**4.5 常见问题**

| 问题 | 解决方案 |
|-----|---------|
| 时区不一致 | 在配置中明确指定时区，如 `"timezone": "Asia/Shanghai"` |
| Cron 未启动 | 启动 Cron 服务：`systemctl start cron` |
| 任务表达式错误 | 验证 Cron 表达式格式 |
| 环境变量缺失 | 在 Cron 配置中显式设置所需环境变量 |

**4.6 测试 Cron 表达式**
使用在线工具验证 Cron 表达式是否正确：
- https://crontab.guru/

---

## 5. Channel 连接失败

### 症状
- 消息无法发送或接收
- Channel 显示未连接

### 排查步骤

**5.1 检查 Channel 配置**
```bash
openclaw config get channels
```
确认 Channel 类型和凭据配置正确。

**5.2 验证凭据有效性**

| Channel 类型 | 检查项 |
|-------------|--------|
| Feishu | app_id, app_secret, verification_token |
| Telegram | bot_token |
| Discord | bot_token |
| Slack | bot_token, signing_secret |

**5.3 测试 Channel 连接**
```bash
# 飞书
openclaw channel test feishu

# Telegram
openclaw channel test telegram
```

**5.4 查看 Channel 日志**
```bash
openclaw gateway logs | grep -i "channel\|feishu\|telegram"
```
查找连接错误或认证失败信息。

**5.5 常见错误**

| 错误 | 原因 | 解决方案 |
|-----|-----|---------|
| `auth_failed` | 凭据无效或已过期 | 重新获取并更新凭据 |
| `connection_timeout` | 网络问题 | 检查防火墙和网络代理 |
| `permission_denied` | 权限不足 | 在平台开发者后台检查权限配置 |
| `webhook_invalid` | Webhook URL 错误 | 确认 Webhook 地址可访问 |

**5.6 飞书特殊检查**
```bash
# 检查应用权限
# 登录飞书开放平台 -> 应用 -> 权限管理
```
确保已开启所需权限：
- 接收消息
- 发送消息
- 查看群聊信息

---

## 通用调试命令

```bash
# 查看完整配置
openclaw config show

# 健康检查
openclaw health

# Gateway 状态
openclaw gateway status

# 查看所有日志
openclaw gateway logs

# 诊断模式
openclaw doctor
```

---

## 获取更多帮助

- 文档：https://docs.openclaw.dev
- 问题反馈：https://github.com/openclaw/openclaw/issues
- 社区支持：加入官方 Discord 或飞书群
