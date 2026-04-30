import { WorkPulseLogo } from '@/components/ui/logo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <WorkPulseLogo className="h-10 w-auto" />
        </div>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {children}
        </div>
        <p className="text-center text-slate-500 text-sm mt-6">
          © {new Date().getFullYear()} WorkPulse. All rights reserved.
        </p>
      </div>
    </div>
  )
}