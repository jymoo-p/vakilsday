import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`

    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    ` as Array<{ table_name: string }>

    // Check if users table exists
    const hasUsersTable = tables.some(t => t.table_name === 'users')

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      tablesCount: tables.length,
      tables: tables.map(t => t.table_name),
      hasUsersTable,
      hasMigrated: hasUsersTable && tables.length >= 10
    })
  } catch (error: unknown) {
    const err = error as Error
    return NextResponse.json({
      status: 'error',
      database: 'disconnected',
      error: err.message,
      hint: 'Make sure you ran the SQL migration in Supabase SQL Editor'
    }, { status: 500 })
  }
}
