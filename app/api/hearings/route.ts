import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canUpdateHearingDate, canViewAllCases } from '@/lib/utils/rbac'

export async function POST(request: NextRequest) {
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

    if (!canUpdateHearingDate(user.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { caseId, hearingDate, itemNumber, outcome, nextHearingDate } = body

    if (!caseId || !hearingDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        assignments: true,
      },
    })

    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    const isAdmin = canViewAllCases(user.role)
    const isAssigned = caseData.assignments.some((a) => a.userId === user.id)

    if (!isAdmin && !isAssigned) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const hearing = await prisma.hearing.create({
      data: {
        caseId,
        hearingDate: new Date(hearingDate),
        itemNumber,
        outcome,
        nextHearingDate: nextHearingDate ? new Date(nextHearingDate) : null,
      },
    })

    if (nextHearingDate) {
      await prisma.case.update({
        where: { id: caseId },
        data: {
          nextHearingDate: new Date(nextHearingDate),
        },
      })
    }

    return NextResponse.json({ hearing }, { status: 201 })
  } catch (error) {
    console.error('Error creating hearing:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
