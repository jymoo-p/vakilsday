import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { uid, email, name, photoURL, accessToken } = await request.json()

    if (!uid || !email) {
      return NextResponse.json(
        { error: 'UID and email are required' },
        { status: 400 }
      )
    }

    console.log('[SYNC-FIREBASE] Syncing user:', { uid, email, name })

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        organizationId: true,
      },
    })

    if (!user) {
      console.log('[SYNC-FIREBASE] Creating new user:', email)
      // Create new user with ADMIN role (will be properly set during onboarding)
      user = await prisma.user.create({
        data: {
          email,
          name: name || email,
          image: photoURL || null,
          role: 'ADMIN',
          emailVerified: new Date(),
        },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          role: true,
          organizationId: true,
        },
      })
      console.log('[SYNC-FIREBASE] User created:', user.id)
    } else {
      console.log('[SYNC-FIREBASE] Updating existing user:', user.id)
      // Update existing user info if needed
      user = await prisma.user.update({
        where: { email },
        data: {
          name: name || user.name,
          image: photoURL || user.image,
        },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          role: true,
          organizationId: true,
        },
      })
    }

    // Store Google OAuth tokens for Drive access
    if (accessToken) {
      console.log('[SYNC-FIREBASE] Storing access token for user:', user.id)
      // Check if Account record exists
      const existingAccount = await prisma.account.findFirst({
        where: {
          userId: user.id,
          provider: 'google',
        },
      })

      if (existingAccount) {
        // Update existing account
        await prisma.account.update({
          where: { id: existingAccount.id },
          data: {
            access_token: accessToken,
            expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
          },
        })
        console.log('[SYNC-FIREBASE] Account updated')
      } else {
        // Create new account record
        await prisma.account.create({
          data: {
            userId: user.id,
            type: 'oauth',
            provider: 'google',
            providerAccountId: uid,
            access_token: accessToken,
            token_type: 'Bearer',
            scope: 'openid email profile https://www.googleapis.com/auth/drive.file',
            expires_at: Math.floor(Date.now() / 1000) + 3600,
          },
        })
        console.log('[SYNC-FIREBASE] Account created')
      }
    }

    console.log('[SYNC-FIREBASE] Sync successful for user:', user.id)
    return NextResponse.json({
      success: true,
      userId: user.id,
      organizationId: user.organizationId,
      role: user.role,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[SYNC-FIREBASE] Error:', errorMessage)
    console.error('[SYNC-FIREBASE] Full error:', error)
    return NextResponse.json(
      { error: 'Failed to sync user: ' + errorMessage },
      { status: 500 }
    )
  }
}
