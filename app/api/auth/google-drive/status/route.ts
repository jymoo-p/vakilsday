import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const userEmail = request.nextUrl.searchParams.get('email')

  if (!userEmail) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const account = await prisma.account.findFirst({
      where: {
        userId: user.id,
        provider: 'google',
      },
      select: {
        access_token: true,
        refresh_token: true,
        expires_at: true,
      },
    })

    // Check if we have valid tokens
    const connected = !!(
      account &&
      account.access_token &&
      account.refresh_token
    )

    return NextResponse.json({ connected })
  } catch (error) {
    console.error('Error checking Drive status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
