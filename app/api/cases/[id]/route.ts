import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canViewAllCases } from '@/lib/utils/rbac'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isAdmin = canViewAllCases(user.role)
    const { id } = await params

    const caseData = await prisma.case.findUnique({
      where: { id },
      include: {
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
        hearings: {
          orderBy: {
            hearingDate: 'desc',
          },
          include: {
            notes: {
              where: user.role === 'CLERK' ? { isPrivate: false } : {},
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    role: true,
                  },
                },
              },
            },
          },
        },
        documents: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    if (!isAdmin) {
      const isAssigned = caseData.assignments.some((a: { userId: string }) => a.userId === user.id)
      if (!isAssigned) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    return NextResponse.json({ case: caseData })
  } catch (error) {
    console.error('Error fetching case:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { id } = await params

    const caseData = await prisma.case.findUnique({
      where: { id },
      include: {
        assignments: true,
      },
    })

    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    const isAdmin = canViewAllCases(user.role)
    const isAssigned = caseData.assignments.some((a: { userId: string }) => a.userId === user.id)

    if (!isAdmin && !isAssigned) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (user.role === 'CLERK') {
      return NextResponse.json(
        { error: 'Clerks can only update hearing dates' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const updatedCase = await prisma.case.update({
      where: { id },
      data: {
        ...body,
        filingDate: body.filingDate ? new Date(body.filingDate) : undefined,
        nextHearingDate: body.nextHearingDate ? new Date(body.nextHearingDate) : undefined,
      },
      include: {
        assignments: {
          include: {
            user: true,
          },
        },
      },
    })

    return NextResponse.json({ case: updatedCase })
  } catch (error) {
    console.error('Error updating case:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can delete cases' },
        { status: 403 }
      )
    }

    const { id } = await params

    await prisma.case.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Case deleted successfully' })
  } catch (error) {
    console.error('Error deleting case:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
