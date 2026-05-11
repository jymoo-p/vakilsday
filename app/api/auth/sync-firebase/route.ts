import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { uid, email, name, photoURL } = await request.json()

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
