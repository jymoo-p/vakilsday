import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { canViewAllCases } from '@/lib/utils/rbac'

export async function GET(request: NextRequest) {
  try {
    const userEmail = request.nextUrl.searchParams.get('email')
    const start = request.nextUrl.searchParams.get('start')
    const end = request.nextUrl.searchParams.get('end')

    if (!userEmail) {
      return NextResponse.json({ error: 'Email required' }, { status: 401 })
    }

    if (!start || !end) {
      return NextResponse.json({ error: 'Start and end dates required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, role: true, organizationId: true },
    })

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'User not found or no organization' }, { status: 404 })
    }

    const isAdmin = canViewAllCases(user.role)

    // First, get the case IDs the user can access
    let caseIds: string[] = []

    if (isAdmin) {
      // Admin sees all cases in their organization
      const cases = await prisma.case.findMany({
        where: {
          organizationId: user.organizationId,
          status: 'ACTIVE',
        },
        select: { id: true },
      })
      caseIds = cases.map(c => c.id)
    } else {
      // Non-admin only sees assigned cases
      const assignments = await prisma.caseAssignment.findMany({
        where: {
          userId: user.id,
        },
        include: {
          case: {
            select: {
              id: true,
              organizationId: true,
              status: true,
            },
          },
        },
      })
      caseIds = assignments
        .filter(a => a.case.organizationId === user.organizationId && a.case.status === 'ACTIVE')
        .map(a => a.case.id)
    }

    // Fetch hearings for the date range
    const hearings = await prisma.hearing.findMany({
      where: {
        caseId: { in: caseIds },
        hearingDate: {
          gte: new Date(start),
          lte: new Date(end),
        },
      },
      include: {
        case: {
          include: {
            client: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            court: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        hearingDate: 'asc',
      },
    })

    // TODO: Re-enable appointments after migration is applied
    // const appointments = await prisma.appointment.findMany({
    //   where: {
    //     organizationId: user.organizationId,
    //     startTime: {
    //       gte: new Date(start),
    //       lte: new Date(end),
    //     },
    //   },
    //   include: {
    //     client: {
    //       select: {
    //         id: true,
    //         firstName: true,
    //         lastName: true,
    //       },
    //     },
    //   },
    //   orderBy: {
    //     startTime: 'asc',
    //   },
    // })

    return NextResponse.json({ hearings, appointments: [] })
  } catch (error) {
    console.error('Calendar API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
