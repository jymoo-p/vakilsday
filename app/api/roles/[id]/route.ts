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

    // Check if role exists and belongs to organization
    const role = await prisma.customRole.findUnique({
      where: { id },
      select: { organizationId: true },
    })

    if (!role || role.organizationId !== admin.organizationId) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    // Delete role (users will have customRoleId set to null due to SetNull)
    await prisma.customRole.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Role deleted successfully' })
  } catch (error) {
    console.error('Error deleting role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { adminEmail, name, permissions } = body

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

    // Check if role exists and belongs to organization
    const role = await prisma.customRole.findUnique({
      where: { id },
      select: { organizationId: true },
    })

    if (!role || role.organizationId !== admin.organizationId) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    const updatedRole = await prisma.customRole.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(permissions && { permissions }),
      },
      include: {
        _count: {
          select: { users: true },
        },
      },
    })

    return NextResponse.json({ role: updatedRole })
  } catch (error) {
    console.error('Error updating role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
