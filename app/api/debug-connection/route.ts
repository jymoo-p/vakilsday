import { NextResponse } from 'next/server'

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || ''

  // Extract host from connection string
  const hostMatch = dbUrl.match(/@([^:\/]+)/)
  const host = hostMatch ? hostMatch[1] : 'unknown'

  return NextResponse.json({
    host,
    isSupabase: host.includes('supabase'),
    isNeon: host.includes('neon'),
    connectionString: dbUrl.substring(0, 50) + '...' // Show first 50 chars only
  })
}
