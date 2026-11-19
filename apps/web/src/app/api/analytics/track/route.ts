// apps/web/src/app/api/analytics/track/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { country, city, path } = await req.json()
    if (!path) return NextResponse.json({ ok: true })

    const supabaseAdmin = createAdminClient()
    
    // Cast to any because 'page_views' was created via SQL and isn't in generated types yet
    await (supabaseAdmin as any).from('page_views').insert({ country, city, path })
    
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true }) // Fail silently so it doesn't break the user's page load
  }
}