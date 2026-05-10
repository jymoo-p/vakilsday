import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const dbUrl = process.env.DATABASE_URL
    const masked = dbUrl
      ? dbUrl.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')
      : 'NOT SET'

    return NextResponse.json({
      databaseUrl: masked,
      allEnvKeys: Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('POSTGRES')).sort()
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read env' }, { status: 500 })
  }
}
