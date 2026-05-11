import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id, memberId } = await params
    const body = await request.json()
    const { role, adminEmail } = body

    if (!adminEmail) {
      return NextResponse.json({ error: 'Admin email required' }, { status: 401 })
    }

    // Verify admin
    const admin = await prisma.user.findUnique({
      where: { email: adminEmail },
      select: { id: true, role: true, organizationId: true },
    })

    if (!admin || admin.role !== 'ADMIN' || admin.organizationId !== id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (!role || !['ADMIN', 'ASSOCIATE', 'CLERK'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Can't change own role
    if (admin.id === memberId) {
      return NextResponse.json(
        { error: 'Cannot change your own role' },
        { status: 400 }
      )
    }

    // Update member role
    const member = await prisma.user.update({
      where: { id: memberId },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    })

    return NextResponse.json({ member })
  } catch (error) {
    console.error('Error updating member:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id, memberId } = await params
    const body = await request.json()
    const { adminEmail } = body

    if (!adminEmail) {
      return NextResponse.json({ error: 'Admin email required' }, { status: 401 })
    }

    // Verify admin
    const admin = await prisma.user.findUnique({
      where: { email: adminEmail },
      select: { id: true, role: true, organizationId: true },
    })

    if (!admin || admin.role !== 'ADMIN' || admin.organizationId !== id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Can't remove self
    if (admin.id === memberId) {
      return NextResponse.json(
        { error: 'Cannot remove yourself' },
        { status: 400 }
      )
    }

    // Remove member from organization (keep user record but clear organization)
    await prisma.user.update({
      where: { id: memberId },
      data: {
        organizationId: null,
        role: 'ASSOCIATE', // Reset to default role
      },
    })

    return NextResponse.json({ message: 'Member removed successfully' })
  } catch (error) {
    console.error('Error removing member:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
