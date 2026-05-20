'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, User, Briefcase, Building2, FileText } from 'lucide-react'
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
    status: string
    client: {
      firstName: string
      lastName: string
    } | null
    otherParties: string[]
    opponentMainParty: string
    court: {
      name: string
    } | null
    caseType: {
      name: string
    } | null
    _count: {
      hearings: number
      documents: number
    }
  }
}

type AppointmentEvent = {
  id: string
  title: string
  startTime: string
  endTime: string | null
  location: string | null
  client: {
    id: string
    firstName: string
    lastName: string
  } | null
}

type ViewMode = 'month' | 'week' | 'day'

const statusColors = {
  ACTIVE: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0',
  PENDING: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0',
  CLOSED: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0',
  ARCHIVED: 'bg-gradient-to-r from-gray-400 to-gray-500 text-white border-0',
}

export default function CalendarPage() {
  const { user } = useAuth()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [hearings, setHearings] = useState<HearingEvent[]>([])
  const [appointments, setAppointments] = useState<AppointmentEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const todaySectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchMonthHearings()
  }, [user, currentMonth])

  useEffect(() => {
    // Scroll to TODAY section when a date is selected
    if (selectedDate && todaySectionRef.current) {
      setTimeout(() => {
        todaySectionRef.current?.scrollIntoView({
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
      // Fetch data for a wider range to cover week/day views
      const monthStart = startOfMonth(currentMonth)
      const monthEnd = endOfMonth(currentMonth)

      // Extend range to cover the full calendar grid (includes prev/next month days)
      const calendarStart = startOfWeek(monthStart)
      const calendarEnd = endOfWeek(monthEnd)

      const response = await fetch(
        `/api/calendar/hearings?email=${encodeURIComponent(user.email)}&start=${calendarStart.toISOString()}&end=${calendarEnd.toISOString()}`
      )

      if (response.ok) {
        const data = await response.json()
        setHearings(data.hearings || [])
        setAppointments(data.appointments || [])
      }
    } catch (err) {
      console.error('Error fetching hearings:', err)
    } finally {
      setLoading(false)
    }
  }

  function previousMonth() {
    if (viewMode === 'day') {
      const newDate = addDays(currentMonth, -1)
      setCurrentMonth(newDate)
      setSelectedDate(newDate)
    } else if (viewMode === 'week') {
      setCurrentMonth(addDays(currentMonth, -7))
    } else {
      setCurrentMonth(subMonths(currentMonth, 1))
    }
  }

  function nextMonth() {
    if (viewMode === 'day') {
      const newDate = addDays(currentMonth, 1)
      setCurrentMonth(newDate)
      setSelectedDate(newDate)
    } else if (viewMode === 'week') {
      setCurrentMonth(addDays(currentMonth, 7))
    } else {
      setCurrentMonth(addMonths(currentMonth, 1))
    }
  }

  function goToToday() {
    const today = new Date()
    setCurrentMonth(today)
    setSelectedDate(today)
  }

  function getHearingsForDate(date: Date) {
    return hearings.filter((hearing) =>
      isSameDay(parseISO(hearing.hearingDate), date)
    )
  }

  function getAppointmentsForDate(date: Date) {
    return appointments.filter((appointment) =>
      isSameDay(parseISO(appointment.startTime), date)
    )
  }

  function hasEventsOnDate(date: Date) {
    return getHearingsForDate(date).length > 0 || getAppointmentsForDate(date).length > 0
  }

  function renderCalendarDays() {
    let startDate: Date
    let endDate: Date

    if (viewMode === 'day') {
      // Show only the selected day or currentMonth
      const targetDay = selectedDate || currentMonth
      startDate = targetDay
      endDate = targetDay
    } else if (viewMode === 'week') {
      // Show the week containing currentMonth
      startDate = startOfWeek(currentMonth)
      endDate = endOfWeek(currentMonth)
    } else {
      // Month view
      const monthStart = startOfMonth(currentMonth)
      const monthEnd = endOfMonth(currentMonth)
      startDate = startOfWeek(monthStart)
      endDate = endOfWeek(monthEnd)
    }

    const rows = []
    let days = []
    let day = startDate

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        if (day > endDate) break

        const currentDay = day
        const hasEvents = hasEventsOnDate(currentDay)
        const isCurrentMonth = isSameMonth(currentDay, currentMonth)
        const isTodayDate = isToday(currentDay)
        const isSelected = selectedDate && isSameDay(currentDay, selectedDate)

        days.push(
          <button
            key={currentDay.toString()}
            onClick={() => setSelectedDate(currentDay)}
            className={`
              aspect-square p-2 md:p-3 transition-all relative border-r border-b border-slate-100 hover:bg-slate-50/50
              ${viewMode === 'month' && !isCurrentMonth ? 'text-slate-300' : 'text-slate-900'}
              ${isSelected ? 'bg-purple-50 border-purple-200' : ''}
            `}
          >
            <div className="flex flex-col items-center justify-start h-full">
              {/* Date number */}
              <span
                className={`
                  text-sm md:text-base font-medium mb-1
                  ${isTodayDate ? 'bg-slate-900 text-white rounded-full w-6 h-6 md:w-7 md:h-7 flex items-center justify-center' : ''}
                `}
              >
                {format(currentDay, 'd')}
              </span>

              {/* Event indicator - underline style */}
              {hasEvents && (
                <div className="w-full flex justify-center mt-auto pb-1">
                  <div className="w-8 h-0.5 bg-purple-600 rounded-full"></div>
                </div>
              )}
            </div>
          </button>
        )

        day = addDays(day, 1)

        // For day view, only show one day
        if (viewMode === 'day') break
      }

      rows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {days}
        </div>
      )
      days = []

      // For day view, only one row
      if (viewMode === 'day') break
    }

    return rows
  }

  const selectedDateHearings = selectedDate ? getHearingsForDate(selectedDate) : []
  const selectedDateAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : []
  const todayHearings = getHearingsForDate(new Date())
  const todayAppointments = getAppointmentsForDate(new Date())

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
      {/* Modern Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 uppercase tracking-tight">
            {viewMode === 'day'
              ? format(selectedDate || currentMonth, 'd MMM yyyy')
              : viewMode === 'week'
              ? `${format(startOfWeek(currentMonth), 'd MMM')} - ${format(endOfWeek(currentMonth), 'd MMM yyyy')}`
              : format(currentMonth, 'MMM yyyy')}
          </h1>
          <p className="text-sm md:text-base text-slate-600 mt-2">
            {viewMode === 'month'
              ? `${hearings.length} ${hearings.length === 1 ? 'hearing' : 'hearings'}${appointments.length > 0 ? `, ${appointments.length} ${appointments.length === 1 ? 'appointment' : 'appointments'}` : ''}`
              : viewMode === 'week'
              ? `Week ${format(currentMonth, 'w')}`
              : format(selectedDate || new Date(), 'EEEE')}
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 rounded-lg p-1">
            {(['month', 'week', 'day'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all uppercase ${
                  viewMode === mode
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Card className="overflow-hidden border-0 shadow-sm">
        <CardContent className="p-0">
          {/* Calendar Navigation */}
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToToday}
              className="h-9 text-sm font-medium"
            >
              Today
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={previousMonth}
                className="h-9 w-9"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={nextMonth}
                className="h-9 w-9"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b border-slate-100">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-slate-500 py-3 uppercase tracking-wide"
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

      {/* TODAY Section */}
      <Card ref={todaySectionRef} className="border-0 shadow-sm scroll-mt-4">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 uppercase tracking-tight">
              {selectedDate ? format(selectedDate, 'EEEE, d MMM') : 'TODAY'}
            </h2>
            {((selectedDate ? selectedDateHearings.length + selectedDateAppointments.length : todayHearings.length + todayAppointments.length) > 0) && (
              <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-sm px-3 py-1">
                {selectedDate ? selectedDateHearings.length + selectedDateAppointments.length : todayHearings.length + todayAppointments.length} scheduled
              </Badge>
            )}
          </div>

          {(selectedDate ? (selectedDateHearings.length + selectedDateAppointments.length) : (todayHearings.length + todayAppointments.length)) === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500">No events scheduled</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Hearings */}
              {(selectedDate ? selectedDateHearings : todayHearings).map((hearing) => (
                <Link key={hearing.id} href={`/cases/${hearing.case.id}`}>
                  <Card className="hover:shadow-xl hover:border-purple-200 transition-all duration-200 cursor-pointer group border-slate-200 bg-gradient-to-br from-white to-slate-50/50">
                    <CardHeader className="pb-3 md:pb-4">
                      {/* Time Block - Mobile Only */}
                      <div className="flex md:hidden items-center gap-2 mb-3 bg-purple-50 px-3 py-2 rounded-lg w-fit">
                        <Clock className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-semibold text-purple-700">
                          {format(parseISO(hearing.hearingDate), 'h:mm a')}
                        </span>
                      </div>

                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center flex-shrink-0 shadow-sm">
                              <Briefcase className="h-4 w-4 md:h-5 md:w-5 text-white" />
                            </div>
                            <h4 className="text-base md:text-lg font-bold text-slate-900 group-hover:text-purple-700 transition-colors truncate">
                              {hearing.case.caseNumber}
                            </h4>
                            <Badge className={`${statusColors[hearing.case.status as keyof typeof statusColors]} text-xs font-semibold px-3 py-1 shadow-sm`}>
                              {hearing.case.status}
                            </Badge>
                          </div>

                          <div className="space-y-1.5 mt-1">
                            <div className="flex items-center gap-2 text-sm md:text-base">
                              <span className="font-medium text-slate-700">{getClientName(hearing)}</span>
                              <span className="text-slate-400 font-normal">vs</span>
                              <span className="font-medium text-slate-700 truncate">{hearing.case.opponentMainParty}</span>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap text-sm">
                              {hearing.case.court && (
                                <div className="flex items-center gap-1.5 text-slate-600">
                                  <Building2 className="h-4 w-4 text-slate-400" />
                                  <span>{hearing.case.court.name}</span>
                                  {hearing.case.courtNumber && (
                                    <>
                                      <span className="text-slate-300">•</span>
                                      <span>Court {hearing.case.courtNumber}</span>
                                    </>
                                  )}
                                </div>
                              )}
                              {hearing.itemNumber && (
                                <Badge variant="outline" className="text-xs">
                                  Item #{hearing.itemNumber}
                                </Badge>
                              )}
                              {hearing.case.caseType && (
                                <Badge variant="outline" className="text-xs">
                                  {hearing.case.caseType.name}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer with Time and Counts */}
                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200">
                        {/* Time - Desktop Only */}
                        <div className="hidden md:flex items-center gap-2 text-sm bg-purple-50 px-3 py-1.5 rounded-lg">
                          <Clock className="h-4 w-4 text-purple-600" />
                          <span className="text-xs font-medium text-purple-600">Time:</span>
                          <span className="font-semibold text-purple-700">
                            {format(parseISO(hearing.hearingDate), 'h:mm a')}
                          </span>
                        </div>

                        {/* Spacer for mobile */}
                        <div className="md:hidden"></div>

                        {/* Counts */}
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-base md:text-lg font-bold text-purple-600">{hearing.case._count.hearings}</p>
                            <p className="text-xs text-slate-500 font-medium">Hearings</p>
                          </div>
                          <div className="w-px h-10 bg-slate-200"></div>
                          <div className="text-center">
                            <p className="text-base md:text-lg font-bold text-purple-600">{hearing.case._count.documents}</p>
                            <p className="text-xs text-slate-500 font-medium">Docs</p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              ))}

              {/* Appointments */}
              {(selectedDate ? selectedDateAppointments : todayAppointments).map((appointment) => (
                <Link key={appointment.id} href={`/appointments/${appointment.id}`}>
                  <Card className="border border-green-200 hover:shadow-md hover:border-green-300 transition-all cursor-pointer group bg-green-50/30">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Time Block */}
                        <div className="flex flex-col items-center justify-center bg-green-100 rounded-lg px-3 py-2 min-w-[80px]">
                          <Clock className="h-4 w-4 text-green-600 mb-1" />
                          <span className="text-sm font-semibold text-green-900">
                            {format(parseISO(appointment.startTime), 'h:mm a')}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base md:text-lg font-semibold text-slate-900 group-hover:text-green-700 transition-colors mb-1">
                            {appointment.title}
                          </h4>
                          {appointment.client && (
                            <p className="text-sm text-slate-600 mb-2 truncate">
                              {appointment.client.firstName} {appointment.client.lastName}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                            {appointment.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {appointment.location}
                              </span>
                            )}
                            {appointment.endTime && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Until {format(parseISO(appointment.endTime), 'h:mm a')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status Indicator */}
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 rounded-full bg-green-600"></div>
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
    </div>
  )
}
