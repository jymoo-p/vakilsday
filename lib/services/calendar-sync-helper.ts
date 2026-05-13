import { prisma } from '@/lib/prisma'
import { CalendarSyncService } from './calendar-sync'

export async function syncHearingToGoogleCalendar(
  userId: string,
  caseId: string,
  hearingDate: Date
) {
  try {
    // Check if user has calendar sync enabled
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { calendarSyncEnabled: true }
    })

    if (!user?.calendarSyncEnabled) {
      console.log('Calendar sync disabled for user:', userId)
      return null
    }

    // Get user's Google OAuth tokens
    const account = await prisma.account.findFirst({
      where: {
        userId,
        provider: 'google'
      },
      select: {
        access_token: true,
        refresh_token: true
      }
    })

    if (!account?.access_token || !account?.refresh_token) {
      console.log('No Google OAuth tokens found for user:', userId)
      return null
    }

    // Get case details
    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        client: true,
        court: true
      }
    })

    if (!caseData) {
      console.log('Case not found:', caseId)
      return null
    }

    // Build party names
    const clientName = caseData.client
      ? `${caseData.client.firstName} ${caseData.client.lastName}`
      : caseData.otherParties[0] || 'Unknown'

    const parties = `${clientName} vs ${caseData.opponentMainParty}`

    // Sync to Google Calendar
    const calendarSync = new CalendarSyncService()
    calendarSync.setCredentials(account.access_token, account.refresh_token)

    const googleEventId = await calendarSync.syncHearingToCalendar({
      caseId: caseData.id,
      caseNumber: caseData.caseNumber,
      courtName: caseData.court?.name || 'Court',
      hearingDate,
      parties
    }, '')

    console.log('Synced to Google Calendar:', googleEventId)
    return googleEventId
  } catch (error) {
    console.error('Error syncing hearing to Google Calendar:', error)
    return null
  }
}
