// apps/web/next.config.ts
import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  // Fix: Allow Next.js dev resources (HMR, fonts) from your local network IP.
  // This resolves the "403 Forbidden" errors on fonts and WebSockets when
  // you access the app via http://192.168.0.105:3000 instead of localhost.
  allowedDevOrigins: ['192.168.0.105', 'localhost'],

  turbopack: {
    root: path.resolve(__dirname, '..', '..'),
  },

  experimental: {
    serverActions: {
      // Fix: Allow Server Actions to be called from your local network IP.
      // Without this, form submissions fail silently on mobile/other devices
      // when accessed via http://192.168.0.105:3000.
      allowedOrigins: ['localhost:3000', '192.168.0.105:3000'],
    },
  },

  headers: async () => [
    {
      source: '/sw.js',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        { key: 'Service-Worker-Allowed', value: '/' },
      ],
    },
  ],

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
}

export default nextConfig