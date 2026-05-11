import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        _count: {
          select: { cases: true },
        },
      },
    })

    if (!client || client.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    return NextResponse.json({ client })
  } catch (error) {
    console.error('Error fetching client:', error)
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
        { error: 'Clerks cannot edit clients' },
        { status: 403 }
      )
    }

    // Verify client belongs to organization
    const existingClient = await prisma.client.findUnique({
      where: { id },
      select: { organizationId: true },
    })

    if (!existingClient || existingClient.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    if (gender && !['MALE', 'FEMALE', 'OTHER'].includes(gender)) {
      return NextResponse.json({ error: 'Invalid gender' }, { status: 400 })
    }

    const client = await prisma.client.update({
      where: { id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(gender && { gender }),
        age,
        ...(phone && { phone }),
        otherPhone,
        email,
        address,
        lawyerNotes,
      },
      include: {
        _count: {
          select: { cases: true },
        },
      },
    })

    return NextResponse.json({ client })
  } catch (error) {
    console.error('Error updating client:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { userEmail } = body

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
        { error: 'Clerks cannot delete clients' },
        { status: 403 }
      )
    }

    // Verify client belongs to organization
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        _count: {
          select: { cases: true },
        },
      },
    })

    if (!client || client.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Check if client has associated cases
    if (client._count.cases > 0) {
      return NextResponse.json(
        {
          error: `${client.firstName} ${client.lastName} is associated with ${client._count.cases} case(s). Please delete or reassign the case(s) first.`,
        },
        { status: 400 }
      )
    }

    await prisma.client.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Client deleted successfully' })
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
