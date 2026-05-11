'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Calendar, Clock, Building2, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react'
import { format, parseISO } from 'date-fns'

type HearingWithCase = {
  id: string
  hearingDate: string
  itemNumber: string | null
  case: {
    id: string
    caseNumber: string
    status: string
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

export default function DashboardPageClient() {
  const { user, loading } = useAuth()
  const [todaysHearings, setTodaysHearings] = useState<HearingWithCase[]>([])
  const [weekHearings, setWeekHearings] = useState<HearingWithCase[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAllToday, setShowAllToday] = useState(false)
  const [showAllWeek, setShowAllWeek] = useState(false)

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user?.email) return

      try {
        const response = await fetch(`/api/dashboard?email=${encodeURIComponent(user.email)}`)

        if (response.ok) {
          const data = await response.json()
          setTodaysHearings(data.todaysHearings || [])
          setWeekHearings(data.weekHearings || [])
        } else {
          const errorData = await response.json()
          setError(errorData.error || 'Failed to load dashboard')
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setError('Failed to load dashboard')
      } finally {
        setLoadingData(false)
      }
    }

    if (!loading && user) {
      fetchDashboardData()
    }
  }, [user, loading])

  if (loading || loadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-600">Loading dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Determine how many to show
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const todayLimit = isMobile ? 3 : 10
  const weekLimit = isMobile ? 3 : 10

  const displayedTodayHearings = showAllToday
    ? todaysHearings
    : todaysHearings.slice(0, todayLimit)

  const displayedWeekHearings = showAllWeek
    ? weekHearings
    : weekHearings.slice(0, weekLimit)

  const getClientName = (hearing: HearingWithCase) => {
    if (hearing.case.client) {
      return `${hearing.case.client.firstName} ${hearing.case.client.lastName}`
    }
    return hearing.case.otherParties[0] || 'Unknown'
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Today's Schedule</h2>
          <p className="text-lg text-slate-600">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
      </div>

      {/* Today's Hearings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-semibold text-slate-900">Today's Hearings</h3>
          <Badge variant="secondary" className="text-base px-3 py-1">
            {todaysHearings.length} hearing{todaysHearings.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {todaysHearings.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-slate-400" />
              <p className="text-lg text-slate-600">No hearings today</p>
              <p className="text-base text-slate-500 mt-2">Enjoy your day!</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4">
              {displayedTodayHearings.map((hearing) => (
                <Link key={hearing.id} href={`/cases/${hearing.case.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="text-xl font-semibold text-slate-900 mb-1">
                            {hearing.case.caseNumber}
                          </h4>
                          <p className="text-base text-slate-600">
                            {getClientName(hearing)} vs {hearing.case.opponentMainParty}
                          </p>
                        </div>
                        <Badge variant={hearing.case.status === 'ACTIVE' ? 'default' : 'secondary'}>
                          {hearing.case.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-base">
                        <div className="flex items-start gap-2">
                          <Building2 className="h-5 w-5 text-slate-400 mt-0.5" />
                          <div>
                            <p className="text-sm text-slate-500">Court</p>
                            <p className="font-medium text-slate-900">
                              {hearing.case.court?.name || 'Not specified'}
                            </p>
                          </div>
                        </div>

                        {hearing.case.courtNumber && (
                          <div className="flex items-start gap-2">
                            <Clock className="h-5 w-5 text-slate-400 mt-0.5" />
                            <div>
                              <p className="text-sm text-slate-500">Court No.</p>
                              <p className="font-medium text-slate-900">{hearing.case.courtNumber}</p>
                            </div>
                          </div>
                        )}

                        {hearing.itemNumber && (
                          <div>
                            <p className="text-sm text-slate-500">Item No.</p>
                            <p className="font-medium text-slate-900">{hearing.itemNumber}</p>
                          </div>
                        )}

                        <div>
                          <p className="text-sm text-slate-500">Time</p>
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

            {todaysHearings.length > todayLimit && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => setShowAllToday(!showAllToday)}
                  className="gap-2"
                >
                  {showAllToday ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Show All ({todaysHearings.length - todayLimit} more)
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* This Week */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-semibold text-slate-900">Your Week</h3>
          <Badge variant="secondary" className="text-base px-3 py-1">
            {weekHearings.length} upcoming
          </Badge>
        </div>

        {weekHearings.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-slate-400" />
              <p className="text-lg text-slate-600">No upcoming hearings this week</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {displayedWeekHearings.map((hearing) => (
                <Link key={hearing.id} href={`/cases/${hearing.case.id}`}>
                  <Card className="hover:bg-slate-50 transition-colors cursor-pointer">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-lg font-semibold text-slate-900 truncate">
                            {hearing.case.caseNumber}
                          </p>
                          <p className="text-base text-slate-600 truncate">
                            {getClientName(hearing)} vs {hearing.case.opponentMainParty}
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-base font-medium text-slate-900">
                              {format(parseISO(hearing.hearingDate), 'MMM d')}
                            </p>
                            <p className="text-sm text-slate-500">
                              {format(parseISO(hearing.hearingDate), 'EEEE')}
                            </p>
                          </div>

                          <div className="text-right min-w-[120px]">
                            <p className="text-sm text-slate-500">Court</p>
                            <p className="text-base font-medium text-slate-900">
                              {hearing.case.court?.name || 'Not specified'}
                            </p>
                          </div>

                          <Badge variant={hearing.case.status === 'ACTIVE' ? 'default' : 'secondary'}>
                            {hearing.case.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {weekHearings.length > weekLimit && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => setShowAllWeek(!showAllWeek)}
                  className="gap-2"
                >
                  {showAllWeek ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Show All ({weekHearings.length - weekLimit} more)
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
