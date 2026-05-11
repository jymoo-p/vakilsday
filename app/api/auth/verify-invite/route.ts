import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'No invitation token provided' },
        { status: 400 }
      )
    }

    // Find user with this invite token
    const user = await prisma.user.findUnique({
      where: { inviteToken: token },
      select: {
        id: true,
        email: true,
        inviteExpiry: true,
        password: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid invitation token' },
        { status: 404 }
      )
    }

    // Check if token has expired
    if (user.inviteExpiry && user.inviteExpiry < new Date()) {
      return NextResponse.json(
        { error: 'Invitation link has expired' },
        { status: 410 }
      )
    }

    // Check if password already set
    if (user.password) {
      return NextResponse.json(
        { error: 'Password already set for this account' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      email: user.email,
    })
  } catch (error) {
    console.error('Verify invite error:', error)
    return NextResponse.json(
      { error: 'Failed to verify invitation' },
      { status: 500 }
    )
  }
}
