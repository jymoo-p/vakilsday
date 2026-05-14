import { NextRequest, NextResponse } from 'next/server'
import { getCauseList } from '@/lib/services/ecourts'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userEmail = request.nextUrl.searchParams.get('email')
    const stateCode = request.nextUrl.searchParams.get('stateCode')
    const courtCode = request.nextUrl.searchParams.get('courtCode')
    const date = request.nextUrl.searchParams.get('date')

    if (!userEmail) {
      return NextResponse.json({ error: 'Email required' }, { status: 401 })
    }

    if (!stateCode || !courtCode || !date) {
      return NextResponse.json(
        { error: 'Missing required parameters: stateCode, courtCode, date' },
        { status: 400 }
      )
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, organizationId: true },
    })

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch cause list from eCourts
    const result = await getCauseList(stateCode, courtCode, date)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch cause list' },
        { status: 500 }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Cause list API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
