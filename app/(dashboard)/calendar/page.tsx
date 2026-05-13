'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react'
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
  const selectedDateDetailsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchMonthHearings()
  }, [user, currentMonth])

  useEffect(() => {
    // Scroll to selected date details when a date is selected
    if (selectedDate && selectedDateDetailsRef.current) {
      setTimeout(() => {
        selectedDateDetailsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }, 100)
    }
  }, [selectedDate])

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
          <button
            key={currentDay.toString()}
            onClick={() => setSelectedDate(currentDay)}
            className={`
              aspect-square p-1 md:p-2 transition-all relative
              ${!isCurrentMonth ? 'bg-slate-50/50' : 'bg-white hover:bg-slate-50'}
              ${isTodayDate ? 'ring-2 ring-slate-900 ring-inset' : ''}
              ${isSelected ? 'bg-slate-100' : ''}
            `}
          >
            <div className="flex flex-col items-center justify-center h-full">
              {/* Date number */}
              <span
                className={`
                  text-sm md:text-base font-semibold
                  ${!isCurrentMonth ? 'text-slate-300' : 'text-slate-900'}
                  ${isTodayDate ? 'bg-slate-900 text-white rounded-full w-7 h-7 md:w-8 md:h-8 flex items-center justify-center' : ''}
                `}
              >
                {format(currentDay, 'd')}
              </span>

              {/* Hearing indicators */}
              {dayHearings.length > 0 && (
                <div className="flex gap-0.5 mt-1">
                  {dayHearings.slice(0, 3).map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full ${
                        isTodayDate ? 'bg-white' : 'bg-slate-900'
                      }`}
                    ></div>
                  ))}
                </div>
              )}

              {/* Hearing count badge for desktop */}
              {dayHearings.length > 0 && (
                <span className="hidden md:block absolute top-1 right-1 text-xs bg-slate-900 text-white rounded-full w-5 h-5 flex items-center justify-center">
                  {dayHearings.length}
                </span>
              )}
            </div>
          </button>
        )

        day = addDays(day, 1)
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7 border-b border-slate-200 last:border-b-0">
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
    <div className="space-y-4 md:space-y-6 max-w-6xl px-4 md:px-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Calendar</h1>
          <p className="text-sm md:text-base text-slate-600 mt-1">
            {hearings.length} {hearings.length === 1 ? 'hearing' : 'hearings'} this month
          </p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-200 bg-slate-50">
            <h3 className="text-lg md:text-xl font-bold text-slate-900">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                className="h-8 md:h-9 text-xs md:text-sm"
              >
                <CalendarIcon className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-2" />
                <span className="hidden md:inline">Today</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={previousMonth}
                className="h-8 w-8 md:h-9 md:w-9"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={nextMonth}
                className="h-8 w-8 md:h-9 md:w-9"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
              <div
                key={day}
                className="text-center text-xs md:text-sm font-semibold text-slate-600 py-2 md:py-3"
              >
                <span className="hidden md:inline">{day}</span>
                <span className="md:hidden">{['S', 'M', 'T', 'W', 'T', 'F', 'S'][index]}</span>
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div>{renderCalendarDays()}</div>
        </CardContent>
      </Card>

      {/* Selected Date Details */}
      {selectedDate && (
        <Card ref={selectedDateDetailsRef} className="border-slate-200 scroll-mt-4">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base md:text-xl font-bold text-slate-900">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </h3>
              <Badge className="bg-slate-900 text-white text-sm px-3 py-1">
                {selectedDateHearings.length} {selectedDateHearings.length === 1 ? 'hearing' : 'hearings'}
              </Badge>
            </div>

            {selectedDateHearings.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p className="text-slate-500">No hearings scheduled for this date</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateHearings.map((hearing) => (
                  <Link key={hearing.id} href={`/cases/${hearing.case.id}`}>
                    <Card className="border-l-4 border-l-slate-900 hover:shadow-md transition-all cursor-pointer group">
                      <CardContent className="p-3 md:p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-base md:text-lg font-semibold text-slate-900 group-hover:text-slate-700">
                              {hearing.case.caseNumber}
                            </h4>
                            <p className="text-sm md:text-base text-slate-600 truncate">
                              {getClientName(hearing)} <span className="text-slate-400">vs</span> {hearing.case.opponentMainParty}
                            </p>
                          </div>
                          <Clock className="h-5 w-5 text-slate-400 flex-shrink-0 ml-2" />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
                          {hearing.case.court && (
                            <div>
                              <p className="text-xs text-slate-500">Court</p>
                              <p className="font-medium text-slate-900 truncate">
                                {hearing.case.court.name}
                              </p>
                            </div>
                          )}

                          {hearing.case.courtNumber && (
                            <div>
                              <p className="text-xs text-slate-500">Court No.</p>
                              <p className="font-medium text-slate-900">
                                {hearing.case.courtNumber}
                              </p>
                            </div>
                          )}

                          {hearing.itemNumber && (
                            <div>
                              <p className="text-xs text-slate-500">Item No.</p>
                              <p className="font-medium text-slate-900">
                                {hearing.itemNumber}
                              </p>
                            </div>
                          )}

                          <div>
                            <p className="text-xs text-slate-500">Time</p>
                            <p className="font-medium text-slate-900">
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
