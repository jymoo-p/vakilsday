import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { adminEmail, name, email, phone, role, customRoleId } = body

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

    if (!name || !email || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['ADMIN', 'ASSOCIATE', 'CLERK'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Check if user exists
    let member = await prisma.user.findUnique({
      where: { email },
      select: { id: true, organizationId: true },
    })

    if (member && member.organizationId && member.organizationId !== admin.organizationId) {
      return NextResponse.json(
        { error: 'User already belongs to another organization' },
        { status: 409 }
      )
    }

    // Verify custom role if provided
    if (customRoleId) {
      const customRole = await prisma.customRole.findUnique({
        where: { id: customRoleId },
      })

      if (!customRole || customRole.organizationId !== admin.organizationId) {
        return NextResponse.json({ error: 'Invalid custom role' }, { status: 400 })
      }
    }

    if (member) {
      // Update existing user
      member = await prisma.user.update({
        where: { email },
        data: {
          name,
          phone,
          role,
          organizationId: admin.organizationId,
          ...(customRoleId && { customRoleId }),
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          customRole: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })
    } else {
      // Create new user
      member = await prisma.user.create({
        data: {
          name,
          email,
          phone,
          role,
          organizationId: admin.organizationId,
          ...(customRoleId && { customRoleId }),
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          customRole: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })
    }

    return NextResponse.json({ member }, { status: 201 })
  } catch (error) {
    console.error('Error adding team member:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
