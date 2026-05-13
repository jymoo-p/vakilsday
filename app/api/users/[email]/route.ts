import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ email: string }> }
) {
  try {
    const { email } = await context.params

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: decodeURIComponent(email) },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        phone: true,
        role: true,
        bio: true,
        specialization: true,
        yearsOfService: true,
        joiningDate: true,
        otherInfo: true,
        organizationId: true,
        calendarSyncEnabled: true,
        createdAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ email: string }> }
) {
  try {
    const { email } = await context.params

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    const body = await request.json()
    const {
      name,
      phone,
      bio,
      specialization,
      yearsOfService,
      joiningDate,
      otherInfo,
    } = body

    const user = await prisma.user.update({
      where: { email: decodeURIComponent(email) },
      data: {
        name,
        phone,
        bio,
        specialization,
        yearsOfService,
        joiningDate,
        otherInfo,
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        phone: true,
        role: true,
        bio: true,
        specialization: true,
        yearsOfService: true,
        joiningDate: true,
        otherInfo: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
