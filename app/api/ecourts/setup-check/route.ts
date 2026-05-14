import { NextResponse } from 'next/server'
import { checkECourtsSetup } from '@/lib/services/ecourts'

export async function GET() {
  try {
    const result = await checkECourtsSetup()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Setup check error:', error)
    return NextResponse.json(
      { installed: false, error: 'Failed to check setup' },
      { status: 500 }
    )
  }
}
