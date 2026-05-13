import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const userEmail = request.nextUrl.searchParams.get('state')

  if (!code || !userEmail) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?error=missing_params`
    )
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google-drive/callback`
    )

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.access_token) {
      throw new Error('No access token received')
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Store tokens in account table
    const existingAccount = await prisma.account.findFirst({
      where: {
        userId: user.id,
        provider: 'google',
      },
    })

    if (existingAccount) {
      await prisma.account.update({
        where: { id: existingAccount.id },
        data: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || existingAccount.refresh_token,
          expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : undefined,
        },
      })
    } else {
      await prisma.account.create({
        data: {
          userId: user.id,
          type: 'oauth',
          provider: 'google',
          providerAccountId: userEmail,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || null,
          token_type: 'Bearer',
          scope: 'https://www.googleapis.com/auth/drive.file',
          expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : undefined,
        },
      })
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?drive_connected=true`
    )
  } catch (error) {
    console.error('Google Drive OAuth callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?error=oauth_failed`
    )
  }
}
