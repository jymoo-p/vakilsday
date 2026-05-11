import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { canViewAllCases } from '@/lib/utils/rbac'

export async function GET(request: NextRequest) {
  try {
    const userEmail = request.headers.get('x-user-email') || request.nextUrl.searchParams.get('email')

    if (!userEmail) {
      // Try to get from Firebase ID token in the future
      // For now, get from query param
      return NextResponse.json({ error: 'Email required' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isAdmin = canViewAllCases(user.role)

    // Get today's cases
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    let todaysWhereClause: any = {
      nextHearingDate: {
        gte: today,
        lt: tomorrow,
      },
      status: 'ACTIVE',
      organizationId: user.organizationId,
    }

    if (!isAdmin) {
      todaysWhereClause.assignments = {
        some: {
          userId: user.id,
        },
      }
    }

    const todaysCases = await prisma.case.findMany({
      where: todaysWhereClause,
      include: {
        assignments: {
          include: {
            user: {
              select: {
                name: true,
                role: true,
              },
            },
          },
        },
        hearings: {
          orderBy: {
            hearingDate: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        courtNumber: 'asc',
      },
    })

    // Get upcoming cases
    const nextWeek = new Date(tomorrow)
    nextWeek.setDate(nextWeek.getDate() + 7)

    let upcomingWhereClause: any = {
      nextHearingDate: {
        gte: tomorrow,
        lt: nextWeek,
      },
      status: 'ACTIVE',
      organizationId: user.organizationId,
    }

    if (!isAdmin) {
      upcomingWhereClause.assignments = {
        some: {
          userId: user.id,
        },
      }
    }

    const upcomingCases = await prisma.case.findMany({
      where: upcomingWhereClause,
      orderBy: {
        nextHearingDate: 'asc',
      },
      take: 5,
    })

    return NextResponse.json({
      todaysCases,
      upcomingCases,
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
