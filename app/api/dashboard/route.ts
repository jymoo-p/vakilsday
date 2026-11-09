import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { canViewAllCases } from '@/lib/utils/rbac'
import { CaseStatus } from '@prisma/client'
import { getOrganizationTasks } from '@/lib/tasks-db'

export async function GET(request: NextRequest) {
  try {
    const userEmail = request.nextUrl.searchParams.get('email')

    if (!userEmail) {
      return NextResponse.json({ error: 'Email required' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        name: true,
        role: true,
        specialization: true,
        organizationId: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'User not found or no organization' }, { status: 404 })
    }

    const isAdmin = canViewAllCases(user.role)

    // Get today's date range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get next week's date
    const nextWeek = new Date(tomorrow)
    nextWeek.setDate(nextWeek.getDate() + 7)

    // Build optimized query conditions based on role
    const hearingBaseWhere = isAdmin
      ? {
          case: {
            organizationId: user.organizationId,
            status: CaseStatus.ACTIVE,
          },
        }
      : {
          case: {
            organizationId: user.organizationId,
            status: CaseStatus.ACTIVE,
            assignments: {
              some: {
                userId: user.id,
              },
            },
          },
        }

    const hearingInclude = {
      notes: {
        take: 1,
        orderBy: { createdAt: 'desc' as const },
        select: { content: true },
      },
      case: {
        select: {
          id: true,
          caseNumber: true,
          year: true,
          status: true,
          courtNumber: true,
          judgeName: true,
          appearingFor: true,
          synopsis: true,
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
          caseType: {
            select: {
              name: true,
            },
          },
          assignments: {
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
          otherParties: true,
          opponentMainParty: true,
        },
      },
    }

    // Fetch dashboard data in parallel
    const [
      todaysHearings,
      weekHearings,
      upcomingHearings,
      activeCasesCount,
      teamMembers,
      courts,
      tasks,
    ] = await Promise.all([
      // Today's hearings
      prisma.hearing.findMany({
        where: {
          ...hearingBaseWhere,
          hearingDate: {
            gte: today,
            lt: tomorrow,
          },
        },
        include: hearingInclude,
        orderBy: {
          hearingDate: 'asc',
        },
      }),

      // This week's hearings
      prisma.hearing.findMany({
        where: {
          ...hearingBaseWhere,
          hearingDate: {
            gte: tomorrow,
            lt: nextWeek,
          },
        },
        include: hearingInclude,
        orderBy: {
          hearingDate: 'asc',
        },
        take: 20,
      }),

      // Next upcoming hearings overall (for Up Next fallback when today has none)
      prisma.hearing.findMany({
        where: {
          ...hearingBaseWhere,
          hearingDate: {
            gte: today,
          },
        },
        include: hearingInclude,
        orderBy: {
          hearingDate: 'asc',
        },
        take: 5,
      }),

      // Count active cases
      prisma.case.count({
        where: isAdmin
          ? {
              organizationId: user.organizationId,
              status: CaseStatus.ACTIVE,
            }
          : {
              organizationId: user.organizationId,
              status: CaseStatus.ACTIVE,
              assignments: {
                some: {
                  userId: user.id,
                },
              },
            },
      }),

      // Organization team members for Chamber Team & Presence widget
      prisma.user.findMany({
        where: {
          organizationId: user.organizationId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          specialization: true,
          otherInfo: true,
          customRole: {
            select: {
              name: true,
            },
          },
          assignedCases: {
            take: 2,
            orderBy: { assignedAt: 'desc' },
            include: {
              case: {
                select: {
                  id: true,
                  caseNumber: true,
                  courtNumber: true,
                  court: {
                    select: { name: true },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),

      // Courts in organization
      prisma.court.findMany({
        where: {
          organizationId: user.organizationId,
        },
        select: {
          id: true,
          name: true,
        },
        take: 5,
      }),

      // Organization tasks & limitation deadlines
      getOrganizationTasks(user.organizationId),
    ])

    return NextResponse.json({
      todaysHearings,
      weekHearings,
      upcomingHearings,
      activeCasesCount,
      teamMembers,
      courts,
      tasks,
      organizationName: user.organization?.name || 'Legal Workspace',
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
