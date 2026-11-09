import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { canViewAllCases } from '@/lib/utils/rbac'
import {
  getExtraFieldsForCase,
  setCaseCnrNumber,
  setCaseOpposingCounselStrategy,
  setCaseStructuredSynopsis,
} from '@/lib/cases-db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userEmail = request.nextUrl.searchParams.get('email')

    if (!userEmail) {
      return NextResponse.json({ error: 'Email required' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, role: true, organizationId: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isAdmin = canViewAllCases(user.role)
    const { id } = await params

    const caseData = await prisma.case.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            otherPhone: true,
            email: true,
            address: true,
            lawyerNotes: true,
          },
        },
        court: {
          select: {
            id: true,
            name: true,
          },
        },
        caseType: {
          select: {
            id: true,
            name: true,
          },
        },
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

    const extraFields = await getExtraFieldsForCase(id)

    // Find connected matters (other cases for the same client in the organization)
    let connectedMatters: any[] = []
    if (caseData.clientId) {
      const otherCases = await prisma.case.findMany({
        where: {
          organizationId: caseData.organizationId,
          clientId: caseData.clientId,
          id: { not: id },
        },
        select: {
          id: true,
          caseNumber: true,
          status: true,
          appearingFor: true,
          opponentMainParty: true,
          nextHearingDate: true,
          court: { select: { name: true } },
          caseType: { select: { name: true } },
        },
        take: 10,
      })
      connectedMatters = otherCases
    }

    return NextResponse.json({
      case: {
        ...caseData,
        ...extraFields,
        connectedMatters,
      },
    })
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
    const body = await request.json()
    const { userEmail } = body

    if (!userEmail) {
      return NextResponse.json({ error: 'User email required' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, role: true, organizationId: true },
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

    // Handle team assignments separately and exclude relation objects
    const {
      assignedUserIds,
      userEmail: _userEmail,
      client,
      court,
      caseType,
      assignments,
      hearings,
      documents,
      nextHearingTime,
      cnrNumber,
      opposingCounselStrategy,
      cruxOfDispute,
      prayerRelief,
      keyIssues,
      interimOrders,
      interimOrderValidUntil,
      ...caseUpdateData
    } = body

    // Clean up the update data - remove empty relation IDs
    const cleanedData: any = { ...caseUpdateData }

    // Handle dates
    if (body.filingDate) cleanedData.filingDate = new Date(body.filingDate)
    if (body.nextHearingDate) cleanedData.nextHearingDate = new Date(body.nextHearingDate)

    // Remove nextHearingTime from cleanedData as it's not a Prisma field
    delete cleanedData.nextHearingTime

    // Remove relation IDs from cleanedData as they need special handling
    delete cleanedData.clientId
    delete cleanedData.courtId
    delete cleanedData.caseTypeId

    // Build relation updates
    const relationUpdates: any = {}

    if (body.clientId !== undefined) {
      if (body.clientId && body.clientId !== '' && body.clientId !== '_none') {
        relationUpdates.client = { connect: { id: body.clientId } }
      } else {
        relationUpdates.client = { disconnect: true }
      }
    }

    if (body.courtId !== undefined) {
      if (body.courtId && body.courtId !== '') {
        relationUpdates.court = { connect: { id: body.courtId } }
      } else {
        relationUpdates.court = { disconnect: true }
      }
    }

    if (body.caseTypeId !== undefined) {
      if (body.caseTypeId && body.caseTypeId !== '') {
        relationUpdates.caseType = { connect: { id: body.caseTypeId } }
      } else {
        relationUpdates.caseType = { disconnect: true }
      }
    }

    // Update case data
    if (Object.keys(cleanedData).length > 0 || Object.keys(relationUpdates).length > 0) {
      await prisma.case.update({
        where: { id },
        data: {
          ...cleanedData,
          ...relationUpdates,
        },
      })
    }

    // Update CNR number if provided
    if (cnrNumber !== undefined) {
      await setCaseCnrNumber(id, cnrNumber)
    }

    // Update Opposing Counsel Strategy if provided
    if (opposingCounselStrategy !== undefined) {
      await setCaseOpposingCounselStrategy(id, opposingCounselStrategy)
    }

    // Update Structured Synopsis fields if provided
    if (
      cruxOfDispute !== undefined ||
      prayerRelief !== undefined ||
      keyIssues !== undefined ||
      interimOrders !== undefined ||
      interimOrderValidUntil !== undefined
    ) {
      await setCaseStructuredSynopsis(id, {
        cruxOfDispute,
        prayerRelief,
        keyIssues,
        interimOrders,
        interimOrderValidUntil,
      })
    }

    // Update team assignments if provided
    if (assignedUserIds && Array.isArray(assignedUserIds)) {
      // Delete existing assignments
      await prisma.caseAssignment.deleteMany({
        where: { caseId: id },
      })

      // Create new assignments
      if (assignedUserIds.length > 0) {
        await prisma.caseAssignment.createMany({
          data: assignedUserIds.map((userId: string) => ({
            caseId: id,
            userId,
          })),
        })
      }
    }

    // Fetch updated case with assignments
    const finalCase = await prisma.case.findUnique({
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
      },
    })

    const extraFields = await getExtraFieldsForCase(id)

    return NextResponse.json({
      case: finalCase
        ? {
            ...finalCase,
            ...extraFields,
          }
        : null,
    })
  } catch (error: any) {
    console.error('Error updating case:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
    })
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userEmail = request.nextUrl.searchParams.get('email')

    if (!userEmail) {
      return NextResponse.json({ error: 'Email required' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, role: true, organizationId: true },
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
