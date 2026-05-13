import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { canUpdateHearingDate, canViewAllCases } from '@/lib/utils/rbac'
import { syncHearingToGoogleCalendar } from '@/lib/services/calendar-sync-helper'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { caseId, hearingDate, itemNumber, outcome, nextHearingDate, userEmail } = body

    if (!userEmail) {
      return NextResponse.json({ error: 'User email required' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, role: true, organizationId: true },
    })

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'User not found or no organization' }, { status: 404 })
    }

    if (!canUpdateHearingDate(user.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (!caseId || !hearingDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        assignments: true,
      },
    })

    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    const isAdmin = canViewAllCases(user.role)
    const isAssigned = caseData.assignments.some((a) => a.userId === user.id)

    if (!isAdmin && !isAssigned) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const currentHearingDate = new Date(hearingDate)
    const startOfDay = new Date(currentHearingDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(currentHearingDate)
    endOfDay.setHours(23, 59, 59, 999)

    // Check if a hearing entry already exists for today (from previous "next hearing date")
    const existingHearing = await prisma.hearing.findFirst({
      where: {
        caseId,
        hearingDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    })

    let hearing
    if (existingHearing) {
      // Update existing hearing entry (this was previously created as a placeholder)
      hearing = await prisma.hearing.update({
        where: { id: existingHearing.id },
        data: {
          itemNumber,
          outcome,
          nextHearingDate: nextHearingDate ? new Date(nextHearingDate) : null,
        },
      })
    } else {
      // First time - create new hearing entry for today
      hearing = await prisma.hearing.create({
        data: {
          caseId,
          hearingDate: currentHearingDate,
          itemNumber,
          outcome,
          nextHearingDate: nextHearingDate ? new Date(nextHearingDate) : null,
        },
      })
    }

    // Update case with next hearing date and create calendar appointment
    if (nextHearingDate) {
      const nextDate = new Date(nextHearingDate)

      await prisma.case.update({
        where: { id: caseId },
        data: {
          nextHearingDate: nextDate,
        },
      })

      // Check if next hearing date already has an entry (avoid duplicates)
      const nextStartOfDay = new Date(nextDate)
      nextStartOfDay.setHours(0, 0, 0, 0)
      const nextEndOfDay = new Date(nextDate)
      nextEndOfDay.setHours(23, 59, 59, 999)

      const existingNextHearing = await prisma.hearing.findFirst({
        where: {
          caseId,
          hearingDate: {
            gte: nextStartOfDay,
            lte: nextEndOfDay,
          },
        },
      })

      // Only create if doesn't exist
      if (!existingNextHearing) {
        await prisma.hearing.create({
          data: {
            caseId,
            hearingDate: nextDate,
            itemNumber: null,
            outcome: null,
            nextHearingDate: null,
          },
        })

        // Sync to Google Calendar if enabled (fire and forget)
        syncHearingToGoogleCalendar(user.id, caseId, nextDate).catch(err =>
          console.error('Calendar sync failed:', err)
        )
      }
    }

    return NextResponse.json({ hearing }, { status: 201 })
  } catch (error) {
    console.error('Error creating hearing:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
