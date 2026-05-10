import { google } from 'googleapis'
import { prisma } from '@/lib/prisma'

export interface CalendarEvent {
  caseId: string
  caseNumber: string
  courtName: string
  hearingDate: Date
  parties: string
}

export class CalendarSyncService {
  private oauth2Client: any

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXTAUTH_URL
    )
  }

  setCredentials(accessToken: string, refreshToken: string) {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
  }

  async syncHearingToCalendar(event: CalendarEvent, userEmail: string): Promise<string | null> {
    try {
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })

      const eventTitle = `Court Hearing: ${event.caseNumber}`
      const eventDescription = `
Case: ${event.caseNumber}
Court: ${event.courtName}
Parties: ${event.parties}

Hearing Date: ${event.hearingDate.toLocaleDateString('en-IN')}

View case details in VakilsDay app.
      `.trim()

      const startDateTime = new Date(event.hearingDate)
      startDateTime.setHours(10, 0, 0)

      const endDateTime = new Date(event.hearingDate)
      endDateTime.setHours(17, 0, 0)

      const calendarEvent = {
        summary: eventTitle,
        description: eventDescription,
        location: event.courtName,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: 'Asia/Kolkata',
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: 'Asia/Kolkata',
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 60 },
            { method: 'popup', minutes: 30 },
          ],
        },
        extendedProperties: {
          private: {
            vakilsdayCaseId: event.caseId,
            vakilsdaySource: 'hearing_update',
          },
        },
      }

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: calendarEvent,
      })

      console.log('Calendar event created:', response.data.id)
      return response.data.id || null
    } catch (error) {
      console.error('Error syncing to Google Calendar:', error)
      return null
    }
  }

  async updateCalendarEvent(
    eventId: string,
    event: CalendarEvent
  ): Promise<boolean> {
    try {
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })

      const eventTitle = `Court Hearing: ${event.caseNumber}`
      const eventDescription = `
Case: ${event.caseNumber}
Court: ${event.courtName}
Parties: ${event.parties}

Updated Hearing Date: ${event.hearingDate.toLocaleDateString('en-IN')}

View case details in VakilsDay app.
      `.trim()

      const startDateTime = new Date(event.hearingDate)
      startDateTime.setHours(10, 0, 0)

      const endDateTime = new Date(event.hearingDate)
      endDateTime.setHours(17, 0, 0)

      const calendarEvent = {
        summary: eventTitle,
        description: eventDescription,
        location: event.courtName,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: 'Asia/Kolkata',
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: 'Asia/Kolkata',
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 60 },
            { method: 'popup', minutes: 30 },
          ],
        },
      }

      await calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        requestBody: calendarEvent,
      })

      console.log('Calendar event updated:', eventId)
      return true
    } catch (error) {
      console.error('Error updating Google Calendar event:', error)
      return false
    }
  }

  async deleteCalendarEvent(eventId: string): Promise<boolean> {
    try {
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })

      await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
      })

      console.log('Calendar event deleted:', eventId)
      return true
    } catch (error) {
      console.error('Error deleting Google Calendar event:', error)
      return false
    }
  }

  async getUpcomingHearings(maxResults: number = 10): Promise<any[]> {
    try {
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults: maxResults,
        singleEvents: true,
        orderBy: 'startTime',
        q: 'Court Hearing',
      })

      return response.data.items || []
    } catch (error) {
      console.error('Error fetching upcoming hearings from calendar:', error)
      return []
    }
  }
}

export const calendarSyncService = new CalendarSyncService()
