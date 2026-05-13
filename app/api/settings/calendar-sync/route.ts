import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest) {
  try {
    const { userEmail, enabled } = await request.json()

    if (!userEmail) {
      return NextResponse.json({ error: 'User email required' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { email: userEmail },
      data: { calendarSyncEnabled: enabled },
      select: { id: true, calendarSyncEnabled: true }
    })

    return NextResponse.json({
      success: true,
      calendarSyncEnabled: user.calendarSyncEnabled
    })
  } catch (error) {
    console.error('Error updating calendar sync:', error)
    return NextResponse.json(
      { error: 'Failed to update calendar sync' },
      { status: 500 }
    )
  }
}
