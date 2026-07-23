/**
 * Friendly AI error messages for users.
 * Handles both Groq and Gemini API errors across all features.
 */

const FRIENDLY_MESSAGES = {
  workout: {
    rateLimit: "🏋️ AI Trainer is receiving high traffic right now. Please wait 30 seconds and try again!",
    quota:     "🏋️ Our AI Trainer has hit today's limit. It'll be back after 12:30 PM IST — fresh and ready!",
    busy:      "🏋️ AI Trainer is handling peak traffic right now. Please wait a few seconds and try again!",
    apiKey:    "🏋️ AI Trainer service is currently updating. Please try again in a moment!",
    generic:   "🏋️ AI Trainer hit a minor snag. Please try again in a moment.",
  },
  nutrition: {
    rateLimit: "🍎 AI Nutritionist is handling too many requests. Please wait 30 seconds and try again!",
    quota:     "🍎 Our AI Nutritionist has hit today's limit. It'll be back after 12:30 PM IST — fresh and ready!",
    busy:      "🍎 AI Nutritionist is handling peak traffic right now. Please wait a few seconds and try again!",
    apiKey:    "🍎 AI Nutritionist service is updating. Please try again in a moment!",
    generic:   "🍎 AI Nutritionist hit a minor snag. Please try again in a moment.",
  },
  scanner: {
    rateLimit: "📷 AI Food Scanner is busy right now. Please wait 30 seconds and try again!",
    quota:     "📷 AI Food Scanner has hit today's limit. It'll be back after 12:30 PM IST — fresh and ready!",
    busy:      "📷 AI Food Scanner is handling peak traffic right now. Please wait a few seconds and try again!",
    apiKey:    "📷 AI Food Scanner key is missing or unconfigured.",
    generic:   "📷 AI Food Scanner could not process this photo clearly. Please try another image!",
  },
  hydration: {
    rateLimit: "💧 AI Hydration Advisor is busy right now. Please wait 30 seconds and try again!",
    quota:     "💧 AI Hydration Advisor has hit today's limit. It'll be back after 12:30 PM IST — fresh and ready!",
    busy:      "💧 AI Hydration Advisor is handling peak traffic right now. Please wait a few seconds and try again!",
    apiKey:    "💧 AI Hydration service is updating. Please try again in a moment!",
    generic:   "💧 AI Hydration Advisor hit a minor snag. Please try again in a moment.",
  },
  chat: {
    rateLimit: "🤖 AI Coach is handling high chat traffic right now. Please wait 30 seconds and send your message again!",
    quota:     "🤖 AI Coach has hit today's limit. It'll be back after 12:30 PM IST — fresh and ready!",
    busy:      "🤖 AI Coach is handling peak traffic right now. Please wait a few seconds and send your message again!",
    apiKey:    "🤖 AI Coach service is updating. Please try again in a moment!",
    generic:   "🤖 AI Coach hit a minor snag. Please send your message again in a moment.",
  },
  voice: {
    rateLimit: "🎤 AI Voice Coach is handling high traffic right now. Please wait 30 seconds and try again!",
    quota:     "🎤 AI Voice Coach has hit today's limit. It'll be back after 12:30 PM IST — fresh and ready!",
    busy:      "🎤 AI Voice Coach is handling peak traffic right now. Please wait a few seconds and try again!",
    apiKey:    "🎤 AI Voice Coach service is updating. Please try again in a moment!",
    generic:   "🎤 AI Voice Coach hit a minor snag. Please speak again in a moment.",
  }
};

/**
 * Detect if a 429 error is a per-minute temporary rate limit or a true daily quota limit.
 */
function isPerMinuteRateLimit(err) {
  try {
    const msg = (err?.message || '').toLowerCase();
    const details = err?.errorDetails || [];

    // If message mentions daily quota, resource_exhausted, or per-day limit -> NOT per-minute (return false)
    if (
      msg.includes('resource_exhausted') ||
      msg.includes('quota') ||
      msg.includes('per-day') ||
      msg.includes('per day') ||
      msg.includes('daily limit') ||
      msg.includes('day limit') ||
      msg.includes('tpd')
    ) {
      return false; // True daily quota exhaustion!
    }

    // Groq per-minute throttle vs daily token limit check
    if (msg.includes('rate_limit_exceeded') || msg.includes('please try again in')) {
      if (msg.includes('day') || msg.includes('24h') || msg.includes('tpd')) return false;
      return true;
    }

    // Gemini retryDelay check
    for (const d of details) {
      if (d.retryDelay) {
        const seconds = parseInt(d.retryDelay.replace('s', ''), 10);
        return seconds < 300;
      }
    }
  } catch (_) {}

  // Default to per-minute rate limit if unknown
  return true;
}

/**
 * Get a friendly error message + HTTP status for any AI error (Groq or Gemini).
 * @param {Error|object} err - The caught error
 * @param {'workout'|'nutrition'|'scanner'|'hydration'|'chat'|'voice'} section
 * @returns {{ status: number, message: string }}
 */
function getFriendlyAIError(err, section = 'nutrition') {
  const msg = (err?.message || '').toLowerCase();
  const status = err?.status || err?.statusCode || err?.errorDetails?.[0]?.status;
  const msgs = FRIENDLY_MESSAGES[section] || FRIENDLY_MESSAGES.nutrition;

  // Missing or Invalid API key
  if (
    msg.includes('api key') ||
    msg.includes('unauthorized') ||
    msg.includes('invalid_api_key') ||
    status === 401
  ) {
    return { status: 401, message: msgs.apiKey };
  }

  // 429 — Rate limit or Quota
  if (
    status === 429 ||
    msg.includes('429') ||
    msg.includes('quota') ||
    msg.includes('resource_exhausted') ||
    msg.includes('rate limit') ||
    msg.includes('rate_limit')
  ) {
    if (msg.includes('limit: 0') || msg.includes('limit:0') || msg.includes('limit is 0') || msg.includes('limit is: 0')) {
      const emoji = section === 'workout' ? '🏋️' :
                    section === 'nutrition' ? '🍎' :
                    section === 'scanner' ? '📷' :
                    section === 'hydration' ? '💧' :
                    section === 'chat' ? '🤖' : '🎤';
      return { status: 429, message: `${emoji} AI service is restricted by Google (Quota limit is 0). Please check your Google Cloud billing or create a new API key in Google AI Studio!` };
    }
    if (isPerMinuteRateLimit(err)) {
      return { status: 429, message: msgs.rateLimit };
    }
    return { status: 429, message: msgs.quota };
  }

  // 503 / High Demand / Service Unavailable / Overloaded
  if (
    status === 503 ||
    status === 502 ||
    status === 504 ||
    msg.includes('503') ||
    msg.includes('service unavailable') ||
    msg.includes('high demand') ||
    msg.includes('overloaded') ||
    msg.includes('unavailable')
  ) {
    return { status: 503, message: msgs.busy };
  }

  // Generic fallback (never return raw error text to user)
  return { status: status && status >= 400 && status < 600 ? status : 500, message: msgs.generic };
}

module.exports = { getFriendlyAIError };
