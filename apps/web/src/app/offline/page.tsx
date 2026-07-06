// apps/web/src/app/offline/page.tsx
'use client'

export const dynamic = 'force-dynamic'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">📡</div>
        <h1 className="text-2xl font-bold text-white mb-3">You're offline</h1>
        <p className="text-slate-400 mb-6 leading-relaxed">
          WorkPulse needs an internet connection to sync your data. Check your connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition"
        >
          Retry
        </button>
      </div>
    </div>
  )
}