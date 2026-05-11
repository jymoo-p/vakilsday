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

    const caseType = await prisma.caseType.findUnique({
      where: { id },
      include: {
        _count: {
          select: { cases: true },
        },
      },
    })

    if (!caseType || caseType.organizationId !== admin.organizationId) {
      return NextResponse.json({ error: 'Case type not found' }, { status: 404 })
    }

    if (caseType._count.cases > 0) {
      return NextResponse.json(
        { error: `Cannot delete case type. It is associated with ${caseType._count.cases} case(s).` },
        { status: 400 }
      )
    }

    await prisma.caseType.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Case type deleted successfully' })
  } catch (error) {
    console.error('Error deleting case type:', error)
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

    const caseType = await prisma.caseType.findUnique({
      where: { id },
    })

    if (!caseType || caseType.organizationId !== admin.organizationId) {
      return NextResponse.json({ error: 'Case type not found' }, { status: 404 })
    }

    const updatedCaseType = await prisma.caseType.update({
      where: { id },
      data: { name },
    })

    return NextResponse.json({ caseType: updatedCaseType })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Case type name already exists' }, { status: 409 })
    }
    console.error('Error updating case type:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
