import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

export async function GET(request: NextRequest) {
  const userEmail = request.nextUrl.searchParams.get('email')

  if (!userEmail) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google-drive/callback`
  )

  // Request offline access to get refresh token
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.appdata',
    ],
    state: userEmail, // Pass email through state
    prompt: 'consent', // Force consent to get refresh token
  })

  return NextResponse.json({ authUrl })
}
