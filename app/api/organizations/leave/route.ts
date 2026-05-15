import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/organizations/leave - User leaves their organization
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userEmail } = body

    if (!userEmail) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        organizationId: true,
        role: true,
      },
    })

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 })
    }

    // Check if user is the only admin
    if (user.role === 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: {
          organizationId: user.organizationId,
          role: 'ADMIN',
        },
      })

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot leave organization. You are the only admin. Please assign another admin first.' },
          { status: 400 }
        )
      }
    }

    // Remove user from organization
    await prisma.user.update({
      where: { id: user.id },
      data: {
        organizationId: null,
        customRoleId: null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error leaving organization:', error)
    return NextResponse.json(
      { error: 'Failed to leave organization' },
      { status: 500 }
    )
  }
}
