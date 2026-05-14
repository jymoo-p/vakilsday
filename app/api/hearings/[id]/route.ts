import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { userEmail, hearingDate, itemNumber, outcome, nextHearingDate } = body

    if (!userEmail) {
      return NextResponse.json({ error: 'User email required' }, { status: 401 })
    }

    // Verify user has access to this case
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, role: true, organizationId: true },
    })

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get the hearing with case info
    const hearing = await prisma.hearing.findUnique({
      where: { id },
      include: {
        case: {
          select: {
            organizationId: true,
            assignments: {
              where: { userId: user.id },
              select: { id: true },
            },
          },
        },
      },
    })

    if (!hearing) {
      return NextResponse.json({ error: 'Hearing not found' }, { status: 404 })
    }

    // Check access
    const hasAccess =
      hearing.case.organizationId === user.organizationId &&
      (user.role === 'ADMIN' || hearing.case.assignments.length > 0)

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Update hearing
    const updatedHearing = await prisma.hearing.update({
      where: { id },
      data: {
        hearingDate: hearingDate ? new Date(hearingDate) : undefined,
        itemNumber: itemNumber || null,
        outcome: outcome || null,
        nextHearingDate: nextHearingDate ? new Date(nextHearingDate) : null,
      },
    })

    // If nextHearingDate changed, update the case's nextHearingDate
    if (nextHearingDate) {
      await prisma.case.update({
        where: { id: hearing.caseId },
        data: { nextHearingDate: new Date(nextHearingDate) },
      })
    }

    return NextResponse.json({ hearing: updatedHearing })
  } catch (error) {
    console.error('Error updating hearing:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
