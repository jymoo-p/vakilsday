'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Calendar, FileText, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

interface Case {
  id: string
  caseNumber: string
  courtName: string
  courtNumber: string | null
  petitionerName: string
  respondentName: string
  status: string
  nextHearingDate: string | null
  assignments: Array<{
    user: {
      name: string
      role: string
    }
  }>
  _count: {
    hearings: number
    documents: number
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

export default function CasesPage() {
  const { user } = useAuth()
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [userRole, setUserRole] = useState<string>('ASSOCIATE')

  useEffect(() => {
    async function fetchUserData() {
      if (user?.email) {
        const response = await fetch(`/api/users/${encodeURIComponent(user.email)}`)
        if (response.ok) {
          const data = await response.json()
          setUserRole(data.user?.role || 'ASSOCIATE')
        }
      }
    }
    fetchUserData()
    fetchCases()
  }, [user])

  const fetchCases = async () => {
    if (!user?.email) return

    try {
      const res = await fetch(`/api/cases?email=${encodeURIComponent(user.email)}`)
      const data = await res.json()
      setCases(data.cases || [])
    } catch (error) {
      console.error('Error fetching cases:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.petitionerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.respondentName.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'All' || c.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const canCreateCase = userRole !== 'CLERK'

  const statusTabs = ['All', 'ACTIVE', 'PENDING', 'CLOSED', 'ARCHIVED']
  const statusCounts = {
    All: cases.length,
    ACTIVE: cases.filter((c) => c.status === 'ACTIVE').length,
    PENDING: cases.filter((c) => c.status === 'PENDING').length,
    CLOSED: cases.filter((c) => c.status === 'CLOSED').length,
    ARCHIVED: cases.filter((c) => c.status === 'ARCHIVED').length,
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Cases</h1>
          <p className="text-slate-600 mt-1">
            {filteredCases.length} {filteredCases.length === 1 ? 'case' : 'cases'}
          </p>
        </div>
        {canCreateCase && (
          <Link href="/cases/new">
            <Button className="gap-2 bg-slate-900 hover:bg-slate-800">
              <Plus className="h-4 w-4" />
              New Case
            </Button>
          </Link>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search cases by number, petitioner, or respondent..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 h-11 text-base border-slate-300 focus:border-slate-900 focus:ring-slate-900"
        />
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        {statusTabs.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
              statusFilter === status
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {status}
            <span
              className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                statusFilter === status
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {statusCounts[status as keyof typeof statusCounts]}
            </span>
          </button>
        ))}
      </div>

      {/* Cases List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse space-y-3 w-full">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-200 rounded-lg" />
            ))}
          </div>
        </div>
      ) : filteredCases.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="p-4 bg-slate-100 rounded-full w-fit mx-auto mb-4">
              <FileText className="h-12 w-12 text-slate-400" />
            </div>
            <p className="text-lg font-medium text-slate-900">No cases found</p>
            <p className="text-slate-600 mt-1">
              {searchQuery || statusFilter !== 'All'
                ? 'Try adjusting your filters'
                : 'Create your first case to get started'}
            </p>
            {canCreateCase && !searchQuery && statusFilter === 'All' && (
              <Link href="/cases/new">
                <Button className="mt-4 bg-slate-900 hover:bg-slate-800">
                  <Plus className="h-4 w-4 mr-2" />
                  New Case
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredCases.map((caseItem) => (
            <Link key={caseItem.id} href={`/cases/${caseItem.id}`}>
              <Card
                className={`border-l-4 ${statusBorderColors[caseItem.status as keyof typeof statusBorderColors]} hover:shadow-md transition-all duration-200 cursor-pointer group`}
              >
                <CardContent className="py-4">
                  <div className="flex items-center justify-between gap-6">
                    {/* Left: Case Number & Status */}
                    <div className="flex items-center gap-4 min-w-0 flex-shrink-0 w-64">
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-slate-900 group-hover:text-slate-700 transition-colors truncate">
                          {caseItem.caseNumber}
                        </h3>
                        <Badge
                          className={`${statusColors[caseItem.status as keyof typeof statusColors]} text-xs font-medium px-2 py-0.5 border mt-1`}
                        >
                          {caseItem.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Middle: Parties & Court */}
                    <div className="flex-1 min-w-0">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="min-w-0">
                          <p className="text-xs text-slate-500 mb-0.5">Parties</p>
                          <p className="text-sm text-slate-900 font-medium truncate">
                            {caseItem.petitionerName} <span className="text-slate-400 font-normal">vs</span> {caseItem.respondentName}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-slate-500 mb-0.5">Court</p>
                          <p className="text-sm text-slate-900 font-medium truncate">
                            {caseItem.courtName}
                            {caseItem.courtNumber && (
                              <span className="text-slate-500 font-normal ml-1">
                                • Court {caseItem.courtNumber}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right: Next Hearing & Stats */}
                    <div className="flex items-center gap-6 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-slate-500 mb-0.5">Next Hearing</p>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {caseItem.nextHearingDate
                            ? format(new Date(caseItem.nextHearingDate), 'MMM d, yyyy')
                            : 'Not scheduled'}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 px-4 py-2 bg-slate-50 rounded-lg">
                        <div className="text-center">
                          <p className="text-lg font-bold text-slate-900">
                            {caseItem._count.hearings}
                          </p>
                          <p className="text-xs text-slate-500">Hearings</p>
                        </div>
                        <div className="w-px h-8 bg-slate-200"></div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-slate-900">
                            {caseItem._count.documents}
                          </p>
                          <p className="text-xs text-slate-500">Docs</p>
                        </div>
                      </div>

                      <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
