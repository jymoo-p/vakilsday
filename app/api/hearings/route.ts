import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { canUpdateHearingDate, canViewAllCases } from '@/lib/utils/rbac'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { caseId, hearingDate, itemNumber, outcome, nextHearingDate, userEmail } = body

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

    if (!canUpdateHearingDate(user.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

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
