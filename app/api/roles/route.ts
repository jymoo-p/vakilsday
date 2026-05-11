import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userEmail = request.nextUrl.searchParams.get('email')

    if (!userEmail) {
      return NextResponse.json({ error: 'Email required' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, role: true, organizationId: true },
    })

    if (!user || user.role !== 'ADMIN' || !user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const roles = await prisma.customRole.findMany({
      where: { organizationId: user.organizationId },
      include: {
        _count: {
          select: { users: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ roles })
  } catch (error) {
    console.error('Error fetching roles:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
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

    if (!name || !permissions || !Array.isArray(permissions) || permissions.length === 0) {
      return NextResponse.json({ error: 'Invalid role data' }, { status: 400 })
    }

    // Check if role name already exists
    const existingRole = await prisma.customRole.findUnique({
      where: {
        name_organizationId: {
          name,
          organizationId: admin.organizationId,
        },
      },
    })

    if (existingRole) {
      return NextResponse.json({ error: 'Role name already exists' }, { status: 409 })
    }

    const role = await prisma.customRole.create({
      data: {
        name,
        permissions,
        organizationId: admin.organizationId,
      },
      include: {
        _count: {
          select: { users: true },
        },
      },
    })

    return NextResponse.json({ role }, { status: 201 })
  } catch (error) {
    console.error('Error creating role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
