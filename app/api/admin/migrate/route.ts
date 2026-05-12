import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  // Simple security check - require a secret token
  const authHeader = request.headers.get('authorization')
  const expectedToken = process.env.ADMIN_MIGRATE_TOKEN || 'change-me-in-production'

  if (authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('Testing database connection...')

    // Test connection by creating a simple query
    await prisma.$queryRaw`SELECT 1`

    console.log('Database connection successful!')

    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    ` as Array<{ table_name: string }>

    return NextResponse.json({
      success: true,
      message: 'Database connection verified',
      tablesCount: tables.length,
      tables: tables.map(t => t.table_name)
    })
  } catch (error: unknown) {
    const err = error as Error
    console.error('Database error:', err)
    return NextResponse.json({
      success: false,
      error: err.message,
    }, { status: 500 })
  }
}
