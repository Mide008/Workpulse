import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/marketing-data'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const pages: [string, number, 'weekly' | 'monthly' | 'yearly'][] = [
    ['/', 1, 'weekly'], ['/pricing', 0.9, 'monthly'], ['/sectors', 0.8, 'monthly'], ['/security', 0.8, 'monthly'],
    ['/about', 0.6, 'monthly'], ['/careers', 0.5, 'monthly'], ['/contact', 0.5, 'yearly'],
    ['/privacy', 0.3, 'yearly'], ['/terms', 0.3, 'yearly'], ['/cookies', 0.3, 'yearly'],
    ['/llms.txt', 0.4, 'monthly'], ['/llms-full.txt', 0.4, 'monthly'],
  ]
  return pages.map(([path, priority, changeFrequency]) => ({ url: `${SITE_URL}${path}`, lastModified: now, changeFrequency, priority }))
}
