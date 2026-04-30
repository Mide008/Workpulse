// Uses Upstash Redis (free tier: 10,000 requests/day)
// Alternatively works with a simple in-memory store for dev

interface RateLimitConfig {
  windowMs: number
  max: number
  identifier: string
}

// Simple in-memory rate limiter (replace with Upstash in production)
const store = new Map<string, { count: number; resetAt: number }>()

export async function rateLimit(config: RateLimitConfig): Promise<{
  success: boolean
  remaining: number
  resetAt: number
}> {
  const now = Date.now()
  const key = config.identifier
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowMs })
    return { success: true, remaining: config.max - 1, resetAt: now + config.windowMs }
  }

  if (entry.count >= config.max) {
    return { success: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { success: true, remaining: config.max - entry.count, resetAt: entry.resetAt }
}

// Pre-configured limiters
export const rateLimiters = {
  auth: (userId: string) => rateLimit({ windowMs: 60_000, max: 10, identifier: `auth:${userId}` }),
  ai: (userId: string) => rateLimit({ windowMs: 60_000, max: 5, identifier: `ai:${userId}` }),
  reports: (userId: string) => rateLimit({ windowMs: 60_000, max: 3, identifier: `reports:${userId}` }),
  api: (userId: string) => rateLimit({ windowMs: 60_000, max: 60, identifier: `api:${userId}` }),
}