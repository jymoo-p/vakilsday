'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Plus,
  Search,
  Calendar,
  FileText,
  Building2,
  Briefcase,
  Copy,
  Check,
  ArrowRight,
  Download,
  FolderOpen,
  Scale,
  Gavel,
  CheckCircle2,
  Archive,
  Clock,
  ChevronDown,
  ArrowUpDown,
  Layers,
} from 'lucide-react'
import { format, isToday, isTomorrow, differenceInCalendarDays } from 'date-fns'
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
  cnrNumber: string | null
  year?: number | null
  appearingFor: string
  courtNumber: string | null
  judgeName?: string | null
  status: string
  filingDate?: string | null
  nextHearingDate: string | null
  synopsis?: string | null
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
  hearings?: Array<{
    id: string
    hearingDate: string
    itemNumber: string | null
    outcome: string | null
    notes?: Array<{
      content: string
    }>
  }>
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

const ITEMS_PER_PAGE = 10

export default function CasesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [cases, setCases] = useState<Case[]>([])
  const [courts, setCourts] = useState<Array<{ id: string; name: string }>>([])
  const [caseTypes, setCaseTypes] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)

  // Filters & sorting
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [courtFilter, setCourtFilter] = useState<string>('ALL')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [sortBy, setSortBy] = useState<string>('EARLIEST_HEARING')
  const [currentPage, setCurrentPage] = useState<number>(1)

  const [userRole, setUserRole] = useState<string>('ASSOCIATE')
  const [showQuickCreateDialog, setShowQuickCreateDialog] = useState(false)
  const [creating, setCreating] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [quickCaseForm, setQuickCaseForm] = useState({
    caseNumber: '',
    cnrNumber: '',
    clientId: '',
    opponentMainParty: '',
    appearingFor: 'PETITIONER' as 'PETITIONER' | 'RESPONDENT',
  })
  const [copiedCaseId, setCopiedCaseId] = useState<string | null>(null)
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
    fetchCourtsAndTypes()
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

  const fetchCourtsAndTypes = async () => {
    if (!user?.email) return

    try {
      const [courtsRes, typesRes] = await Promise.all([
        fetch(`/api/courts?email=${encodeURIComponent(user.email)}`),
        fetch(`/api/case-types?email=${encodeURIComponent(user.email)}`),
      ])
      if (courtsRes.ok) {
        const courtsData = await courtsRes.json()
        setCourts(courtsData.courts || [])
      }
      if (typesRes.ok) {
        const typesData = await typesRes.json()
        setCaseTypes(typesData.caseTypes || [])
      }
    } catch (error) {
      console.error('Error fetching courts/types:', error)
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
      cnrNumber: '',
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

      setClients([...clients, newClient])

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
      const caseResponse = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: user.email,
          caseNumber: quickCaseForm.caseNumber,
          cnrNumber: quickCaseForm.cnrNumber.trim() || undefined,
          appearingFor: quickCaseForm.appearingFor,
          clientId: quickCaseForm.clientId,
          opponentMainParty: quickCaseForm.opponentMainParty,
          filingDate: new Date().toISOString(),
          status: 'ACTIVE',
        }),
      })

      if (!caseResponse.ok) {
        const errorData = await caseResponse.json()
        const errorMessage = errorData.details
          ? `${errorData.error}: ${errorData.details}`
          : errorData.error || 'Failed to create case'
        throw new Error(errorMessage)
      }

      const caseData = await caseResponse.json()
      toast.success('Case created successfully')
      setShowQuickCreateDialog(false)

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
      return `${caseItem.client.firstName} ${caseItem.client.lastName || ''}`.trim()
    }
    return caseItem.otherParties[0] || 'Unknown'
  }

  const handleCopyCnr = async (e: React.MouseEvent, caseId: string, cnr: string) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(cnr)
      setCopiedCaseId(caseId)
      toast.success('CNR copied to clipboard')
      setTimeout(() => setCopiedCaseId((prev) => (prev === caseId ? null : prev)), 2000)
    } catch {
      toast.error('Failed to copy CNR')
    }
  }

  // Filter and sort cases
  const filteredAndSortedCases = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()

    const filtered = cases.filter((c) => {
      const clientName = getClientName(c).toLowerCase()
      const courtName = (c.court?.name || '').toLowerCase()
      const matchesSearch =
        !q ||
        c.caseNumber.toLowerCase().includes(q) ||
        (c.cnrNumber && c.cnrNumber.toLowerCase().includes(q)) ||
        clientName.includes(q) ||
        c.opponentMainParty.toLowerCase().includes(q) ||
        courtName.includes(q)

      const matchesStatus = statusFilter === 'All' || c.status === statusFilter
      const matchesCourt = courtFilter === 'ALL' || c.court?.id === courtFilter
      const matchesType = typeFilter === 'ALL' || c.caseType?.id === typeFilter

      return matchesSearch && matchesStatus && matchesCourt && matchesType
    })

    return [...filtered].sort((a, b) => {
      if (sortBy === 'EARLIEST_HEARING') {
        if (!a.nextHearingDate && !b.nextHearingDate) return 0
        if (!a.nextHearingDate) return 1
        if (!b.nextHearingDate) return -1
        return new Date(a.nextHearingDate).getTime() - new Date(b.nextHearingDate).getTime()
      }
      if (sortBy === 'LATEST_HEARING') {
        if (!a.nextHearingDate && !b.nextHearingDate) return 0
        if (!a.nextHearingDate) return 1
        if (!b.nextHearingDate) return -1
        return new Date(b.nextHearingDate).getTime() - new Date(a.nextHearingDate).getTime()
      }
      if (sortBy === 'CASE_NUMBER') {
        return a.caseNumber.localeCompare(b.caseNumber)
      }
      return 0
    })
  }, [cases, searchQuery, statusFilter, courtFilter, typeFilter, sortBy])

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, courtFilter, typeFilter, sortBy])

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedCases.length / ITEMS_PER_PAGE))
  const paginatedCases = filteredAndSortedCases.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const canCreateCase = userRole !== 'CLERK'

  const statusTabs = [
    { key: 'All', label: 'All' },
    { key: 'ACTIVE', label: 'Active' },
    { key: 'PENDING', label: 'Pending' },
    { key: 'CLOSED', label: 'Closed' },
    { key: 'ARCHIVED', label: 'Archived' },
  ]

  const statusCounts: Record<string, number> = {
    All: cases.length,
    ACTIVE: cases.filter((c) => c.status === 'ACTIVE').length,
    PENDING: cases.filter((c) => c.status === 'PENDING').length,
    CLOSED: cases.filter((c) => c.status === 'CLOSED').length,
    ARCHIVED: cases.filter((c) => c.status === 'ARCHIVED').length,
  }

  const getHearingContext = (caseItem: Case) => {
    const latestHearing = caseItem.hearings?.[0]
    const itemNum = latestHearing?.itemNumber
    const rawNote =
      latestHearing?.outcome ||
      latestHearing?.notes?.[0]?.content ||
      (caseItem.synopsis ? caseItem.synopsis.replace(/<[^>]*>?/gm, '').slice(0, 85) : null)

    if (caseItem.status === 'CLOSED') {
      return {
        isUrgent: false,
        listingAlert: null,
        headerLabel: 'NEXT HEARING STATUS',
        headerDateText: '',
        description: rawNote || 'No further listings scheduled • File closed in office registry',
        stageBadge: 'CASE DISPOSED',
        stageBadgeClass: 'bg-slate-200/80 text-slate-600 border-slate-300',
        ctaText: 'View Certified Judgment',
        ctaIcon: Download,
      }
    }

    if (caseItem.status === 'ARCHIVED') {
      return {
        isUrgent: false,
        listingAlert: null,
        headerLabel: 'RECORD STATUS',
        headerDateText: '',
        description: rawNote || 'Transferred to Subordinate Court Registry • Inactive on High Court roll',
        stageBadge: 'SUB-COURT FILE',
        stageBadgeClass: 'bg-slate-200/80 text-slate-600 border-slate-300',
        ctaText: 'View Record Archive',
        ctaIcon: FolderOpen,
      }
    }

    let isUrgent = false
    let listingAlert: string | null = null
    let headerDateText = 'NOT SCHEDULED'

    if (caseItem.nextHearingDate) {
      const nextDate = new Date(caseItem.nextHearingDate)
      const daysDiff = differenceInCalendarDays(nextDate, new Date())

      if (isToday(nextDate)) {
        isUrgent = true
        listingAlert = `Listing Today${itemNum ? ` • Item #${itemNum}` : ''}`
        headerDateText = `TODAY, ${format(nextDate, 'MMM d, yyyy').toUpperCase()}`
      } else if (isTomorrow(nextDate)) {
        isUrgent = true
        listingAlert = `Listing Tomorrow${itemNum ? ` • Item #${itemNum}` : ''}`
        headerDateText = `TOMORROW, ${format(nextDate, 'MMM d, yyyy').toUpperCase()}`
      } else if (daysDiff >= 0 && daysDiff <= 3) {
        isUrgent = true
        listingAlert = `Listing in ${daysDiff} days${itemNum ? ` • Item #${itemNum}` : ''}`
        headerDateText = format(nextDate, 'MMM d, yyyy').toUpperCase()
      } else {
        const hasTime = nextDate.getHours() !== 0 || nextDate.getMinutes() !== 0
        headerDateText = hasTime
          ? `${format(nextDate, 'MMM d, yyyy').toUpperCase()} AT ${format(nextDate, 'hh:mm a').toUpperCase()}`
          : format(nextDate, 'MMM d, yyyy').toUpperCase()
      }
    }

    const stageBadge = isUrgent
      ? 'URGENT LISTING'
      : caseItem.status === 'PENDING'
      ? 'REGISTRY PENDING'
      : caseItem.caseType?.name
      ? caseItem.caseType.name.toUpperCase()
      : 'FINAL ARGUMENTS'

    const stageBadgeClass = isUrgent
      ? 'bg-[#004ac6] text-white border-[#004ac6]'
      : 'bg-white text-[#004ac6] border-[#c3c6d7]/60'

    const description =
      rawNote ||
      (caseItem.nextHearingDate
        ? `Further proceedings & hearing${itemNum ? ` (Item #${itemNum})` : ''}`
        : 'Awaiting next cause list date from court registry')

    return {
      isUrgent,
      listingAlert,
      headerLabel: 'NEXT HEARING:',
      headerDateText,
      description,
      stageBadge,
      stageBadgeClass,
      ctaText: 'View Case Dossier',
      ctaIcon: ArrowRight,
    }
  }

  return (
    <div className="space-y-5 w-full">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 md:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#004ac6] flex items-center justify-center shadow-sm shadow-[#004ac6]/20 shrink-0">
            <Briefcase className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#131b2e] tracking-tight">Cases</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-[#004ac6]" />
              <p className="text-sm text-[#545f73] font-medium">
                {cases.length} active {cases.length === 1 ? 'matter' : 'matters'} in roster
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {canCreateCase && (
            <Dialog open={showQuickCreateDialog} onOpenChange={setShowQuickCreateDialog}>
              <DialogTrigger
                render={
                  <Button className="h-10 px-5 rounded-xl bg-[#004ac6] hover:bg-[#1d4ed8] text-white font-semibold text-sm gap-2 shadow-sm shadow-[#004ac6]/20 cursor-pointer" />
                }
                onClick={handleOpenQuickCreate}
              >
                <Plus className="h-4 w-4" />
                <span>New Case</span>
              </DialogTrigger>
              <DialogContent className="w-[calc(100vw-2rem)] max-w-[540px] rounded-xl sm:rounded-2xl max-h-[95vh] p-0 gap-0 overflow-hidden flex flex-col">
                <div
                  className="flex-1 overflow-y-auto px-4 sm:px-6 pt-4 sm:pt-6"
                  style={{ maxHeight: 'calc(95vh - 80px)' }}
                >
                  <DialogHeader className="space-y-2 sm:space-y-3">
                    <div className="mx-auto w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-[#004ac6] flex items-center justify-center">
                      <Briefcase className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                    </div>
                    <DialogTitle className="text-xl sm:text-2xl font-semibold text-center">
                      New Case
                    </DialogTitle>
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

                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="cnrNumber" className="text-xs sm:text-sm font-medium text-slate-700">
                        CNR Number (Optional)
                      </Label>
                      <Input
                        id="cnrNumber"
                        value={quickCaseForm.cnrNumber}
                        onChange={(e) => setQuickCaseForm({ ...quickCaseForm, cnrNumber: e.target.value })}
                        placeholder="e.g., KLHC010098232026"
                        className="h-9 sm:h-11 text-sm sm:text-base font-mono uppercase"
                      />
                    </div>

                    <div className="space-y-2 sm:space-y-3">
                      <Label className="text-xs sm:text-sm font-medium text-slate-700">
                        Appearing For <span className="text-red-500">*</span>
                      </Label>
                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <label
                          className={`flex items-center justify-center gap-2 cursor-pointer rounded-lg border-2 p-2 sm:p-3 transition-all ${
                            quickCaseForm.appearingFor === 'PETITIONER'
                              ? 'border-[#004ac6] bg-blue-50 text-[#004ac6]'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            value="PETITIONER"
                            checked={quickCaseForm.appearingFor === 'PETITIONER'}
                            onChange={(e) =>
                              setQuickCaseForm({ ...quickCaseForm, appearingFor: e.target.value as any })
                            }
                            className="sr-only"
                          />
                          <span className="font-medium text-xs sm:text-sm">Petitioner</span>
                        </label>
                        <label
                          className={`flex items-center justify-center gap-2 cursor-pointer rounded-lg border-2 p-2 sm:p-3 transition-all ${
                            quickCaseForm.appearingFor === 'RESPONDENT'
                              ? 'border-[#004ac6] bg-blue-50 text-[#004ac6]'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            value="RESPONDENT"
                            checked={quickCaseForm.appearingFor === 'RESPONDENT'}
                            onChange={(e) =>
                              setQuickCaseForm({ ...quickCaseForm, appearingFor: e.target.value as any })
                            }
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
                          {clients.filter((client) => {
                            const fullName = client.lastName
                              ? `${client.firstName} ${client.lastName}`
                              : client.firstName
                            return fullName.toLowerCase().includes(clientSearchQuery.toLowerCase())
                          }).length > 0 ? (
                            <>
                              {clients
                                .filter((client) => {
                                  const fullName = client.lastName
                                    ? `${client.firstName} ${client.lastName}`
                                    : client.firstName
                                  return fullName.toLowerCase().includes(clientSearchQuery.toLowerCase())
                                })
                                .map((client) => (
                                  <button
                                    key={client.id}
                                    type="button"
                                    onMouseDown={(e) => {
                                      e.preventDefault()
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
                              <p className="text-xs sm:text-sm text-slate-600 mb-3 sm:mb-4">
                                No matching clients found
                              </p>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => {
                                  setQuickClientName(clientSearchQuery)
                                  setShowQuickClientDialog(true)
                                  setShowClientDropdown(false)
                                }}
                                className="gap-2 bg-[#004ac6] hover:bg-[#1d4ed8] h-8 text-xs sm:h-9 sm:text-sm"
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
                        placeholder="e.g., State of Kerala & Ors"
                        className="h-9 sm:h-11 text-sm sm:text-base"
                      />
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
                    className="flex-1 bg-[#004ac6] hover:bg-[#1d4ed8] h-11 sm:h-10 text-sm font-medium"
                  >
                    {creating ? 'Creating...' : 'Create Case'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

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
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#545f73]" />
        <Input
          placeholder="Search cases by CNR, Case Number, Party Name, or Court (e.g., CC/203/2025, Rajkumar)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-11 h-12 text-sm md:text-base bg-white border-[#e2e8f0] rounded-xl focus:border-[#004ac6] focus:ring-[#004ac6] shadow-xs text-[#131b2e] placeholder:text-[#545f73]"
        />
      </div>

      {/* Filter & Sort Bar */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] p-3.5 md:p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {statusTabs.map(({ key, label }) => {
            const isSelected = statusFilter === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key)}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#004ac6] text-white shadow-xs'
                    : 'bg-[#f2f4f8] text-[#545f73] hover:bg-[#e2e7ff]/60 hover:text-[#131b2e]'
                }`}
              >
                <span>{label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    isSelected
                      ? 'bg-white/25 text-white'
                      : 'bg-[#e2e8f0] text-[#131b2e]'
                  }`}
                >
                  {statusCounts[key]}
                </span>
              </button>
            )
          })}
        </div>

        {/* Right Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Court Filter */}
          <div className="relative flex items-center">
            <Building2 className="h-4 w-4 text-[#545f73] absolute left-3 pointer-events-none" />
            <select
              value={courtFilter}
              onChange={(e) => setCourtFilter(e.target.value)}
              aria-label="Filter by court"
              className="h-9 pl-9 pr-8 rounded-xl border border-[#e2e8f0] bg-[#f8f9ff] hover:bg-[#f2f4f8] text-xs font-semibold text-[#131b2e] appearance-none cursor-pointer focus:outline-none focus:border-[#004ac6]"
            >
              <option value="ALL">All Courts</option>
              {courts.map((court) => (
                <option key={court.id} value={court.id}>
                  {court.name}
                </option>
              ))}
            </select>
            <ChevronDown className="h-3.5 w-3.5 text-[#545f73] absolute right-2.5 pointer-events-none" />
          </div>

          {/* Case Type Filter */}
          <div className="relative flex items-center">
            <Layers className="h-4 w-4 text-[#545f73] absolute left-3 pointer-events-none" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter by case type"
              className="h-9 pl-9 pr-8 rounded-xl border border-[#e2e8f0] bg-[#f8f9ff] hover:bg-[#f2f4f8] text-xs font-semibold text-[#131b2e] appearance-none cursor-pointer focus:outline-none focus:border-[#004ac6]"
            >
              <option value="ALL">All Types</option>
              {caseTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            <ChevronDown className="h-3.5 w-3.5 text-[#545f73] absolute right-2.5 pointer-events-none" />
          </div>

          {/* Sort Dropdown */}
          <div className="relative flex items-center">
            <ArrowUpDown className="h-4 w-4 text-[#545f73] absolute left-3 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort cases"
              className="h-9 pl-9 pr-8 rounded-xl border border-[#e2e8f0] bg-[#f8f9ff] hover:bg-[#f2f4f8] text-xs font-semibold text-[#131b2e] appearance-none cursor-pointer focus:outline-none focus:border-[#004ac6]"
            >
              <option value="EARLIEST_HEARING">Next Hearing (Earliest)</option>
              <option value="LATEST_HEARING">Next Hearing (Latest)</option>
              <option value="CASE_NUMBER">Case Number (A-Z)</option>
            </select>
            <ChevronDown className="h-3.5 w-3.5 text-[#545f73] absolute right-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Cases List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-44 bg-white border border-[#e2e8f0] rounded-2xl animate-pulse p-6" />
          ))}
        </div>
      ) : filteredAndSortedCases.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] py-14 px-6 text-center shadow-xs">
          <div className="p-4 bg-[#eef2ff] rounded-full w-fit mx-auto mb-4">
            <FileText className="h-10 w-10 text-[#004ac6]" />
          </div>
          <p className="text-lg font-bold text-[#131b2e]">No cases matching your criteria</p>
          <p className="text-sm text-[#545f73] mt-1">
            {searchQuery || statusFilter !== 'All' || courtFilter !== 'ALL' || typeFilter !== 'ALL'
              ? 'Try clearing your search query or adjusting the active filters.'
              : 'Create your first case to get started.'}
          </p>
          {canCreateCase && !searchQuery && statusFilter === 'All' && (
            <Button
              className="mt-5 bg-[#004ac6] hover:bg-[#1d4ed8] text-white rounded-xl"
              onClick={handleOpenQuickCreate}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Case
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedCases.map((caseItem) => {
            const isClosed = caseItem.status === 'CLOSED'
            const isArchived = caseItem.status === 'ARCHIVED'
            const isInactive = isClosed || isArchived
            const ctx = getHearingContext(caseItem)
            const CtaIcon = ctx.ctaIcon

            const leftBorderClass = isInactive
              ? 'border-l-4 border-l-slate-300'
              : 'border-l-4 border-l-[#004ac6]'

            const briefLabel =
              caseItem.appearingFor === 'PETITIONER'
                ? 'Brief: Petitioner'
                : 'Brief: Respondent'

            const CaseIcon = isClosed
              ? CheckCircle2
              : isArchived
              ? Archive
              : caseItem.caseType?.name?.toLowerCase().includes('writ')
              ? Scale
              : Gavel

            return (
              <Link key={caseItem.id} href={`/cases/${caseItem.id}`} className="block group">
                <div
                  className={`bg-white rounded-2xl border border-[#e2e8f0] ${leftBorderClass} p-5 md:p-6 shadow-xs hover:shadow-md hover:border-[#004ac6]/40 transition-all duration-200`}
                >
                  {/* Top Section */}
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      {/* Left Icon Box */}
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isInactive
                            ? 'bg-slate-100 text-slate-500'
                            : 'bg-[#eef2ff] text-[#004ac6]'
                        }`}
                      >
                        <CaseIcon className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1 space-y-1.5">
                        {/* Row 1: Case Number + Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-base font-bold tracking-tight ${
                              isInactive
                                ? 'text-slate-600'
                                : 'text-[#004ac6] group-hover:underline'
                            }`}
                          >
                            {caseItem.caseNumber}
                          </span>

                          {/* Status Badge */}
                          <span
                            className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                              caseItem.status === 'ACTIVE'
                                ? 'bg-[#004ac6] text-white'
                                : caseItem.status === 'PENDING'
                                ? 'bg-amber-500 text-white'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {caseItem.status === 'CLOSED' ? 'DISPOSED / CLOSED' : caseItem.status}
                          </span>

                          {/* Urgent Listing Alert Pill */}
                          {ctx.listingAlert && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                              {ctx.listingAlert}
                            </span>
                          )}

                          {/* Brief Role Pill */}
                          <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-[#f2f4f8] text-[#545f73] border border-[#e2e8f0]">
                            {briefLabel}
                          </span>
                        </div>

                        {/* Row 2: Parties */}
                        <div className="text-lg font-bold text-[#131b2e]">
                          <span>{getClientName(caseItem)}</span>
                          <span className="text-sm font-normal text-[#737686] mx-2">vs</span>
                          <span className="font-medium text-[#334155]">
                            {caseItem.opponentMainParty}
                          </span>
                        </div>

                        {/* Row 3: Court, Case Type, and CNR Copy Box */}
                        <div className="flex flex-wrap items-center gap-2.5 pt-0.5 text-xs text-[#545f73]">
                          <div className="flex items-center gap-1.5 font-medium">
                            <Building2 className="h-3.5 w-3.5 text-[#737686]" />
                            <span className={caseItem.court?.name ? 'text-[#545f73]' : 'text-amber-600'}>
                              {caseItem.court?.name || 'Court not specified'}
                            </span>
                            {caseItem.courtNumber && (
                              <>
                                <span>•</span>
                                <span>Court {caseItem.courtNumber}</span>
                              </>
                            )}
                            {caseItem.judgeName && (
                              <span className="text-[#737686]">({caseItem.judgeName})</span>
                            )}
                          </div>

                          {caseItem.caseType && (
                            <span
                              className={`px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                                isInactive
                                  ? 'bg-slate-100 text-slate-600'
                                  : 'bg-[#eef2ff] text-[#004ac6]'
                              }`}
                            >
                              {caseItem.caseType.name}
                            </span>
                          )}

                          {/* CNR Box with Copy Option */}
                          {caseItem.cnrNumber ? (
                            <div
                              onClick={(e) => handleCopyCnr(e, caseItem.id, caseItem.cnrNumber!)}
                              className="inline-flex items-center gap-3 px-2.5 py-1 rounded-md bg-[#f2f4f8] hover:bg-[#e2e7ff]/70 border border-[#e2e8f0] text-xs text-[#545f73] transition-colors cursor-pointer"
                              title="Copy CNR Number"
                            >
                              <span className="font-mono text-[11px] font-medium text-[#545f73]">
                                CNR: <strong className="text-[#131b2e]">{caseItem.cnrNumber}</strong>
                              </span>
                              {copiedCaseId === caseItem.id ? (
                                <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                              ) : (
                                <Copy className="h-3.5 w-3.5 text-[#737686] hover:text-[#004ac6] shrink-0" />
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-[#f8f9ff] border border-dashed border-[#c3c6d7] text-[11px] font-mono text-[#737686]">
                              CNR: Not recorded
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Action Button */}
                    <div className="shrink-0 self-start">
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#f8f9ff] group-hover:bg-[#eef2ff] border border-[#e2e8f0] text-xs font-semibold text-[#131b2e] group-hover:text-[#004ac6] transition-colors">
                        <span>{ctx.ctaText}</span>
                        <CtaIcon className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>

                  {/* Bottom Hearing / Record Status Box */}
                  <div
                    className={`mt-4 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isInactive
                        ? 'bg-[#f8f9fa] border border-slate-200/80'
                        : 'bg-[#f2f6ff] border border-[#dce6ff]'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs font-bold tracking-wide">
                        {ctx.isUrgent ? (
                          <Clock className="h-3.5 w-3.5 text-[#004ac6] shrink-0" />
                        ) : (
                          <Calendar
                            className={`h-3.5 w-3.5 shrink-0 ${
                              isInactive ? 'text-slate-500' : 'text-[#004ac6]'
                            }`}
                          />
                        )}
                        <span className={isInactive ? 'text-slate-500' : 'text-[#131b2e]'}>
                          {ctx.headerLabel}
                        </span>
                        {ctx.headerDateText && (
                          <span className="text-[#004ac6] font-extrabold">
                            {ctx.headerDateText}
                          </span>
                        )}
                      </div>

                      <div
                        className={`flex items-center gap-2 text-xs font-medium truncate ${
                          isInactive
                            ? 'text-slate-500'
                            : ctx.isUrgent
                            ? 'text-[#004ac6] font-semibold'
                            : 'text-[#131b2e]'
                        }`}
                      >
                        <FileText className="h-3.5 w-3.5 shrink-0 opacity-75" />
                        <span className="truncate">{ctx.description}</span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1.5 shrink-0">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border ${ctx.stageBadgeClass}`}
                      >
                        {ctx.stageBadge}
                      </span>
                      <div className="flex items-center gap-3 text-xs text-[#545f73]">
                        <span>
                          <strong className="text-[#131b2e]">{caseItem._count.hearings}</strong>{' '}
                          {caseItem._count.hearings === 1 ? 'Hearing' : 'Hearings'}
                        </span>
                        <span>
                          <strong className="text-[#131b2e]">{caseItem._count.documents}</strong>{' '}
                          {isClosed ? 'Orders' : caseItem._count.documents === 1 ? 'Doc' : 'Docs'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Pagination Footer */}
      {!loading && filteredAndSortedCases.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <p className="text-xs md:text-sm text-[#545f73]">
            Showing{' '}
            <strong className="text-[#131b2e]">{paginatedCases.length}</strong> of{' '}
            <strong className="text-[#131b2e]">{filteredAndSortedCases.length}</strong> cases
          </p>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-9 px-3.5 rounded-lg border border-[#e2e8f0] bg-white hover:bg-[#f8f9ff] disabled:opacity-50 text-xs font-semibold text-[#545f73] cursor-pointer disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                onClick={() => setCurrentPage(pageNum)}
                className={`h-9 w-9 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  currentPage === pageNum
                    ? 'bg-[#004ac6] text-white shadow-xs'
                    : 'bg-white border border-[#e2e8f0] text-[#545f73] hover:bg-[#f8f9ff]'
                }`}
              >
                {pageNum}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-9 px-3.5 rounded-lg border border-[#e2e8f0] bg-white hover:bg-[#f8f9ff] disabled:opacity-50 text-xs font-semibold text-[#545f73] cursor-pointer disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
