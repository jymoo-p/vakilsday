'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Calendar, Clock, Building2, Plus, TrendingUp, FileText } from 'lucide-react'
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

const statusColors = {
  ACTIVE: 'bg-slate-100 text-slate-700 border-slate-300',
  PENDING: 'bg-slate-100 text-slate-700 border-slate-300',
  CLOSED: 'bg-slate-50 text-slate-600 border-slate-200',
  ARCHIVED: 'bg-slate-50 text-slate-600 border-slate-200',
}

const statusBorderColors = {
  ACTIVE: 'border-l-slate-900',
  PENDING: 'border-l-slate-600',
  CLOSED: 'border-l-slate-400',
  ARCHIVED: 'border-l-slate-300',
}

export default function DashboardPageClient() {
  const { user, loading } = useAuth()
  const [todaysHearings, setTodaysHearings] = useState<HearingWithCase[]>([])
  const [weekHearings, setWeekHearings] = useState<HearingWithCase[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'today' | 'week'>('today')

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
        <div className="animate-pulse space-y-4 w-full max-w-2xl">
          <div className="h-32 bg-slate-200 rounded-xl"></div>
          <div className="h-48 bg-slate-200 rounded-xl"></div>
          <div className="h-48 bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <p className="text-red-600 text-lg">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getClientName = (hearing: HearingWithCase) => {
    if (hearing.case.client) {
      return `${hearing.case.client.firstName} ${hearing.case.client.lastName}`
    }
    return hearing.case.otherParties[0] || 'Unknown'
  }

  const displayedHearings = activeTab === 'today' ? todaysHearings : weekHearings
  const uniqueActiveCases = new Set([...todaysHearings, ...weekHearings].map(h => h.case.id)).size

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-600">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <Link href="/cases/new">
          <Button className="gap-2 bg-slate-900 hover:bg-slate-800">
            <Plus className="h-4 w-4" />
            New Case
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setActiveTab('today')}
          className="text-left transition-all hover:scale-[1.02]"
        >
          <Card className="border-0 bg-slate-900 text-white shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm font-medium">Today</p>
                  <p className="text-3xl font-bold mt-1">{todaysHearings.length}</p>
                  <p className="text-slate-300 text-sm mt-1">hearings</p>
                </div>
                <div className="p-3 bg-white/10 rounded-xl">
                  <Calendar className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        </button>

        <button
          onClick={() => setActiveTab('week')}
          className="text-left transition-all hover:scale-[1.02]"
        >
          <Card className="border-0 bg-slate-800 text-white shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm font-medium">This Week</p>
                  <p className="text-3xl font-bold mt-1">{weekHearings.length}</p>
                  <p className="text-slate-300 text-sm mt-1">upcoming</p>
                </div>
                <div className="p-3 bg-white/10 rounded-xl">
                  <TrendingUp className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        </button>

        <Link href="/cases" className="transition-all hover:scale-[1.02]">
          <Card className="border-0 bg-slate-700 text-white shadow-lg hover:shadow-xl transition-shadow h-full">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm font-medium">Active Cases</p>
                  <p className="text-3xl font-bold mt-1">{uniqueActiveCases}</p>
                  <p className="text-slate-300 text-sm mt-1">in progress</p>
                </div>
                <div className="p-3 bg-white/10 rounded-xl">
                  <FileText className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('today')}
          className={`px-6 py-3 font-medium text-sm transition-colors relative ${
            activeTab === 'today'
              ? 'text-slate-900'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Today
          {activeTab === 'today' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('week')}
          className={`px-6 py-3 font-medium text-sm transition-colors relative ${
            activeTab === 'week'
              ? 'text-slate-900'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          This Week
          {activeTab === 'week' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
          )}
        </button>
      </div>

      {/* Hearings List */}
      <div className="space-y-3">
        {displayedHearings.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="p-4 bg-slate-100 rounded-full w-fit mx-auto mb-4">
                <Calendar className="h-12 w-12 text-slate-400" />
              </div>
              <p className="text-lg font-medium text-slate-900">
                No hearings {activeTab === 'today' ? 'today' : 'this week'}
              </p>
              <p className="text-slate-600 mt-1">
                {activeTab === 'today' ? 'Enjoy your day!' : 'Your schedule is clear'}
              </p>
            </CardContent>
          </Card>
        ) : (
          displayedHearings.map((hearing) => (
            <Link key={hearing.id} href={`/cases/${hearing.case.id}`}>
              <Card
                className={`border-l-4 ${statusBorderColors[hearing.case.status as keyof typeof statusBorderColors]} hover:shadow-md transition-all duration-200 cursor-pointer group`}
              >
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Case Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900 group-hover:text-slate-700 transition-colors">
                          {hearing.case.caseNumber}
                        </h3>
                        <Badge
                          className={`${statusColors[hearing.case.status as keyof typeof statusColors]} text-xs font-medium px-2 py-0.5 border`}
                        >
                          {hearing.case.status}
                        </Badge>
                      </div>

                      <p className="text-sm text-slate-600 mb-3">
                        {getClientName(hearing)} <span className="text-slate-400">vs</span> {hearing.case.opponentMainParty}
                      </p>

                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Building2 className="h-4 w-4 text-slate-400" />
                          <span>{hearing.case.court?.name || 'Court not specified'}</span>
                        </div>

                        {hearing.case.courtNumber && (
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <span className="text-slate-400">Court</span>
                            <span className="font-medium">{hearing.case.courtNumber}</span>
                          </div>
                        )}

                        {hearing.itemNumber && (
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <span className="text-slate-400">Item</span>
                            <span className="font-medium">{hearing.itemNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Date/Time */}
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <p className="text-lg font-semibold text-slate-900">
                          {format(parseISO(hearing.hearingDate), 'MMM d')}
                        </p>
                        <p className="text-sm text-slate-500">
                          {format(parseISO(hearing.hearingDate), 'EEEE')}
                        </p>
                      </div>
                      <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors">
                        <Clock className="h-5 w-5 text-slate-600" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
