import { getCurrentUser } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome, {user.fullName?.split(' ')[0]}
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Workspace: {user.workspaceName}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['Active Tasks', 'Completed', 'Projects', 'Team Members'].map(label => (
          <div key={label} className="bg-slate-900 border border-white/5 rounded-2xl p-4">
            <p className="text-slate-400 text-sm">{label}</p>
            <p className="text-2xl font-bold text-white mt-2">—</p>
          </div>
        ))}
      </div>
    </div>
  )
}