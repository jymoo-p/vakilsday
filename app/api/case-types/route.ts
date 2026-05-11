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

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'User not found or no organization' }, { status: 404 })
    }

    const caseTypes = await prisma.caseType.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ caseTypes })
  } catch (error) {
    console.error('Error fetching case types:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { adminEmail, name } = body

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

    if (!name) {
      return NextResponse.json({ error: 'Case type name required' }, { status: 400 })
    }

    const caseType = await prisma.caseType.create({
      data: {
        name,
        organizationId: admin.organizationId,
      },
    })

    return NextResponse.json({ caseType }, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Case type name already exists' }, { status: 409 })
    }
    console.error('Error creating case type:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
