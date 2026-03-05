/**
 * Message fetching for the Feishu/Lark channel plugin.
 */
import { convertMessageContent, buildConvertContextFromItem, } from "../converters/content-converter.js";
import { LarkClient } from "../../core/lark-client.js";
import { trace } from "../../core/trace.js";
import { getUserNameCache, createBatchResolveNames } from "../inbound/user-name-cache.js";
import { getLarkAccount } from "../../core/accounts.js";
// ---------------------------------------------------------------------------
// getMessageFeishu
// ---------------------------------------------------------------------------
/**
 * Retrieve a single message by its ID from the Feishu IM API.
 *
 * Returns a normalised {@link FeishuMessageInfo} object, or `null` if the
 * message cannot be found or the API returns an error.
 *
 * @param params.cfg       - Plugin configuration with Feishu credentials.
 * @param params.messageId - The message ID to fetch.
 * @param params.accountId - Optional account identifier for multi-account setups.
 */
export async function getMessageFeishu(params) {
    const { cfg, messageId, accountId, expandForward } = params;
    const larkClient = LarkClient.fromCfg(cfg, accountId);
    const sdk = larkClient.sdk;
    try {
        const requestOpts = {
            method: "GET",
            url: `/open-apis/im/v1/messages/mget`,
            params: {
                message_ids: messageId,
                user_id_type: "open_id",
                card_msg_content_type: "raw_card_content",
            },
        };
        const response = await sdk.request(requestOpts);
        const items = response?.data?.items;
        if (!items || items.length === 0) {
            trace.info(`getMessageFeishu: no items returned for ${messageId}`);
            return null;
        }
        const expandCtx = expandForward ? {
            cfg,
            accountId,
            fetchSubMessages: async (msgId) => {
                const res = await larkClient.sdk.request({
                    method: "GET",
                    url: `/open-apis/im/v1/messages/${msgId}`,
                    params: { user_id_type: "open_id", card_msg_content_type: "raw_card_content" },
                });
                if (res?.code !== 0) {
                    throw new Error(`API error: code=${res?.code} msg=${res?.msg}`);
                }
                return res?.data?.items ?? [];
            },
            batchResolveNames: createBatchResolveNames(getLarkAccount(cfg, accountId), (...args) => trace.info(args.map(String).join(" "))),
        } : undefined;
        return await parseMessageItem(items[0], messageId, expandCtx);
    }
    catch (error) {
        trace.error(`get message failed (${messageId}): ${error instanceof Error ? error.message : String(error)}`);
        return null;
    }
}
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/**
 * Parse a single message item from the Feishu IM API response into a
 * normalised {@link FeishuMessageInfo}.
 *
 * Content parsing is delegated to the shared converter system so that
 * every message-type mapping is defined in exactly one place.
 */
async function parseMessageItem(msg, fallbackMessageId, expandCtx) {
    const msgType = msg.msg_type ?? "text";
    const rawContent = msg.body?.content ?? "{}";
    const messageId = msg.message_id ?? fallbackMessageId;
    const acctId = expandCtx?.accountId;
    const ctx = {
        ...buildConvertContextFromItem(msg, fallbackMessageId, acctId),
        cfg: expandCtx?.cfg,
        accountId: acctId,
        fetchSubMessages: expandCtx?.fetchSubMessages,
        batchResolveNames: expandCtx?.batchResolveNames,
    };
    const { content } = await convertMessageContent(rawContent, msgType, ctx);
    const senderId = msg.sender?.id ?? undefined;
    const senderType = msg.sender?.sender_type ?? undefined;
    const senderName = senderId && acctId
        ? getUserNameCache(acctId).get(senderId)
        : undefined;
    return {
        messageId,
        chatId: msg.chat_id ?? "",
        chatType: msg.chat_type ?? undefined,
        senderId,
        senderName,
        senderType,
        content,
        contentType: msgType,
        createTime: msg.create_time
            ? parseInt(String(msg.create_time), 10)
            : undefined,
    };
}
// ---------------------------------------------------------------------------
// getChatTypeFeishu
// ---------------------------------------------------------------------------
const chatTypeCache = new Map();
const MAX_CHAT_TYPE_CACHE_SIZE = 1000;
/**
 * Determine the chat type (p2p or group) for a given chat ID.
 *
 * Uses an in-memory cache to avoid repeated API calls for the same chat.
 * Falls back to "p2p" if the API call fails.
 */
export async function getChatTypeFeishu(params) {
    const { cfg, chatId, accountId } = params;
    const cached = chatTypeCache.get(chatId);
    if (cached)
        return cached;
    try {
        const sdk = LarkClient.fromCfg(cfg, accountId).sdk;
        const response = await sdk.im.chat.get({
            path: { chat_id: chatId },
        });
        const chatMode = response?.data?.chat_mode;
        const chatType = chatMode === "group" ? "group" : "p2p";
        // Simple cache eviction: delete oldest if size limit exceeded
        if (chatTypeCache.size >= MAX_CHAT_TYPE_CACHE_SIZE) {
            const oldestKey = chatTypeCache.keys().next().value;
            if (oldestKey) {
                chatTypeCache.delete(oldestKey);
            }
        }
        chatTypeCache.set(chatId, chatType);
        return chatType;
    }
    catch (err) {
        trace.error(`getChatTypeFeishu failed for ${chatId}: ${String(err)}`);
        return "p2p";
    }
}
//# sourceMappingURL=fetch.js.map