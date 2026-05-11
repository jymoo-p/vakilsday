import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { uid, email, name, image } = body

    if (!uid || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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
        role: true,
        organizationId: true,
      },
    })

    // Create or update user
    if (!user) {
      // New user - create with default role
      user = await prisma.user.create({
        data: {
          email,
          name: name || email,
          image,
          role: 'ASSOCIATE', // Default role (may have been invited with specific role)
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          organizationId: true,
        },
      })
    } else {
      // Existing user - update name and image if provided
      user = await prisma.user.update({
        where: { email },
        data: {
          name: name || user.name,
          image: image || undefined,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          organizationId: true,
        },
      })
    }

    return NextResponse.json({ user }, { status: 200 })
  } catch (error) {
    console.error('Error creating/fetching user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
