/**
 * Friendly AI error messages for users.
 * Called whenever a Gemini API call fails.
 */

const FRIENDLY_MESSAGES = {
  workout: {
    quota:   "🏋️ Our AI Trainer is resting! Daily request limit reached. Come back after 12:30 PM IST — it'll be fully recharged!",
    busy:    "🏋️ Our AI Trainer is super busy right now (high demand). Please wait a few seconds and try again!",
    generic: "🏋️ AI Trainer hit a snag. Please try again in a moment.",
  },
  nutrition: {
    quota:   "🍎 Our AI Nutritionist is on a break! Daily request limit reached. Try again after 12:30 PM IST.",
    busy:    "🍎 Our AI Nutritionist is overwhelmed right now. Please wait a few seconds and try again!",
    generic: "🍎 AI Nutritionist hit a snag. Please try again in a moment.",
  },
  scanner: {
    quota:   "📷 AI Food Scanner has hit its daily limit. Try again after 12:30 PM IST.",
    busy:    "📷 AI Food Scanner is busy right now. Please wait a few seconds and try again!",
    generic: "📷 AI Food Scanner hit a snag. Please try again in a moment.",
  },
  hydration: {
    quota:   "💧 AI Hydration Advisor is on a break! Daily limit reached. Try again after 12:30 PM IST.",
    busy:    "💧 AI Hydration Advisor is experiencing high demand. Please wait a few seconds and try again!",
    generic: "💧 AI Hydration Advisor hit a snag. Please try again in a moment.",
  },
  chat: {
    quota:   "🤖 AI Coach has hit its daily limit. It'll be back after 12:30 PM IST — fresh and ready!",
    busy:    "🤖 AI Coach is handling too many conversations right now. Please wait a few seconds and try again!",
    generic: "🤖 AI Coach hit a snag. Please try again in a moment.",
  },
};

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

  // 429 — Quota / Rate Limit
  if (
    status === 429 ||
    msg.includes('429') ||
    msg.includes('quota') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('rate limit') ||
    msg.includes('Rate limit')
  ) {
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

  // 404 — Model not found (wrong model name)
  if (status === 404 || msg.includes('404') || msg.includes('not found')) {
    return { status: 500, message: `${msgs.generic} (Model configuration error — contact support.)` };
  }

  // Generic fallback
  return { status: 500, message: msgs.generic };
}

module.exports = { getFriendlyAIError };
