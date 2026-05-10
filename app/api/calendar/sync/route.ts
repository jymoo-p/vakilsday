import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calendarSyncService } from '@/lib/services/calendar-sync'
import { getServerSession } from 'next-auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { caseId, nextHearingDate, action = 'create' } = body

    if (!caseId || !nextHearingDate) {
      return NextResponse.json(
        { error: 'Missing required fields: caseId, nextHearingDate' },
        { status: 400 }
      )
    }

    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
    })

    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { accounts: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const googleAccount = user.accounts.find(
      (account: { provider: string }) => account.provider === 'google'
    )

    if (!googleAccount || !googleAccount.access_token || !googleAccount.refresh_token) {
      return NextResponse.json(
        { error: 'Google Calendar not connected' },
        { status: 400 }
      )
    }

    calendarSyncService.setCredentials(
      googleAccount.access_token,
      googleAccount.refresh_token
    )

    const calendarEvent = {
      caseId: caseData.id,
      caseNumber: caseData.caseNumber,
      courtName: caseData.courtName,
      hearingDate: new Date(nextHearingDate),
      parties: `${caseData.petitionerName} vs ${caseData.respondentName}`,
    }

    let result

    if (action === 'create') {
      result = await calendarSyncService.syncHearingToCalendar(
        calendarEvent,
        session.user.email
      )

      if (result) {
        await prisma.case.update({
          where: { id: caseId },
          data: {
            nextHearingDate: new Date(nextHearingDate),
          },
        })
      }
    } else if (action === 'update') {
      const { calendarEventId } = body

      if (!calendarEventId) {
        return NextResponse.json(
          { error: 'calendarEventId required for update' },
          { status: 400 }
        )
      }

      result = await calendarSyncService.updateCalendarEvent(
        calendarEventId,
        calendarEvent
      )

      if (result) {
        await prisma.case.update({
          where: { id: caseId },
          data: {
            nextHearingDate: new Date(nextHearingDate),
          },
        })
      }
    } else if (action === 'delete') {
      const { calendarEventId } = body

      if (!calendarEventId) {
        return NextResponse.json(
          { error: 'calendarEventId required for delete' },
          { status: 400 }
        )
      }

      result = await calendarSyncService.deleteCalendarEvent(calendarEventId)
    }

    return NextResponse.json({
      success: true,
      calendarEventId: result,
      message: 'Calendar sync completed',
    })
  } catch (error) {
    console.error('Calendar sync error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
