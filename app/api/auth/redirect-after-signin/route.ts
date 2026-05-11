import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ redirect: '/signin' })
    }

    // Check if user has organization
    if (session.user.organizationId) {
      return NextResponse.json({ redirect: '/dashboard' })
    } else {
      return NextResponse.json({ redirect: '/onboarding' })
    }
  } catch (error) {
    console.error('Redirect check error:', error)
    return NextResponse.json({ redirect: '/signin' }, { status: 500 })
  }
}
