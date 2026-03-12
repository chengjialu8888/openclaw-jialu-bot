type ErrorPattern = RegExp | string;

const PERIODIC_USAGE_LIMIT_RE =
  /\b(?:daily|weekly|monthly)(?:\/(?:daily|weekly|monthly))* (?:usage )?limit(?:s)?(?: (?:exhausted|reached|exceeded))?\b/i;

// 402-specific classification hints (borrowed from errors.ts) ------------------------------------------------
const PERIODIC_402_HINTS = ["daily", "weekly", "monthly", "rolling"] as const;
const RETRYABLE_402_RETRY_HINTS = ["try again", "retry", "temporary", "cooldown"] as const;
const RETRYABLE_402_LIMIT_HINTS = ["usage limit", "rate limit", "organization usage", "subscription quota"] as const;
const RETRYABLE_402_SCOPED_HINTS = ["organization", "workspace"] as const;
const RETRYABLE_402_SCOPED_RESULT_HINTS = [
  "billing period",
  "exceeded",
  "reached",
  "exhausted",
] as const;

function includesAnyHint(text: string, hints: readonly string[]): boolean {
  return hints.some((hint) => text.includes(hint));
}

function hasRetryable402TransientSignal(text: string): boolean {
  // zenmux responses should always be treated as rate‑limit failures
  if (text.includes("zenmux")) {
    return true;
  }
  const hasPeriodicHint = includesAnyHint(text, PERIODIC_402_HINTS);
  const hasSpendLimit = text.includes("spend limit") || text.includes("spending limit");
  const hasScopedHint = includesAnyHint(text, RETRYABLE_402_SCOPED_HINTS);
  return (
    (includesAnyHint(text, RETRYABLE_402_RETRY_HINTS) &&
      includesAnyHint(text, RETRYABLE_402_LIMIT_HINTS)) ||
    (hasPeriodicHint && (text.includes("usage limit") || hasSpendLimit)) ||
    (hasPeriodicHint && text.includes("limit") && text.includes("reset")) ||
    (hasScopedHint &&
      text.includes("limit") &&
      (hasSpendLimit || includesAnyHint(text, RETRYABLE_402_SCOPED_RESULT_HINTS)))
  );
}

