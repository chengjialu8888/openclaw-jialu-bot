/**
 * feishu_auth command — 飞书用户权限批量授权命令实现
 *
 * 直接复用 onboarding-auth.ts 的 triggerOnboarding() 函数。
 * 注意：此命令仅限应用 owner 执行（与 onboarding 逻辑一致）
 */
import { triggerOnboarding } from "../tools/onboarding-auth.js";
import { getTraceContext } from "../core/trace.js";
import { getLarkAccount } from "../core/accounts.js";
import { LarkClient } from "../core/lark-client.js";
import { getAppInfo } from "../core/app-scope-checker.js";
/**
 * 执行飞书用户权限批量授权命令
 * 直接调用 triggerOnboarding()，包含 owner 检查
 */
export async function runFeishuAuth(config) {
    const traceCtx = getTraceContext();
    const senderOpenId = traceCtx?.senderOpenId;
    if (!senderOpenId) {
        return "❌ 无法获取用户身份，请在飞书对话中使用此命令";
    }
    // 提前检查 owner 身份，给出明确提示
    const acct = getLarkAccount(config, traceCtx.accountId);
    if (!acct.configured) {
        return `❌ 账号 ${traceCtx.accountId} 配置不完整`;
    }
    const sdk = LarkClient.fromAccount(acct).sdk;
    const { appId } = acct;
    let appInfo;
    try {
        appInfo = await getAppInfo(sdk, appId);
    }
    catch (err) {
        return `❌ 无法获取应用信息: ${err}`;
    }
    if (!appInfo.ownerOpenId) {
        return "❌ 应用未配置 owner 信息";
    }
    if (senderOpenId !== appInfo.ownerOpenId) {
        return "❌ 此命令仅限应用 owner 执行\n\n如需授权，请联系应用管理员。";
    }
    // 调用 triggerOnboarding 执行批量授权
    await triggerOnboarding({
        cfg: config,
        userOpenId: senderOpenId,
        accountId: traceCtx.accountId,
    });
    return "✅ 已发送授权请求\n\n请在卡片中完成授权操作。如有多批权限，完成当前批次后会自动发起下一批。";
}
//# sourceMappingURL=auth.js.map