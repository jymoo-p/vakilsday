'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { Calendar, Clock, Building2, Plus, TrendingUp, FileText, Briefcase } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

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
  const router = useRouter()
  const [todaysHearings, setTodaysHearings] = useState<HearingWithCase[]>([])
  const [weekHearings, setWeekHearings] = useState<HearingWithCase[]>([])
  const [activeCasesCount, setActiveCasesCount] = useState(0)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'today' | 'week'>('today')
  const [showQuickCreateDialog, setShowQuickCreateDialog] = useState(false)
  const [creating, setCreating] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [quickCaseForm, setQuickCaseForm] = useState({
    caseNumber: '',
    clientId: '',
    opponentMainParty: '',
    appearingFor: 'PETITIONER' as 'PETITIONER' | 'RESPONDENT',
  })
  const [clientSearchQuery, setClientSearchQuery] = useState('')
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [showQuickClientDialog, setShowQuickClientDialog] = useState(false)
  const [quickClientName, setQuickClientName] = useState('')
  const [quickClientPhone, setQuickClientPhone] = useState('')
  const [isCreatingClient, setIsCreatingClient] = useState(false)

  function scrollToHearings() {
    const hearingsSection = document.getElementById('hearings-section')
    if (hearingsSection) {
      hearingsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleOpenQuickCreate = () => {
    fetchClients()
    setShowQuickCreateDialog(true)
  }

  const fetchClients = async () => {
    if (!user?.email) return
    try {
      const response = await fetch(`/api/clients?email=${encodeURIComponent(user.email)}`)
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || [])
      }
    } catch (err) {
      console.error('Error fetching clients:', err)
    }
  }

  const handleQuickCreateCase = async () => {
    if (!quickCaseForm.caseNumber || !quickCaseForm.opponentMainParty || !quickCaseForm.clientId) {
      toast.error('Please fill in all required fields')
      return
    }

    setCreating(true)
    try {
      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: user?.email,
          caseNumber: quickCaseForm.caseNumber,
          clientId: quickCaseForm.clientId || undefined,
          opponentMainParty: quickCaseForm.opponentMainParty,
          appearingFor: quickCaseForm.appearingFor,
          filingDate: new Date().toISOString().split('T')[0],
          status: 'ACTIVE',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create case')
      }

      const data = await response.json()
      toast.success('Case created successfully!')
      setShowQuickCreateDialog(false)
      setQuickCaseForm({
        caseNumber: '',
        clientId: '',
        opponentMainParty: '',
        appearingFor: 'PETITIONER',
      })
      setClientSearchQuery('')
      router.push(`/cases/${data.case.id}?newCase=true`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create case')
    } finally {
      setCreating(false)
    }
  }

  const handleQuickClientCreate = async () => {
    if (!quickClientName.trim() || !quickClientPhone.trim()) {
      toast.error('Please fill in client name and phone')
      return
    }

    setIsCreatingClient(true)
    try {
      const nameParts = quickClientName.trim().split(/\s+/)
      const firstName = nameParts[0]
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined

      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: user?.email,
          firstName,
          lastName,
          phone: quickClientPhone,
          gender: 'MALE',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create client')
      }

      const data = await response.json()
      const newClient = data.client
      toast.success('Client created successfully!')

      const fullName = lastName ? `${firstName} ${lastName}` : firstName
      setClientSearchQuery(fullName)
      setQuickCaseForm({ ...quickCaseForm, clientId: newClient.id })
      setClients([...clients, newClient])
      setShowQuickClientDialog(false)
      setQuickClientName('')
      setQuickClientPhone('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create client')
    } finally {
      setIsCreatingClient(false)
    }
  }

  const filteredClients = clients.filter((client) => {
    const fullName = `${client.firstName} ${client.lastName || ''}`.toLowerCase()
    return fullName.includes(clientSearchQuery.toLowerCase())
  })

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user?.email) return

      try {
        const response = await fetch(`/api/dashboard?email=${encodeURIComponent(user.email)}`)

        if (response.ok) {
          const data = await response.json()
          setTodaysHearings(data.todaysHearings || [])
          setWeekHearings(data.weekHearings || [])
          setActiveCasesCount(data.activeCasesCount || 0)
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

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-600">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <Button onClick={handleOpenQuickCreate} className="gap-2 bg-slate-900 hover:bg-slate-800">
          <Plus className="h-4 w-4" />
          Case
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => {
            setActiveTab('today')
            scrollToHearings()
          }}
          className="text-left transition-all hover:scale-[1.02]"
        >
          <Card className="border-0 bg-purple-700 text-white shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-200 text-sm font-medium">Today</p>
                  <p className="text-3xl font-bold mt-1">{todaysHearings.length}</p>
                  <p className="text-purple-200 text-sm mt-1">hearings</p>
                </div>
                <div className="p-3 bg-white/10 rounded-xl">
                  <Calendar className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        </button>

        <button
          onClick={() => {
            setActiveTab('week')
            scrollToHearings()
          }}
          className="text-left transition-all hover:scale-[1.02]"
        >
          <Card className="border-0 bg-purple-400 text-white shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">This Week</p>
                  <p className="text-3xl font-bold mt-1">{weekHearings.length}</p>
                  <p className="text-purple-100 text-sm mt-1">upcoming</p>
                </div>
                <div className="p-3 bg-white/10 rounded-xl">
                  <TrendingUp className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        </button>

        <Link href="/cases" className="transition-all hover:scale-[1.02]">
          <Card className="border-0 bg-blue-500 text-white shadow-lg hover:shadow-xl transition-shadow h-full">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Active Cases</p>
                  <p className="text-3xl font-bold mt-1">{activeCasesCount}</p>
                  <p className="text-blue-100 text-sm mt-1">in progress</p>
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
      <div id="hearings-section" className="flex gap-2 border-b border-slate-200">
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

      {/* Quick Case Creation Dialog */}
      <Dialog open={showQuickCreateDialog} onOpenChange={setShowQuickCreateDialog}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-[540px] rounded-xl sm:rounded-2xl max-h-[95vh] p-0 gap-0 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-4 sm:pt-6" style={{ maxHeight: 'calc(95vh - 80px)' }}>
            <DialogHeader className="space-y-2 sm:space-y-3">
              <div className="mx-auto w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <Briefcase className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-semibold text-center">New Case</DialogTitle>
              <DialogDescription className="text-center text-sm sm:text-base">
                Create case quickly. Add more details later.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 sm:space-y-5 py-3 sm:py-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="caseNumber" className="text-xs sm:text-sm font-medium text-slate-700">
                Case Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="caseNumber"
                value={quickCaseForm.caseNumber}
                onChange={(e) => setQuickCaseForm({ ...quickCaseForm, caseNumber: e.target.value })}
                placeholder="e.g., WP(C) 12345/2024"
                className="h-9 sm:h-11 text-sm sm:text-base"
              />
            </div>

            <div className="space-y-2 sm:space-y-3">
              <Label className="text-xs sm:text-sm font-medium text-slate-700">
                Appearing For <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <label className={`flex items-center justify-center gap-2 cursor-pointer rounded-lg border-2 p-2 sm:p-3 transition-all ${
                  quickCaseForm.appearingFor === 'PETITIONER'
                    ? 'border-purple-600 bg-purple-50 text-purple-900'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}>
                  <input
                    type="radio"
                    value="PETITIONER"
                    checked={quickCaseForm.appearingFor === 'PETITIONER'}
                    onChange={(e) => setQuickCaseForm({ ...quickCaseForm, appearingFor: e.target.value as 'PETITIONER' | 'RESPONDENT' })}
                    className="sr-only"
                  />
                  <span className="font-medium text-xs sm:text-sm">Petitioner</span>
                </label>
                <label className={`flex items-center justify-center gap-2 cursor-pointer rounded-lg border-2 p-2 sm:p-3 transition-all ${
                  quickCaseForm.appearingFor === 'RESPONDENT'
                    ? 'border-purple-600 bg-purple-50 text-purple-900'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}>
                  <input
                    type="radio"
                    value="RESPONDENT"
                    checked={quickCaseForm.appearingFor === 'RESPONDENT'}
                    onChange={(e) => setQuickCaseForm({ ...quickCaseForm, appearingFor: e.target.value as 'PETITIONER' | 'RESPONDENT' })}
                    className="sr-only"
                  />
                  <span className="font-medium text-xs sm:text-sm">Respondent</span>
                </label>
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="client" className="text-xs sm:text-sm font-medium text-slate-700">
                Client <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="client"
                  value={clientSearchQuery}
                  onChange={(e) => {
                    setClientSearchQuery(e.target.value)
                    setShowClientDropdown(true)
                  }}
                  onFocus={() => setShowClientDropdown(true)}
                  placeholder="Search or create client"
                  autoComplete="off"
                  className="h-9 sm:h-11 text-sm sm:text-base"
                />
                {showClientDropdown && clientSearchQuery && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg sm:rounded-xl shadow-lg max-h-48 sm:max-h-64 overflow-auto">
                    {filteredClients.length > 0 ? (
                      <>
                        {filteredClients.map((client) => (
                          <button
                            key={client.id}
                            type="button"
                            onClick={() => {
                              const fullName = client.lastName
                                ? `${client.firstName} ${client.lastName}`
                                : client.firstName
                              setClientSearchQuery(fullName)
                              setQuickCaseForm({ ...quickCaseForm, clientId: client.id })
                              setShowClientDropdown(false)
                            }}
                            className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 hover:bg-slate-50 text-xs sm:text-sm border-b border-slate-100 last:border-0 transition-colors"
                          >
                            {client.firstName} {client.lastName || ''}
                          </button>
                        ))}
                      </>
                    ) : (
                      <div className="p-4 sm:p-6 text-center">
                        <p className="text-xs sm:text-sm text-slate-600 mb-3 sm:mb-4">No matching clients found</p>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            setQuickClientName(clientSearchQuery)
                            setShowClientDropdown(false)
                            setShowQuickClientDialog(true)
                          }}
                          className="gap-2 bg-purple-600 hover:bg-purple-700 h-8 text-xs sm:h-9 sm:text-sm"
                        >
                          <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                          Create New Client
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="opponentMainParty" className="text-xs sm:text-sm font-medium text-slate-700">
                Opponent Main Party <span className="text-red-500">*</span>
              </Label>
              <Input
                id="opponentMainParty"
                value={quickCaseForm.opponentMainParty}
                onChange={(e) => setQuickCaseForm({ ...quickCaseForm, opponentMainParty: e.target.value })}
                placeholder="e.g., Union of India"
                className="h-9 sm:h-11 text-sm sm:text-base"
              />
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg sm:rounded-xl p-3 sm:p-4">
              <div className="flex gap-2 sm:gap-3">
                <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                  <span className="text-white text-base sm:text-lg">💡</span>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-blue-900 mb-0.5 sm:mb-1">Quick Entry Mode</p>
                  <p className="text-[10px] sm:text-xs text-blue-800 leading-relaxed">
                    After creating, you'll be redirected to add court details, hearings, documents, and more information.
                  </p>
                </div>
              </div>
            </div>
          </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-3 px-4 sm:px-6 pb-4 sm:pb-6 pt-3 sm:pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowQuickCreateDialog(false)}
              disabled={creating}
              className="flex-1 h-9 sm:h-10 text-xs sm:text-sm"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleQuickCreateCase}
              disabled={creating}
              className="flex-1 bg-purple-600 hover:bg-purple-700 h-9 sm:h-10 text-xs sm:text-sm"
            >
              {creating ? (
                <>
                  <span className="sm:hidden">Creating...</span>
                  <span className="hidden sm:inline">Creating...</span>
                </>
              ) : (
                <>
                  <span className="sm:hidden">Create</span>
                  <span className="hidden sm:inline">Create Case</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Client Creation Dialog */}
      <Dialog open={showQuickClientDialog} onOpenChange={setShowQuickClientDialog}>
        <DialogContent className="sm:max-w-[440px] rounded-2xl">
          <DialogHeader className="space-y-3">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <Plus className="h-7 w-7 text-white" />
            </div>
            <DialogTitle className="text-2xl font-semibold text-center">Create New Client</DialogTitle>
            <DialogDescription className="text-center text-base">
              Enter basic client details to create a new record.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-6">
            <div className="space-y-2">
              <Label htmlFor="quickClientName" className="text-sm font-medium text-slate-700">
                Client Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quickClientName"
                value={quickClientName}
                onChange={(e) => setQuickClientName(e.target.value)}
                placeholder="Enter full name"
                className="h-11 text-base"
              />
              <p className="text-xs text-slate-500">
                First word will be first name, rest will be last name
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quickClientPhone" className="text-sm font-medium text-slate-700">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quickClientPhone"
                value={quickClientPhone}
                onChange={(e) => setQuickClientPhone(e.target.value)}
                placeholder="Enter phone number"
                className="h-11 text-base"
              />
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowQuickClientDialog(false)}
              disabled={isCreatingClient}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleQuickClientCreate}
              disabled={isCreatingClient}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isCreatingClient ? 'Creating...' : 'Create Client'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
