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
    } else {
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
      }
    }

    return NextResponse.json({
      success: true,
      userId: user.id,
      organizationId: user.organizationId,
      role: user.role,
    })
  } catch (error) {
    console.error('Sync Firebase error:', error)
    return NextResponse.json(
      { error: 'Failed to sync user' },
      { status: 500 }
    )
  }
}
