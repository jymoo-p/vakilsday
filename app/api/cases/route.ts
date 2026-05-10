import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canViewAllCases } from '@/lib/utils/rbac'
import { CaseStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') as CaseStatus | null
    const search = searchParams.get('search')

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isAdmin = canViewAllCases(user.role)

    let whereClause: any = {}

    if (status) {
      whereClause.status = status
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

    if (user.role === 'CLERK') {
      return NextResponse.json(
        { error: 'Clerks cannot create cases' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      caseNumber,
      courtName,
      courtNumber,
      petitionerName,
      respondentName,
      judgeName,
      opposingCounselName,
      opposingCounselPhone,
      filingDate,
      nextHearingDate,
      synopsis,
    } = body

    if (!caseNumber || !courtName || !petitionerName || !respondentName || !filingDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const existingCase = await prisma.case.findUnique({
      where: { caseNumber },
    })

    if (existingCase) {
      return NextResponse.json(
        { error: 'Case number already exists' },
        { status: 409 }
      )
    }

    const newCase = await prisma.case.create({
      data: {
        caseNumber,
        courtName,
        courtNumber,
        petitionerName,
        respondentName,
        judgeName,
        opposingCounselName,
        opposingCounselPhone,
        filingDate: new Date(filingDate),
        nextHearingDate: nextHearingDate ? new Date(nextHearingDate) : null,
        synopsis,
        status: CaseStatus.ACTIVE,
        assignments: {
          create: {
            userId: user.id,
          },
        },
      },
      include: {
        assignments: {
          include: {
            user: true,
          },
        },
      },
    })

    return NextResponse.json({ case: newCase }, { status: 201 })
  } catch (error) {
    console.error('Error creating case:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
