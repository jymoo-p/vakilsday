import { NextRequest, NextResponse } from 'next/server'
import { legalSearchService } from '@/lib/services/legal-search'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      )
    }

    const results = await legalSearchService.searchBareActs(query, limit)

    return NextResponse.json({
      query,
      count: results.length,
      results,
    })
  } catch (error) {
    console.error('Bare Acts search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
