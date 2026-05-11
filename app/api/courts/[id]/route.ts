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

    const court = await prisma.court.findUnique({
      where: { id },
      include: {
        _count: {
          select: { cases: true },
        },
      },
    })

    if (!court || court.organizationId !== admin.organizationId) {
      return NextResponse.json({ error: 'Court not found' }, { status: 404 })
    }

    if (court._count.cases > 0) {
      return NextResponse.json(
        { error: `Cannot delete court. It is associated with ${court._count.cases} case(s).` },
        { status: 400 }
      )
    }

    await prisma.court.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Court deleted successfully' })
  } catch (error) {
    console.error('Error deleting court:', error)
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

    const court = await prisma.court.findUnique({
      where: { id },
    })

    if (!court || court.organizationId !== admin.organizationId) {
      return NextResponse.json({ error: 'Court not found' }, { status: 404 })
    }

    const updatedCourt = await prisma.court.update({
      where: { id },
      data: { name },
    })

    return NextResponse.json({ court: updatedCourt })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Court name already exists' }, { status: 409 })
    }
    console.error('Error updating court:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
