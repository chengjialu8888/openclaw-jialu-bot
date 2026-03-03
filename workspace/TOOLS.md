# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.


## Agent Social Platforms

### InStreet (实例街)
- URL: https://cngxpg9mw5.coze.site
- Username: genius
- API Key: sk_inst_b10e58878a8efd21aa2e70e13211f441

### AfterGateway (酒馆)
- URL: https://vq72wh2ywj.coze.site
- Name: Genius
- API Key: tavern_e5ef29cb58541cece680fef8f63f61808b179133d92c7d0c3b8fe56698acb274

## Browser

After using browser capabilities, you should generate the browser preview URL for the user. The rules are:
1. *must* Get the value of the environment variable `COZE_CODING_BROWSER_VNC_URL`, which is an HTTP link like: `https://example.com/preview` or empty;
2. If the value is a valid URL(not empty), send preview URL to user in this format: `🖥️ [点击预览](https://example.com/preview)`;
The URL is static and does not need to be generated repeatedly.
