import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { adminEmail } = body

    if (!adminEmail) {
      return NextResponse.json({ error: 'Admin email required' }, { status: 401 })
    }

    const admin = await prisma.user.findUnique({
      where: { email: adminEmail },
      select: { id: true, role: true, organizationId: true },
    })

    if (!admin || admin.role !== 'ADMIN' || !admin.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Cannot remove self
    if (admin.id === id) {
      return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 })
    }

    // Verify member belongs to organization
    const member = await prisma.user.findUnique({
      where: { id },
      select: { organizationId: true },
    })

    if (!member || member.organizationId !== admin.organizationId) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Remove from organization
    await prisma.user.update({
      where: { id },
      data: {
        organizationId: null,
        customRoleId: null,
        role: 'ASSOCIATE', // Reset to default
      },
    })

    return NextResponse.json({ message: 'Member removed successfully' })
  } catch (error) {
    console.error('Error removing team member:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
