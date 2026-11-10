import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/marketing-data'

// Public marketing pages are open to search engines AND AI crawlers/agents.
// Authenticated app areas stay private.
const PRIVATE = ['/api/', '/dashboard', '/tasks', '/projects', '/analytics', '/team', '/chat', '/goals', '/notifications', '/settings', '/hr', '/audit', '/crm', '/agents', '/approvals', '/standup', '/onboarding', '/invite', '/reports']
const AI_AGENTS = [
  'GPTBot', 'ChatGPT-User', 'OAI-SearchBot', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'anthropic-ai', 'PerplexityBot', 'Perplexity-User',
  'Google-Extended', 'Applebot-Extended', 'Meta-ExternalAgent', 'Amazonbot', 'DuckAssistBot', 'MistralAI-User', 'CCBot', 'cohere-ai',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: PRIVATE },
      ...AI_AGENTS.map(userAgent => ({ userAgent, allow: ['/', '/llms.txt', '/llms-full.txt'], disallow: PRIVATE })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
