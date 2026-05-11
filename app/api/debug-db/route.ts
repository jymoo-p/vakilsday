import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const dbUrl = process.env.DATABASE_URL
    const maskedDb = dbUrl
      ? dbUrl.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')
      : 'NOT SET'

    const googleClientId = process.env.GOOGLE_CLIENT_ID
    const maskedClientId = googleClientId
      ? googleClientId.substring(0, 15) + '...' + googleClientId.substring(googleClientId.length - 15)
      : 'NOT SET'

    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
    const maskedSecret = googleClientSecret
      ? googleClientSecret.substring(0, 10) + '***'
      : 'NOT SET'

    return NextResponse.json({
      databaseUrl: maskedDb,
      googleClientId: maskedClientId,
      googleClientSecret: maskedSecret,
      nextAuthUrl: process.env.NEXTAUTH_URL || 'NOT SET',
      nextAuthSecret: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
      allEnvKeys: Object.keys(process.env).filter(k =>
        k.includes('DATABASE') ||
        k.includes('POSTGRES') ||
        k.includes('GOOGLE') ||
        k.includes('NEXTAUTH') ||
        k.includes('FIREBASE')
      ).sort(),
      firebaseConfigured: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'YES' : 'NO'
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read env' }, { status: 500 })
  }
}
