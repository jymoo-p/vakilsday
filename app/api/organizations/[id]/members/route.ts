import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const members = await prisma.user.findMany({
      where: { organizationId: id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({ members })
  } catch (error) {
    console.error('Error fetching members:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { email, role, adminEmail } = body

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

    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role required' }, { status: 400 })
    }

    if (!['ADMIN', 'ASSOCIATE', 'CLERK'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Check if user exists
    let member = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, role: true, organizationId: true },
    })

    if (member) {
      // User exists - update their organization and role
      if (member.organizationId && member.organizationId !== id) {
        return NextResponse.json(
          { error: 'User already belongs to another organization' },
          { status: 409 }
        )
      }

      member = await prisma.user.update({
        where: { email },
        data: {
          organizationId: id,
          role,
        },
        select: { id: true, name: true, email: true, role: true },
      })
    } else {
      // User doesn't exist - create placeholder (will be completed on first sign-in)
      member = await prisma.user.create({
        data: {
          email,
          name: email.split('@')[0],
          role,
          organizationId: id,
        },
        select: { id: true, name: true, email: true, role: true },
      })
    }

    return NextResponse.json({ member }, { status: 201 })
  } catch (error) {
    console.error('Error adding member:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
