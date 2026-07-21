/**
 * Friendly AI error messages for users.
 * Called whenever a Gemini API call fails.
 */

const FRIENDLY_MESSAGES = {
  workout: {
    rateLimit: "🏋️ AI Trainer is getting too many requests right now. Please wait 30 seconds and try again!",
    quota:     "🏋️ Our AI Trainer has hit today's limit. Come back after 12:30 PM IST — it'll be fully recharged!",
    busy:      "🏋️ AI Trainer is super busy right now (high demand). Please wait a few seconds and try again!",
    generic:   "🏋️ AI Trainer hit a snag. Please try again in a moment.",
  },
  nutrition: {
    rateLimit: "🍎 AI Nutritionist is handling too many requests. Please wait 30 seconds and try again!",
    quota:     "🍎 Our AI Nutritionist has hit today's limit. Try again after 12:30 PM IST.",
    busy:      "🍎 AI Nutritionist is overwhelmed right now. Please wait a few seconds and try again!",
    generic:   "🍎 AI Nutritionist hit a snag. Please try again in a moment.",
  },
  scanner: {
    rateLimit: "📷 AI Food Scanner is busy. Please wait 30 seconds and try again!",
    quota:     "📷 AI Food Scanner has hit today's limit. Try again after 12:30 PM IST.",
    busy:      "📷 AI Food Scanner is busy right now. Please wait a few seconds and try again!",
    generic:   "📷 AI Food Scanner hit a snag. Please try again in a moment.",
  },
  hydration: {
    rateLimit: "💧 AI Hydration Advisor is busy. Please wait 30 seconds and try again!",
    quota:     "💧 AI Hydration Advisor has hit today's limit. Try again after 12:30 PM IST.",
    busy:      "💧 AI Hydration Advisor is experiencing high demand. Please wait a few seconds and try again!",
    generic:   "💧 AI Hydration Advisor hit a snag. Please try again in a moment.",
  },
  chat: {
    rateLimit: "🤖 AI Coach is handling too many requests. Please wait 30 seconds and send your message again!",
    quota:     "🤖 AI Coach has hit today's limit. It'll be back after 12:30 PM IST — fresh and ready!",
    busy:      "🤖 AI Coach is handling peak traffic right now. Please wait a few seconds and try again!",
    generic:   "🤖 AI Coach hit a snag. Please try again in a moment.",
  },
};

/**
 * Detect if a 429 is a per-minute rate limit or a true daily quota exhaustion.
 * Daily quota -> retryDelay is very large (e.g. 86400s) or missing.
 * Per-minute  -> retryDelay is small (< 300s).
 */
function isPerMinuteRateLimit(err) {
  try {
    const details = err?.errorDetails || [];
    for (const d of details) {
      if (d.retryDelay) {
        const seconds = parseInt(d.retryDelay.replace('s', ''), 10);
        // Per-minute limit retries in < 5 minutes; daily limit retries in ~24h
        return seconds < 300;
      }
    }
  } catch (_) {}
  // If no retryDelay info, assume it's a daily limit to be safe
  return false;
}

/**
 * Get a friendly error message + HTTP status for a Gemini API error.
 * @param {Error} err - The caught error from Gemini SDK
 * @param {'workout'|'nutrition'|'scanner'|'hydration'|'chat'} section
 * @returns {{ status: number, message: string }}
 */
function getFriendlyAIError(err, section = 'nutrition') {
  const msg = err?.message || '';
  const status = err?.status || err?.errorDetails?.[0]?.status;
  const msgs = FRIENDLY_MESSAGES[section] || FRIENDLY_MESSAGES.nutrition;

  // 429 — could be per-minute OR daily quota
  if (
    status === 429 ||
    msg.includes('429') ||
    msg.includes('quota') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('rate limit') ||
    msg.includes('Rate limit')
  ) {
    if (isPerMinuteRateLimit(err)) {
      // Per-minute throttle — just wait 30-60 seconds
      return { status: 429, message: msgs.rateLimit };
    }
    // True daily quota exhausted
    return { status: 429, message: msgs.quota };
  }

  // 503 — Service Unavailable / High Demand
  if (
    status === 503 ||
    msg.includes('503') ||
    msg.includes('Service Unavailable') ||
    msg.includes('high demand') ||
    msg.includes('overloaded') ||
    msg.includes('UNAVAILABLE')
  ) {
    return { status: 503, message: msgs.busy };
  }

  // 404 — Model not found
  if (status === 404 || msg.includes('404') || msg.includes('not found')) {
    return { status: 500, message: `${msgs.generic} (Model configuration error.)` };
  }

  // Generic fallback
  return { status: 500, message: msgs.generic };
}

module.exports = { getFriendlyAIError };
