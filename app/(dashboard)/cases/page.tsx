'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Calendar, FileText, ChevronRight, Building2, Briefcase } from 'lucide-react'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

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
  caseType: {
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
  ACTIVE: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0',
  PENDING: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0',
  CLOSED: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0',
  ARCHIVED: 'bg-gradient-to-r from-gray-400 to-gray-500 text-white border-0',
}

export default function CasesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [userRole, setUserRole] = useState<string>('ASSOCIATE')
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

  const fetchClients = async () => {
    if (!user?.email) return

    try {
      const res = await fetch(`/api/clients?email=${encodeURIComponent(user.email)}`)
      if (res.ok) {
        const data = await res.json()
        setClients(data.clients || [])
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const handleOpenQuickCreate = () => {
    fetchClients()
    setQuickCaseForm({
      caseNumber: '',
      clientId: '',
      opponentMainParty: '',
      appearingFor: 'PETITIONER',
    })
    setClientSearchQuery('')
    setShowClientDropdown(false)
    setShowQuickClientDialog(false)
    setQuickClientName('')
    setQuickClientPhone('')
    setShowQuickCreateDialog(true)
  }

  const handleQuickClientCreate = async () => {
    if (!quickClientName.trim() || !quickClientPhone.trim()) {
      toast.error('Please enter both name and phone number')
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
          phone: quickClientPhone.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create client')
      }

      const data = await response.json()
      const newClient = data.client

      // Update clients list
      setClients([...clients, newClient])

      // Select the new client
      const fullName = newClient.lastName ? `${newClient.firstName} ${newClient.lastName}` : newClient.firstName
      setClientSearchQuery(fullName)
      setQuickCaseForm({ ...quickCaseForm, clientId: newClient.id })

      toast.success('Client created successfully')
      setShowQuickClientDialog(false)
      setQuickClientName('')
      setQuickClientPhone('')
    } catch (error) {
      console.error('Error creating client:', error)
      toast.error('Failed to create client')
    } finally {
      setIsCreatingClient(false)
    }
  }

  const handleQuickCreateCase = async () => {
    if (!user?.email) return

    // Validation
    if (!quickCaseForm.caseNumber.trim()) {
      toast.error('Case number is required')
      return
    }
    if (!quickCaseForm.clientId) {
      toast.error('Please select a client')
      return
    }
    if (!quickCaseForm.opponentMainParty.trim()) {
      toast.error('Opponent main party is required')
      return
    }

    setCreating(true)

    try {
      // Create case with minimal data
      const caseResponse = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: user.email,
          caseNumber: quickCaseForm.caseNumber,
          appearingFor: quickCaseForm.appearingFor,
          clientId: quickCaseForm.clientId,
          opponentMainParty: quickCaseForm.opponentMainParty,
          filingDate: new Date().toISOString(),
          status: 'ACTIVE',
        }),
      })

      if (!caseResponse.ok) {
        const errorData = await caseResponse.json()
        console.error('API Error Response:', errorData)
        const errorMessage = errorData.details
          ? `${errorData.error}: ${errorData.details}`
          : errorData.error || 'Failed to create case'
        throw new Error(errorMessage)
      }

      const caseData = await caseResponse.json()
      toast.success('Case created successfully')
      setShowQuickCreateDialog(false)

      // Navigate to case detail page with newCase flag
      router.push(`/cases/${caseData.case.id}?newCase=true`)
    } catch (error) {
      console.error('Error creating case:', error)
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong. Try again.'
      toast.error(errorMessage)
    } finally {
      setCreating(false)
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
    <div className="space-y-6 max-w-7xl px-4 md:px-0">
      {/* Header */}
      <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-white to-purple-50/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center shadow-md">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Cases</h1>
                <p className="text-sm md:text-base text-slate-600 mt-0.5">
                  {filteredCases.length} {filteredCases.length === 1 ? 'case' : 'cases'}
                </p>
              </div>
            </div>
            {canCreateCase && (
            <Dialog open={showQuickCreateDialog} onOpenChange={setShowQuickCreateDialog}>
                <DialogTrigger render={<Button className="gap-2 h-9 md:h-10 text-sm md:text-base" />} onClick={handleOpenQuickCreate}>
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">New Case</span>
                </DialogTrigger>
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
                        onChange={(e) => setQuickCaseForm({ ...quickCaseForm, appearingFor: e.target.value as any })}
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
                        onChange={(e) => setQuickCaseForm({ ...quickCaseForm, appearingFor: e.target.value as any })}
                        className="sr-only"
                      />
                      <span className="font-medium text-xs sm:text-sm">Respondent</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2 relative">
                  <Label htmlFor="clientSearch" className="text-xs sm:text-sm font-medium text-slate-700">
                    Client <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="clientSearch"
                    placeholder="Search or create client"
                    value={clientSearchQuery}
                    onChange={(e) => {
                      setClientSearchQuery(e.target.value)
                      setShowClientDropdown(true)
                      if (!e.target.value) {
                        setQuickCaseForm({ ...quickCaseForm, clientId: '' })
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowClientDropdown(false), 300)
                    }}
                    onFocus={() => {
                      if (clientSearchQuery) {
                        setShowClientDropdown(true)
                      }
                    }}
                    className="h-9 sm:h-11 text-sm sm:text-base"
                  />
                  {clientSearchQuery && showClientDropdown && (
                    <div className="absolute z-10 w-full border border-slate-200 rounded-lg sm:rounded-xl mt-1 bg-white shadow-lg max-h-48 sm:max-h-64 overflow-auto">
                      {clients.filter(client => {
                        const fullName = client.lastName ? `${client.firstName} ${client.lastName}` : client.firstName
                        return fullName.toLowerCase().includes(clientSearchQuery.toLowerCase())
                      }).length > 0 ? (
                        <>
                          {clients.filter(client => {
                            const fullName = client.lastName ? `${client.firstName} ${client.lastName}` : client.firstName
                            return fullName.toLowerCase().includes(clientSearchQuery.toLowerCase())
                          }).map((client) => (
                            <button
                              key={client.id}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault()
                                const fullName = client.lastName ? `${client.firstName} ${client.lastName}` : client.firstName
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
                              setShowQuickClientDialog(true)
                              setShowClientDropdown(false)
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

          <DialogFooter className="flex-row gap-2 sm:gap-3 px-4 sm:px-6 pb-4 sm:pb-6 pt-3 sm:pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowQuickCreateDialog(false)}
              disabled={creating}
              className="flex-1 h-11 sm:h-10 text-sm font-medium"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleQuickCreateCase}
              disabled={creating}
              className="flex-1 bg-purple-600 hover:bg-purple-700 h-11 sm:h-10 text-sm font-medium"
            >
              {creating ? 'Creating...' : 'Create Case'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )}
          </div>
        </CardContent>
      </Card>

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

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 md:left-4 top-1/2 h-4 w-4 md:h-5 md:w-5 -translate-y-1/2 text-purple-400" />
        <Input
          placeholder="Search cases..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 md:pl-12 h-11 md:h-12 text-sm md:text-base border-slate-300 rounded-xl focus:border-purple-600 focus:ring-purple-600 shadow-sm"
        />
      </div>

      {/* Status Filter Tabs */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-3 md:p-4">
          <div className="flex gap-2 overflow-x-auto">
            {statusTabs.map((status) => {
              const isSelected = statusFilter === status
              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 md:px-5 py-2 md:py-2.5 rounded-lg font-semibold text-xs md:text-sm whitespace-nowrap transition-all shadow-sm ${
                    isSelected
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  {status}
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {statusCounts[status as keyof typeof statusCounts]}
                  </span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

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
              <Button className="mt-4" onClick={handleOpenQuickCreate}>
                <Plus className="h-4 w-4 mr-2" />
                New Case
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredCases.map((caseItem) => (
            <Link key={caseItem.id} href={`/cases/${caseItem.id}`}>
              <Card className="hover:shadow-xl hover:border-purple-200 transition-all duration-200 cursor-pointer group border-slate-200 bg-gradient-to-br from-white to-slate-50/50">
                <CardHeader className="pb-3 md:pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <Briefcase className="h-4 w-4 md:h-5 md:w-5 text-white" />
                        </div>
                        <CardTitle className="text-base md:text-lg truncate group-hover:text-purple-700 transition-colors font-bold">
                          {caseItem.caseNumber}
                        </CardTitle>
                        <Badge className={`${statusColors[caseItem.status as keyof typeof statusColors]} text-xs font-semibold px-3 py-1 shadow-sm`}>
                          {caseItem.status}
                        </Badge>
                      </div>
                      <div className="space-y-1.5 mt-1">
                        <div className="flex items-center gap-2 text-base">
                          <span className="font-medium text-slate-700">{getClientName(caseItem)}</span>
                          <span className="text-slate-400 font-normal">vs</span>
                          <span className="font-medium text-slate-700">{caseItem.opponentMainParty}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 text-sm text-slate-600">
                            <Building2 className="h-4 w-4 text-slate-400" />
                            <span className={caseItem.court?.name ? '' : 'text-yellow-600'}>
                              {caseItem.court?.name || 'Court is not specified'}
                            </span>
                            {caseItem.courtNumber && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span>Court {caseItem.courtNumber}</span>
                              </>
                            )}
                          </div>
                          {caseItem.caseType && (
                            <Badge variant="outline" className="text-xs">
                              {caseItem.caseType.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-purple-600 transition-colors flex-shrink-0 mt-1" />
                  </div>
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200">
                    <div className="flex items-center gap-2 text-sm bg-purple-50 px-3 py-1.5 rounded-lg">
                      <Calendar className="h-4 w-4 text-purple-600" />
                      <span className="text-xs font-medium text-purple-600">Next:</span>
                      <span className="font-semibold text-purple-700">
                        {caseItem.nextHearingDate
                          ? format(new Date(caseItem.nextHearingDate), 'MMM d, yyyy')
                          : 'Not scheduled'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-base md:text-lg font-bold text-purple-600">{caseItem._count.hearings}</p>
                        <p className="text-xs text-slate-500 font-medium">Hearings</p>
                      </div>
                      <div className="w-px h-10 bg-slate-200"></div>
                      <div className="text-center">
                        <p className="text-base md:text-lg font-bold text-purple-600">{caseItem._count.documents}</p>
                        <p className="text-xs text-slate-500 font-medium">Docs</p>
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
