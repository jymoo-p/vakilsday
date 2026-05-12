import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { canViewAllCases } from '@/lib/utils/rbac'

export async function GET(request: NextRequest) {
  try {
    const userEmail = request.nextUrl.searchParams.get('email')

    if (!userEmail) {
      return NextResponse.json({ error: 'Email required' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, role: true, organizationId: true },
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
            status: 'ACTIVE',
          },
        }
      : {
          case: {
            organizationId: user.organizationId,
            status: 'ACTIVE',
            assignments: {
              some: {
                userId: user.id,
              },
            },
          },
        }

    // Fetch today's and week's hearings in parallel
    const [todaysHearings, weekHearings] = await Promise.all([
      // Today's hearings
      prisma.hearing.findMany({
        where: {
          ...hearingBaseWhere,
          hearingDate: {
            gte: today,
            lt: tomorrow,
          },
        },
        include: {
          case: {
            select: {
              id: true,
              caseNumber: true,
              courtNumber: true,
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
              otherParties: true,
              opponentMainParty: true,
            },
          },
        },
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
        include: {
          case: {
            select: {
              id: true,
              caseNumber: true,
              courtNumber: true,
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
              otherParties: true,
              opponentMainParty: true,
            },
          },
        },
        orderBy: {
          hearingDate: 'asc',
        },
        take: 20,
      }),
    ])

    return NextResponse.json({
      todaysHearings,
      weekHearings,
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
