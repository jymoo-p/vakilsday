'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Calendar, FileText, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

interface Case {
  id: string
  caseNumber: string
  appearingFor: string
  courtNumber: string | null
  status: string
  nextHearingDate: string | null
  otherParties: string[]
  opponentMainParty: string
  client: {
    id: string
    firstName: string
    lastName: string
  } | null
  court: {
    id: string
    name: string
  } | null
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
  ACTIVE: 'bg-green-100 text-green-700 border-green-200',
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  CLOSED: 'bg-blue-100 text-blue-700 border-blue-200',
  ARCHIVED: 'bg-gray-100 text-gray-600 border-gray-200',
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

  const getClientName = (caseItem: Case) => {
    if (caseItem.client) {
      return `${caseItem.client.firstName} ${caseItem.client.lastName}`
    }
    return caseItem.otherParties[0] || 'Unknown'
  }

  const filteredCases = cases.filter((c) => {
    const clientName = getClientName(c)
    const matchesSearch =
      c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.opponentMainParty.toLowerCase().includes(searchQuery.toLowerCase())

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
    <div className="space-y-4 md:space-y-6 max-w-7xl px-4 md:px-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Cases</h1>
          <p className="text-sm md:text-base text-slate-600 mt-1">
            {filteredCases.length} {filteredCases.length === 1 ? 'case' : 'cases'}
          </p>
        </div>
        {canCreateCase && (
          <Link href="/cases/new">
            <Button className="gap-2 h-9 md:h-10 text-sm md:text-base">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Case</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 md:left-4 top-1/2 h-4 w-4 md:h-5 md:w-5 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search cases..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 md:pl-12 h-10 md:h-11 text-sm md:text-base border-slate-300 focus:border-slate-900 focus:ring-slate-900"
        />
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-200 -mx-4 px-4 md:mx-0 md:px-0">
        {statusTabs.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-medium text-xs md:text-sm whitespace-nowrap transition-all ${
              statusFilter === status
                ? 'bg-primary text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {status}
            <span
              className={`ml-1.5 md:ml-2 px-1.5 md:px-2 py-0.5 rounded-full text-xs ${
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
              <div key={i} className="h-20 md:h-20 bg-slate-200 rounded-lg" />
            ))}
          </div>
        </div>
      ) : filteredCases.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="pt-8 pb-8 md:pt-12 md:pb-12 text-center">
            <div className="p-3 md:p-4 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full w-fit mx-auto mb-3 md:mb-4">
              <FileText className="h-8 w-8 md:h-12 md:w-12 text-primary" />
            </div>
            <p className="text-base md:text-lg font-medium text-slate-900">No cases found</p>
            <p className="text-sm md:text-base text-slate-600 mt-1">
              {searchQuery || statusFilter !== 'All'
                ? 'Try adjusting your filters'
                : 'Create your first case to get started'}
            </p>
            {canCreateCase && !searchQuery && statusFilter === 'All' && (
              <Link href="/cases/new">
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  New Case
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredCases.map((caseItem) => (
            <Link key={caseItem.id} href={`/cases/${caseItem.id}`}>
              <Card className="hover:shadow-lg hover:scale-[1.01] transition-all duration-200 cursor-pointer group border-slate-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-base truncate group-hover:text-primary transition-colors">
                          {caseItem.caseNumber}
                        </CardTitle>
                        <Badge className={`${statusColors[caseItem.status as keyof typeof statusColors]} text-xs font-medium px-2 py-0.5 border`}>
                          {caseItem.status}
                        </Badge>
                      </div>
                      <div className="space-y-1 mt-1">
                        <div className="flex items-center gap-1.5 text-sm">
                          <span className="font-medium text-primary">{getClientName(caseItem)}</span>
                          <span className="text-slate-400">vs</span>
                          <span className="font-medium text-primary">{caseItem.opponentMainParty}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <span>{caseItem.court?.name || 'Not assigned'}</span>
                          {caseItem.courtNumber && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span>Court {caseItem.courtNumber}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                  </div>
                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-sm">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs text-slate-500">Next:</span>
                      <span className="font-medium text-slate-900">
                        {caseItem.nextHearingDate
                          ? format(new Date(caseItem.nextHearingDate), 'MMM d, yyyy')
                          : 'Not scheduled'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <p className="text-base font-bold text-primary">{caseItem._count.hearings}</p>
                        <p className="text-xs text-slate-500">Hearings</p>
                      </div>
                      <div className="w-px h-8 bg-slate-200"></div>
                      <div className="text-center">
                        <p className="text-base font-bold text-primary">{caseItem._count.documents}</p>
                        <p className="text-xs text-slate-500">Docs</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
