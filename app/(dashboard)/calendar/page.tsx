'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ArrowLeft, Clock } from 'lucide-react'
import Link from 'next/link'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from 'date-fns'

type HearingEvent = {
  id: string
  hearingDate: string
  itemNumber: string | null
  case: {
    id: string
    caseNumber: string
    courtNumber: string | null
    client: {
      firstName: string
      lastName: string
    } | null
    otherParties: string[]
    opponentMainParty: string
    court: {
      name: string
    } | null
  }
}

export default function CalendarPage() {
  const { user } = useAuth()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [hearings, setHearings] = useState<HearingEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  useEffect(() => {
    fetchMonthHearings()
  }, [user, currentMonth])

  async function fetchMonthHearings() {
    if (!user?.email) return

    setLoading(true)
    try {
      const monthStart = startOfMonth(currentMonth)
      const monthEnd = endOfMonth(currentMonth)

      const response = await fetch(
        `/api/calendar/hearings?email=${encodeURIComponent(user.email)}&start=${monthStart.toISOString()}&end=${monthEnd.toISOString()}`
      )

      if (response.ok) {
        const data = await response.json()
        setHearings(data.hearings || [])
      }
    } catch (err) {
      console.error('Error fetching hearings:', err)
    } finally {
      setLoading(false)
    }
  }

  function previousMonth() {
    setCurrentMonth(subMonths(currentMonth, 1))
    setSelectedDate(null)
  }

  function nextMonth() {
    setCurrentMonth(addMonths(currentMonth, 1))
    setSelectedDate(null)
  }

  function goToToday() {
    setCurrentMonth(new Date())
    setSelectedDate(new Date())
  }

  function getHearingsForDate(date: Date) {
    return hearings.filter((hearing) =>
      isSameDay(parseISO(hearing.hearingDate), date)
    )
  }

  function renderCalendarDays() {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const rows = []
    let days = []
    let day = startDate

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const currentDay = day
        const dayHearings = getHearingsForDate(currentDay)
        const isCurrentMonth = isSameMonth(currentDay, monthStart)
        const isTodayDate = isToday(currentDay)
        const isSelected = selectedDate && isSameDay(currentDay, selectedDate)

        days.push(
          <div
            key={currentDay.toString()}
            onClick={() => setSelectedDate(currentDay)}
            className={`
              min-h-[80px] md:min-h-[100px] p-2 md:p-3 border border-slate-200 cursor-pointer transition-colors
              ${!isCurrentMonth ? 'bg-slate-50' : 'bg-white hover:bg-slate-50'}
              ${isTodayDate ? 'ring-2 ring-blue-500 ring-inset' : ''}
              ${isSelected ? 'bg-blue-50' : ''}
            `}
          >
            {/* Mobile View: Simple date + dot indicator */}
            <div className="md:hidden flex flex-col items-center justify-center h-full">
              <span
                className={`
                  text-base font-semibold mb-1
                  ${!isCurrentMonth ? 'text-slate-400' : 'text-slate-900'}
                  ${isTodayDate ? 'text-blue-600' : ''}
                `}
              >
                {format(currentDay, 'd')}
              </span>
              {dayHearings.length > 0 && (
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                  {dayHearings.length > 1 && (
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  )}
                  {dayHearings.length > 2 && (
                    <div className="w-2 h-2 rounded-full bg-blue-300"></div>
                  )}
                </div>
              )}
            </div>

            {/* Desktop View: Date + case previews */}
            <div className="hidden md:block">
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`
                    text-sm font-semibold
                    ${!isCurrentMonth ? 'text-slate-400' : 'text-slate-900'}
                    ${isTodayDate ? 'text-blue-600' : ''}
                  `}
                >
                  {format(currentDay, 'd')}
                </span>
                {dayHearings.length > 0 && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">
                    {dayHearings.length}
                  </Badge>
                )}
              </div>

              <div className="space-y-1">
                {dayHearings.slice(0, 2).map((hearing) => (
                  <Link
                    key={hearing.id}
                    href={`/cases/${hearing.case.id}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="text-xs p-1.5 rounded bg-blue-100 hover:bg-blue-200 transition-colors truncate">
                      <p className="font-medium text-blue-900 truncate">
                        {hearing.case.caseNumber}
                      </p>
                      {hearing.case.court && (
                        <p className="text-blue-700 truncate text-[10px]">
                          {hearing.case.court.name}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
                {dayHearings.length > 2 && (
                  <div className="text-xs text-slate-500 pl-1.5">
                    +{dayHearings.length - 2} more
                  </div>
                )}
              </div>
            </div>
          </div>
        )

        day = addDays(day, 1)
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {days}
        </div>
      )
      days = []
    }

    return rows
  }

  const selectedDateHearings = selectedDate ? getHearingsForDate(selectedDate) : []

  const getClientName = (hearing: HearingEvent) => {
    if (hearing.case.client) {
      return `${hearing.case.client.firstName} ${hearing.case.client.lastName}`
    }
    return hearing.case.otherParties[0] || 'Unknown'
  }

  if (loading && hearings.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-600">Loading calendar...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center gap-2 md:gap-4">
        <Link href="/dashboard" className="md:block hidden">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Calendar</h2>
          <p className="text-sm md:text-lg text-slate-600 hidden md:block">View your hearing schedule</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4 md:pt-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h3 className="text-lg md:text-2xl font-bold text-slate-900">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <div className="flex items-center gap-1 md:gap-2">
              <Button variant="outline" onClick={goToToday} className="hidden md:flex">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday} className="md:hidden px-2">
                <CalendarIcon className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={previousMonth} className="h-9 w-9 md:h-10 md:w-10">
                <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth} className="h-9 w-9 md:h-10 md:w-10">
                <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 mb-1 md:mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
              <div
                key={day}
                className="text-center text-xs md:text-sm font-semibold text-slate-600 py-1 md:py-2"
              >
                <span className="hidden md:inline">{day}</span>
                <span className="md:hidden">{['S', 'M', 'T', 'W', 'T', 'F', 'S'][index]}</span>
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="space-y-0">{renderCalendarDays()}</div>
        </CardContent>
      </Card>

      {/* Selected Date Details */}
      {selectedDate && (
        <Card>
          <CardContent className="pt-4 md:pt-6">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="text-base md:text-xl font-bold text-slate-900">
                <span className="md:hidden">{format(selectedDate, 'EEE, MMM d')}</span>
                <span className="hidden md:inline">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
              </h3>
              <Badge variant="secondary" className="text-sm md:text-base px-2 md:px-3 py-0.5 md:py-1">
                {selectedDateHearings.length} hearing{selectedDateHearings.length !== 1 ? 's' : ''}
              </Badge>
            </div>

            {selectedDateHearings.length === 0 ? (
              <p className="text-center text-slate-500 py-6 md:py-8 text-sm md:text-base">
                No hearings scheduled for this date
              </p>
            ) : (
              <div className="space-y-2 md:space-y-3">
                {selectedDateHearings.map((hearing) => (
                  <Link key={hearing.id} href={`/cases/${hearing.case.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="py-3 md:py-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-base md:text-lg font-semibold text-slate-900 mb-1">
                              {hearing.case.caseNumber}
                            </h4>
                            <p className="text-sm md:text-base text-slate-600 truncate">
                              {getClientName(hearing)} vs {hearing.case.opponentMainParty}
                            </p>
                          </div>
                          <Clock className="h-4 w-4 md:h-5 md:w-5 text-slate-400 flex-shrink-0 ml-2" />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4 mt-3 md:mt-4 text-sm md:text-base">
                          {hearing.case.court && (
                            <div>
                              <p className="text-xs md:text-sm text-slate-500">Court</p>
                              <p className="font-medium text-slate-900 text-sm md:text-base truncate">
                                {hearing.case.court.name}
                              </p>
                            </div>
                          )}

                          {hearing.case.courtNumber && (
                            <div>
                              <p className="text-xs md:text-sm text-slate-500">Court No.</p>
                              <p className="font-medium text-slate-900 text-sm md:text-base">
                                {hearing.case.courtNumber}
                              </p>
                            </div>
                          )}

                          {hearing.itemNumber && (
                            <div>
                              <p className="text-xs md:text-sm text-slate-500">Item No.</p>
                              <p className="font-medium text-slate-900 text-sm md:text-base">
                                {hearing.itemNumber}
                              </p>
                            </div>
                          )}

                          <div>
                            <p className="text-xs md:text-sm text-slate-500">Time</p>
                            <p className="font-medium text-slate-900 text-sm md:text-base">
                              {format(parseISO(hearing.hearingDate), 'h:mm a')}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
