import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { canViewAllCases } from '@/lib/utils/rbac'
import { CaseStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const userEmail = request.nextUrl.searchParams.get('email')

    if (!userEmail) {
      return NextResponse.json({ error: 'Email required' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') as CaseStatus | null
    const search = searchParams.get('search')
    const clientId = searchParams.get('clientId')

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, role: true, organizationId: true },
    })

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'User not found or no organization' }, { status: 404 })
    }

    const isAdmin = canViewAllCases(user.role)

    let whereClause: any = {
      organizationId: user.organizationId, // Filter by organization
    }

    if (status) {
      whereClause.status = status
    }

    if (clientId) {
      whereClause.clientId = clientId
    }

    if (search) {
      whereClause.OR = [
        { caseNumber: { contains: search, mode: 'insensitive' } },
        { petitionerName: { contains: search, mode: 'insensitive' } },
        { respondentName: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (!isAdmin) {
      whereClause.assignments = {
        some: {
          userId: user.id,
        },
      }
    }

    const cases = await prisma.case.findMany({
      where: whereClause,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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
        _count: {
          select: {
            hearings: true,
            documents: true,
          },
        },
      },
      orderBy: {
        nextHearingDate: 'asc',
      },
    })

    return NextResponse.json({ cases })
  } catch (error) {
    console.error('Error fetching cases:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userEmail,
      caseNumber,
      year,
      appearingFor,
      clientId,
      otherParties,
      opponentMainParty,
      opponentOtherParties,
      courtId,
      courtNumber,
      caseTypeId,
      filingDate,
      nextHearingDate,
      synopsis,
      assignedUserIds,
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
        { error: 'Clerks cannot create cases' },
        { status: 403 }
      )
    }

    if (!caseNumber || !appearingFor || !opponentMainParty || !filingDate) {
      return NextResponse.json(
        { error: 'Missing required fields: caseNumber, appearingFor, opponentMainParty, filingDate' },
        { status: 400 }
      )
    }

    // Check if case number already exists in this organization
    const existingCase = await prisma.case.findUnique({
      where: {
        caseNumber_organizationId: {
          caseNumber,
          organizationId: user.organizationId,
        },
      },
    })

    if (existingCase) {
      return NextResponse.json(
        { error: 'Case number already exists in your organization' },
        { status: 409 }
      )
    }

    // Prepare assignments - always include creator, plus any assigned users
    const assignmentUserIds = new Set<string>([user.id]) // Creator is always assigned
    if (assignedUserIds && Array.isArray(assignedUserIds)) {
      assignedUserIds.forEach((id: string) => assignmentUserIds.add(id))
    }

    const newCase = await prisma.case.create({
      data: {
        caseNumber,
        year,
        appearingFor,
        clientId,
        otherParties: otherParties || [],
        opponentMainParty,
        opponentOtherParties: opponentOtherParties || [],
        courtId,
        courtNumber,
        caseTypeId,
        filingDate: new Date(filingDate),
        nextHearingDate: nextHearingDate ? new Date(nextHearingDate) : null,
        synopsis,
        status: CaseStatus.ACTIVE,
        organizationId: user.organizationId,
        assignments: {
          create: Array.from(assignmentUserIds).map(userId => ({ userId })),
        },
      },
      include: {
        client: true,
        court: true,
        caseType: true,
        assignments: {
          include: {
            user: true,
          },
        },
      },
    })

    // If next hearing date is provided, create a hearing entry
    if (nextHearingDate) {
      await prisma.hearing.create({
        data: {
          caseId: newCase.id,
          hearingDate: new Date(nextHearingDate),
          itemNumber: null,
          outcome: null,
          nextHearingDate: null,
        },
      })
    }

    return NextResponse.json({ case: newCase }, { status: 201 })
  } catch (error) {
    console.error('Error creating case:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
