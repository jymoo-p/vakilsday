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

    const clients = await prisma.client.findMany({
      where: { organizationId: user.organizationId },
      include: {
        _count: {
          select: { cases: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ clients })
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userEmail,
      firstName,
      lastName,
      gender,
      age,
      phone,
      otherPhone,
      email,
      address,
      lawyerNotes,
    } = body

    if (!userEmail) {
      return NextResponse.json({ error: 'User email required' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, role: true, organizationId: true },
    })

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'User not found or no organization' }, { status: 404 })
    }

    if (user.role === 'CLERK') {
      return NextResponse.json(
        { error: 'Clerks cannot create clients' },
        { status: 403 }
      )
    }

    if (!firstName || !lastName || !gender || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName, gender, phone' },
        { status: 400 }
      )
    }

    if (!['MALE', 'FEMALE', 'OTHER'].includes(gender)) {
      return NextResponse.json({ error: 'Invalid gender' }, { status: 400 })
    }

    const client = await prisma.client.create({
      data: {
        firstName,
        lastName,
        gender,
        age,
        phone,
        otherPhone,
        email,
        address,
        lawyerNotes,
        organizationId: user.organizationId,
      },
      include: {
        _count: {
          select: { cases: true },
        },
      },
    })

    return NextResponse.json({ client }, { status: 201 })
  } catch (error) {
    console.error('Error creating client:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
