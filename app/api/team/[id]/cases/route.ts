import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/team/[id]/cases - Get case count for a user
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    const caseCount = await prisma.caseAssignment.count({
      where: { userId: id },
    })

    return NextResponse.json({ caseCount })
  } catch (error) {
    console.error('Error fetching case count:', error)
    return NextResponse.json(
      { error: 'Failed to fetch case count' },
      { status: 500 }
    )
  }
}
