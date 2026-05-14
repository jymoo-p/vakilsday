import { NextRequest, NextResponse } from 'next/server'
import { getAvailableCourts } from '@/lib/services/ecourts'

export async function GET(request: NextRequest) {
  try {
    const result = await getAvailableCourts()

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch courts' },
        { status: 500 }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Courts API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