const ERROR_PATTERNS = {
  rateLimit: [
    /rate[_ ]limit|too many requests|429/,
    "model_cooldown",
    "exceeded your current quota",
    "resource has been exhausted",
    "quota exceeded",
    "resource_exhausted",
    "usage limit",
    /\btpm\b/i,
    "tokens per minute",
    "tokens per day",
  ],
  overloaded: [
    /overloaded_error|"type"\s*:\s*"overloaded_error"/i,
    "overloaded",
    // Match "service unavailable" only when combined with an explicit overload
    // indicator — a generic 503 from a proxy/CDN should not be classified as
    // provider-overload (#32828).
    /service[_ ]unavailable.*(?:overload|capacity|high[_ ]demand)|(?:overload|capacity|high[_ ]demand).*service[_ ]unavailable/i,
    "high demand",
  ],
  timeout: [
    "timeout",
    "timed out",
    "service unavailable",
    "deadline exceeded",
    "context deadline exceeded",
    "connection error",
    "network error",
    "network request failed",
    "fetch failed",
    "socket hang up",
    /\beconn(?:refused|reset|aborted)\b/i,
    /\benotfound\b/i,
    /\beai_again\b/i,
    /without sending (?:any )?chunks?/i,
    /\bstop reason:\s*(?:abort|error|malformed_response)\b/i,
    /\breason:\s*(?:abort|error|malformed_response)\b/i,
    /\bunhandled stop reason:\s*(?:abort|error|malformed_response)\b/i,
  ],
  billing: [
    /["']?(?:status|code)["']?\s*[:=]\s*402\b|\bhttp\s*402\b|\berror(?:\s+code)?\s*[:=]?\s*402\b|\b(?:got|returned|received)\s+(?:a\s+)?402\b|^\s*402\s+payment/i,
    "payment required",
    "insufficient credits",
    /insufficient[_ ]quota/i,
    "credit balance",
    "plans & billing",
    "insufficient balance",
  ],
  authPermanent: [
    /api[_ ]?key[_ ]?(?:revoked|invalid|deactivated|deleted)/i,
    "invalid_api_key",
    "key has been disabled",
    "key has been revoked",
    "account has been deactivated",
    /could not (?:authenticate|validate).*(?:api[_ ]?key|credentials)/i,
    "permission_error",
    "not allowed for this organization",
  ],
  auth: [
    /invalid[_ ]?api[_ ]?key/,
    "incorrect api key",
    "invalid token",
    "authentication",
    "re-authenticate",
    "oauth token refresh failed",
    "unauthorized",
    "forbidden",
    "access denied",
    "insufficient permissions",
    "insufficient permission",
    /missing scopes?:/i,
    "expired",
    "token has expired",
    /\b401\b/,
    /\b403\b/,
    "no credentials found",
    "no api key found",
  ],
  format: [
    "string should match pattern",
    "tool_use.id",
    "tool_use_id",
    "messages.1.content.1.tool_use.id",
    "invalid request format",
    /tool call id was.*must be/i,
  ],
} as const;

const BILLING_ERROR_HEAD_RE =
  /^(?:error[:\s-]+)?billing(?:\s+error)?(?:[:\s-]+|$)|^(?:error[:\s-]+)?(?:credit balance|insufficient credits?|payment required|http\s*402\b)/i;
const BILLING_ERROR_HARD_402_RE =
  /["']?(?:status|code)["']?\s*[:=]\s*402\b|\bhttp\s*402\b|\berror(?:\s+code)?\s*[:=]?\s*402\b|^\s*402\s+payment/i;
const BILLING_ERROR_MAX_LENGTH = 512;

function matchesErrorPatterns(raw: string, patterns: readonly ErrorPattern[]): boolean {
  if (!raw) {
    return false;
  }
  const value = raw.toLowerCase();
  return patterns.some((pattern) =>
    pattern instanceof RegExp ? pattern.test(value) : value.includes(pattern),
  );
}

export function matchesFormatErrorPattern(raw: string): boolean {
  return matchesErrorPatterns(raw, ERROR_PATTERNS.format);
}

export function isRateLimitErrorMessage(raw: string): boolean {
  return matchesErrorPatterns(raw, ERROR_PATTERNS.rateLimit);
}

export function isTimeoutErrorMessage(raw: string): boolean {
  return matchesErrorPatterns(raw, ERROR_PATTERNS.timeout);
}

export function isPeriodicUsageLimitErrorMessage(raw: string): boolean {
  return PERIODIC_USAGE_LIMIT_RE.test(raw);
}

export function isBillingErrorMessage(raw: string): boolean {
  const value = raw.toLowerCase();
  if (!value) {
    return false;
  }

  if (raw.length > BILLING_ERROR_MAX_LENGTH) {
    return BILLING_ERROR_HARD_402_RE.test(value);
  }
  if (matchesErrorPatterns(value, ERROR_PATTERNS.billing)) {
    return true;
  }
  if (!BILLING_ERROR_HEAD_RE.test(raw)) {
    return false;
  }
  return (
    value.includes("upgrade") ||
    value.includes("credits") ||
    value.includes("payment") ||
    value.includes("plan")
  );
}

export function isAuthPermanentErrorMessage(raw: string): boolean {
  return matchesErrorPatterns(raw, ERROR_PATTERNS.authPermanent);
}

export function isAuthErrorMessage(raw: string): boolean {
  return matchesErrorPatterns(raw, ERROR_PATTERNS.auth);
}

export function isOverloadedErrorMessage(raw: string): boolean {
  return matchesErrorPatterns(raw, ERROR_PATTERNS.overloaded);
}
