'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { format, differenceInCalendarDays, isToday, isTomorrow } from 'date-fns'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Calendar,
  FileText,
  Users,
  Building2,
  Gavel,
  Phone,
  Clock,
  Edit,
  Upload,
  Download,
  Eye,
  History,
  Plus,
  X,
  Sparkles,
  LayoutDashboard,
  Copy,
  Check,
  Share2,
  Scale,
  FolderOpen,
  Link2,
  CheckCircle2,
  Circle,
  AlertCircle,
  Shield,
  BookOpen,
  UserPlus,
  Mail,
  MessageSquare,
  Lightbulb,
  ArrowRight,
  Network,
  TrendingUp,
} from 'lucide-react'
import Link from 'next/link'
import { HearingTimeline } from '@/components/cases/hearing-timeline'
import { HearingForm } from '@/components/cases/hearing-form'
import { CaseAIAssistant } from '@/components/cases/case-ai-assistant'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface Case {
  id: string
  caseNumber: string
  cnrNumber: string | null
  year?: number | null
  appearingFor: string
  courtNumber: string | null
  judgeName: string | null
  opposingCounselName: string | null
  opposingCounselPhone: string | null
  opposingCounselStrategy: string | null
  status: string
  filingDate: string
  nextHearingDate: string | null
  synopsis: string | null
  cruxOfDispute: string | null
  prayerRelief: string | null
  keyIssues: string | null
  interimOrders: string | null
  interimOrderValidUntil: string | null
  otherParties: string[]
  opponentMainParty: string
  opponentOtherParties: string[]
  client: {
    id: string
    firstName: string
    lastName: string
    phone: string
    otherPhone?: string | null
    email?: string | null
    address?: string | null
    lawyerNotes?: string | null
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
      id: string
      name: string
      email: string
      role: string
    }
  }>
  hearings: Array<{
    id: string
    hearingDate: string
    itemNumber: string | null
    outcome: string | null
    nextHearingDate: string | null
    createdAt: string
    notes?: Array<{
      id: string
      content: string
    }>
  }>
  documents: Array<{
    id: string
    title: string
    documentType: string
    fileSize?: number | null
    mimeType?: string | null
    filePath?: string | null
    driveUrl: string | null
    createdAt: string
  }>
  connectedMatters?: Array<{
    id: string
    caseNumber: string
    status: string
    appearingFor: string
    opponentMainParty: string
    nextHearingDate: string | null
    court: { name: string } | null
    caseType: { name: string } | null
  }>
}

interface ActTag {
  act: string
  section: string
}

export default function CaseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [caseData, setCaseData] = useState<Case | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [showGuidance, setShowGuidance] = useState(false)

  // Section editors
  const [editingCourtDetails, setEditingCourtDetails] = useState(false)
  const [editingSynopsis, setEditingSynopsis] = useState(false)
  const [editingOpposingCounsel, setEditingOpposingCounsel] = useState(false)
  const [editingClient, setEditingClient] = useState(false)
  const [editingCnr, setEditingCnr] = useState(false)
  const [cnrForm, setCnrForm] = useState('')
  const [savingCnr, setSavingCnr] = useState(false)
  const [copiedCnr, setCopiedCnr] = useState(false)

  const [savingCourtDetails, setSavingCourtDetails] = useState(false)
  const [savingSynopsis, setSavingSynopsis] = useState(false)
  const [savingOpposingCounsel, setSavingOpposingCounsel] = useState(false)
  const [savingClient, setSavingClient] = useState(false)

  // Team Assignment Modal
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [allTeamMembers, setAllTeamMembers] = useState<any[]>([])
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([])
  const [savingTeam, setSavingTeam] = useState(false)

  // Statutory Acts & Sections tags
  const [actsList, setActsList] = useState<ActTag[]>([])
  const [showAddActDialog, setShowAddActDialog] = useState(false)
  const [newActName, setNewActName] = useState('')
  const [newSectionName, setNewSectionName] = useState('')

  const [uploadData, setUploadData] = useState({
    title: '',
    documentType: 'OTHER',
    file: null as File | null,
  })
  const [courtDetailsForm, setCourtDetailsForm] = useState({
    courtId: '',
    courtNumber: '',
    caseTypeId: '',
    judgeName: '',
    cnrNumber: '',
  })
  const [synopsisForm, setSynopsisForm] = useState({
    cruxOfDispute: '',
    prayerRelief: '',
    keyIssues: '',
    interimOrders: '',
    interimOrderValidUntil: '',
  })
  const [opposingCounselForm, setOpposingCounselForm] = useState({
    opponentMainParty: '',
    opponentOtherParties: '',
    opposingCounselName: '',
    opposingCounselPhone: '',
    opposingCounselStrategy: '',
  })
  const [clientForm, setClientForm] = useState({
    otherParties: '',
  })
  const [courts, setCourts] = useState<any[]>([])
  const [caseTypes, setCaseTypes] = useState<any[]>([])

  const fetchCase = async () => {
    if (!user?.email) return

    try {
      const res = await fetch(`/api/cases/${params.id}?email=${encodeURIComponent(user.email)}`)
      if (!res.ok) {
        throw new Error('Failed to fetch case')
      }
      const data = await res.json()
      setCaseData(data.case)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.email) {
      fetchCase()
      if (searchParams.get('newCase') === 'true') {
        setShowGuidance(true)
      }
    }
  }, [params.id, user, searchParams])

  // Load Acts & Sections for this case from localStorage or intelligent defaults
  useEffect(() => {
    if (!caseData) return
    const key = `case_acts_${caseData.id}`
    const saved = localStorage.getItem(key)
    if (saved) {
      try {
        setActsList(JSON.parse(saved))
        return
      } catch {
        // ignore
      }
    }
    const typeName = (caseData.caseType?.name || '').toLowerCase()
    if (typeName.includes('138') || typeName.includes('ni') || typeName.includes('criminal')) {
      setActsList([
        { act: 'NI Act 1881', section: 'Section 138' },
        { act: 'NI Act 1881', section: 'Sec 139 Presumption Rebuttal' },
        { act: 'Indian Evidence Act', section: 'Section 65B Certificate' },
      ])
    } else if (typeName.includes('writ')) {
      setActsList([
        { act: 'Constitution of India', section: 'Article 226' },
        { act: 'CPC 1908', section: 'Order 39 Rule 1 & 2' },
      ])
    } else {
      setActsList([
        { act: 'CPC 1908', section: 'Section 151 Inherent Powers' },
        { act: 'Indian Evidence Act', section: 'Section 65B Certificate' },
      ])
    }
  }, [caseData?.id, caseData?.caseType?.name])

  const saveActsToStorage = (updated: ActTag[]) => {
    setActsList(updated)
    if (caseData) {
      localStorage.setItem(`case_acts_${caseData.id}`, JSON.stringify(updated))
    }
  }

  const handleAddAct = () => {
    if (!newActName.trim() || !newSectionName.trim()) {
      toast.error('Please enter both Act name and Section')
      return
    }
    const updated = [...actsList, { act: newActName.trim(), section: newSectionName.trim() }]
    saveActsToStorage(updated)
    setNewActName('')
    setNewSectionName('')
    setShowAddActDialog(false)
    toast.success('Act & Section added')
  }

  const handleRemoveAct = (idx: number) => {
    const updated = actsList.filter((_, i) => i !== idx)
    saveActsToStorage(updated)
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
    } catch (err) {
      console.error('Error fetching courts and case types:', err)
    }
  }

  const handleEditCourtDetails = () => {
    if (!caseData) return
    setCourtDetailsForm({
      courtId: caseData.court?.id || '',
      courtNumber: caseData.courtNumber || '',
      caseTypeId: caseData.caseType?.id || '',
      judgeName: caseData.judgeName || '',
      cnrNumber: caseData.cnrNumber || '',
    })
    fetchCourtsAndTypes()
    setEditingCourtDetails(true)
  }

  const handleEditCnr = () => {
    if (!caseData) return
    setCnrForm(caseData.cnrNumber || '')
    setEditingCnr(true)
  }

  const handleSaveCnr = async () => {
    if (!user?.email || !caseData) return

    setSavingCnr(true)
    try {
      const response = await fetch(`/api/cases/${caseData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: user.email,
          cnrNumber: cnrForm.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save CNR')
      }

      toast.success('CNR saved successfully')
      setEditingCnr(false)
      fetchCase()
    } catch {
      toast.error('Failed to save CNR. Please try again.')
    } finally {
      setSavingCnr(false)
    }
  }

  const handleCopyCnr = async (cnr: string) => {
    try {
      await navigator.clipboard.writeText(cnr)
      setCopiedCnr(true)
      toast.success('CNR copied to clipboard')
      setTimeout(() => setCopiedCnr(false), 2000)
    } catch {
      toast.error('Failed to copy CNR')
    }
  }

  const handleShareDossier = async () => {
    if (!caseData) return
    const shareText = `Case Dossier: ${caseData.caseNumber}${
      caseData.cnrNumber ? ` (CNR: ${caseData.cnrNumber})` : ''
    } — ${getClientName()} vs ${caseData.opponentMainParty}`
    try {
      await navigator.clipboard.writeText(`${shareText}\n${window.location.href}`)
      toast.success('Case dossier link & summary copied to clipboard')
    } catch {
      toast.error('Failed to copy dossier link')
    }
  }

  const handleSaveCourtDetails = async () => {
    if (!user?.email || !caseData) return

    setSavingCourtDetails(true)
    try {
      const response = await fetch(`/api/cases/${caseData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: user.email,
          ...courtDetailsForm,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save court details')
      }

      toast.success('Court & Registry metadata saved')
      setEditingCourtDetails(false)
      fetchCase()
    } catch {
      toast.error('Something went wrong. Try again.')
    } finally {
      setSavingCourtDetails(false)
    }
  }

  const handleEditSynopsis = () => {
    if (!caseData) return
    const fallbackCrux = caseData.synopsis
      ? caseData.synopsis.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
      : ''
    setSynopsisForm({
      cruxOfDispute: caseData.cruxOfDispute || fallbackCrux,
      prayerRelief: caseData.prayerRelief || '',
      keyIssues: caseData.keyIssues || '',
      interimOrders: caseData.interimOrders || '',
      interimOrderValidUntil: caseData.interimOrderValidUntil || '',
    })
    setEditingSynopsis(true)
  }

  const handleSaveSynopsis = async () => {
    if (!user?.email || !caseData) return

    setSavingSynopsis(true)
    try {
      const summaryParts = [
        synopsisForm.cruxOfDispute
          ? `Crux of the Dispute: ${synopsisForm.cruxOfDispute.trim()}`
          : '',
        synopsisForm.prayerRelief
          ? `Prayer / Relief Claimed: ${synopsisForm.prayerRelief.trim()}`
          : '',
        synopsisForm.keyIssues
          ? `Key Issues / Question of Law: ${synopsisForm.keyIssues.trim()}`
          : '',
        synopsisForm.interimOrders
          ? `Interim Orders in Force: ${synopsisForm.interimOrders.trim()}${
              synopsisForm.interimOrderValidUntil
                ? ` (Extended up to ${synopsisForm.interimOrderValidUntil})`
                : ''
            }`
          : '',
      ].filter(Boolean)

      const response = await fetch(`/api/cases/${caseData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: user.email,
          cruxOfDispute: synopsisForm.cruxOfDispute,
          prayerRelief: synopsisForm.prayerRelief,
          keyIssues: synopsisForm.keyIssues,
          interimOrders: synopsisForm.interimOrders,
          interimOrderValidUntil: synopsisForm.interimOrderValidUntil,
          synopsis: summaryParts.join('\n\n') || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save synopsis')
      }

      toast.success('Case synopsis saved')
      setEditingSynopsis(false)
      fetchCase()
    } catch {
      toast.error('Something went wrong. Try again.')
    } finally {
      setSavingSynopsis(false)
    }
  }

  const handleEditOpposingCounsel = () => {
    if (!caseData) return
    setOpposingCounselForm({
      opponentMainParty: caseData.opponentMainParty || '',
      opponentOtherParties: caseData.opponentOtherParties?.join(', ') || '',
      opposingCounselName: caseData.opposingCounselName || '',
      opposingCounselPhone: caseData.opposingCounselPhone || '',
      opposingCounselStrategy: caseData.opposingCounselStrategy || '',
    })
    setEditingOpposingCounsel(true)
  }

  const handleSaveOpposingCounsel = async () => {
    if (!user?.email || !caseData) return

    setSavingOpposingCounsel(true)
    try {
      const response = await fetch(`/api/cases/${caseData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: user.email,
          opponentMainParty: opposingCounselForm.opponentMainParty,
          opponentOtherParties: opposingCounselForm.opponentOtherParties
            ? opposingCounselForm.opponentOtherParties
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
          opposingCounselName: opposingCounselForm.opposingCounselName,
          opposingCounselPhone: opposingCounselForm.opposingCounselPhone,
          opposingCounselStrategy: opposingCounselForm.opposingCounselStrategy,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save opposing party & counsel details')
      }

      toast.success('Opposing party & counsel details saved')
      setEditingOpposingCounsel(false)
      fetchCase()
    } catch {
      toast.error('Something went wrong. Try again.')
    } finally {
      setSavingOpposingCounsel(false)
    }
  }

  const handleEditClient = () => {
    if (!caseData) return
    setClientForm({
      otherParties: caseData.otherParties?.join(', ') || '',
    })
    setEditingClient(true)
  }

  const handleSaveClient = async () => {
    if (!user?.email || !caseData) return

    setSavingClient(true)
    try {
      const response = await fetch(`/api/cases/${caseData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: user.email,
          otherParties: clientForm.otherParties
            ? clientForm.otherParties
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save client details')
      }

      toast.success('Client profile updated')
      setEditingClient(false)
      fetchCase()
    } catch {
      toast.error('Something went wrong. Try again.')
    } finally {
      setSavingClient(false)
    }
  }

  const handleOpenAssignModal = async () => {
    if (!user?.email || !caseData) return
    setSelectedTeamIds(caseData.assignments.map((a) => a.user.id))
    setShowAssignDialog(true)
    try {
      const res = await fetch(`/api/team?email=${encodeURIComponent(user.email)}`)
      if (res.ok) {
        const data = await res.json()
        setAllTeamMembers(data.users || [])
      }
    } catch (err) {
      console.error('Error loading team:', err)
    }
  }

  const handleSaveTeamAssignments = async () => {
    if (!user?.email || !caseData) return
    setSavingTeam(true)
    try {
      const res = await fetch(`/api/cases/${caseData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: user.email,
          assignedUserIds: selectedTeamIds,
        }),
      })
      if (!res.ok) throw new Error('Failed to update assignments')
      toast.success('Chamber team updated')
      setShowAssignDialog(false)
      fetchCase()
    } catch {
      toast.error('Failed to update team assignments')
    } finally {
      setSavingTeam(false)
    }
  }

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!uploadData.file) {
      toast.error('Please select a file')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', uploadData.file)
      formData.append('title', uploadData.title)
      formData.append('documentType', uploadData.documentType)
      formData.append('caseId', caseData!.id)
      formData.append('userEmail', user?.email || '')

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        toast.success(`Sustained! Document "${uploadData.title}" was uploaded`)
        setShowUploadDialog(false)
        setUploadData({ title: '', documentType: 'OTHER', file: null })
        fetchCase()
      } else {
        const text = await response.text()
        let errorMessage = 'Failed to upload document'

        try {
          const data = JSON.parse(text)
          errorMessage = data.error || errorMessage
        } catch {
          if (text.includes('Request Entity Too Large')) {
            errorMessage = 'File is too large. Maximum size is 50MB.'
          } else if (text) {
            errorMessage = text.substring(0, 100)
          }
        }
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error('Error uploading document:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload document')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 w-full">
        <div className="h-8 w-48 bg-white border border-[#e2e8f0] rounded-lg animate-pulse" />
        <div className="h-52 bg-white border border-[#e2e8f0] rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-white border border-[#e2e8f0] rounded-2xl animate-pulse" />
          <div className="h-80 bg-white border border-[#e2e8f0] rounded-2xl animate-pulse" />
        </div>
      </div>
    )
  }

  if (error || !caseData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-lg text-destructive mb-4">{error || 'Case not found'}</div>
          <Button onClick={() => router.push('/cases')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cases
          </Button>
        </div>
      </div>
    )
  }

  const getClientName = () => {
    if (caseData.client) {
      return `${caseData.client.firstName} ${caseData.client.lastName || ''}`.trim()
    }
    return caseData.otherParties[0] || 'Unknown'
  }

  // Strip HTML helper
  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()

  const sortedChronologicalHearings = [...(caseData.hearings || [])].sort(
    (a, b) => new Date(a.hearingDate).getTime() - new Date(b.hearingDate).getTime()
  )

  const nowTime = new Date().getTime()
  const isHearingCompleted = (h: Case['hearings'][number]) => {
    const hasOutcome = Boolean(h.outcome && stripHtml(h.outcome).length > 0)
    const hasNotes = Boolean(h.notes && h.notes.length > 0 && h.notes[0].content?.trim())
    if (hasOutcome || hasNotes) return true
    return new Date(h.hearingDate).getTime() < nowTime
  }

  const completedHearings = sortedChronologicalHearings.filter(isHearingCompleted)
  const upcomingHearings = sortedChronologicalHearings.filter((h) => !isHearingCompleted(h))

  // Most recent hearing with recorded outcome/proceedings (or fallback to latest hearing)
  const latestRecordedHearing =
    [...completedHearings].reverse().find((h) => h.outcome || h.notes?.length) ||
    completedHearings[completedHearings.length - 1] ||
    caseData.hearings?.[0]

  const latestHearing = caseData.hearings?.[0]
  const nextHearingDateObj = caseData.nextHearingDate ? new Date(caseData.nextHearingDate) : null
  const daysToNextHearing = nextHearingDateObj
    ? differenceInCalendarDays(nextHearingDateObj, new Date())
    : null

  // Check if caseData.nextHearingDate is already present in caseData.hearings
  const nextHearingInHearingsList = nextHearingDateObj
    ? sortedChronologicalHearings.some(
        (h) =>
          format(new Date(h.hearingDate), 'yyyy-MM-dd') ===
          format(nextHearingDateObj, 'yyyy-MM-dd')
      )
    : false

  const getDaysPillLabel = () => {
    if (!nextHearingDateObj || daysToNextHearing === null) return null
    if (isToday(nextHearingDateObj)) return 'Today'
    if (isTomorrow(nextHearingDateObj)) return 'Tomorrow'
    if (daysToNextHearing > 0) return `In ${daysToNextHearing} days`
    return `${Math.abs(daysToNextHearing)}d ago`
  }

  const proceduralStageTitle =
    latestRecordedHearing?.outcome && stripHtml(latestRecordedHearing.outcome)
      ? stripHtml(latestRecordedHearing.outcome).slice(0, 32)
      : caseData.status === 'CLOSED'
      ? 'Case Disposed'
      : completedHearings.length > 0
      ? `Hearing #${completedHearings.length} Completed`
      : 'Case Instituted'

  const proceduralStageSub =
    latestRecordedHearing?.notes?.[0]?.content ||
    (latestRecordedHearing
      ? `Last heard ${format(new Date(latestRecordedHearing.hearingDate), 'MMM d, yyyy')}`
      : `Filed ${format(new Date(caseData.filingDate), 'MMM d, yyyy')}`)

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return 'PDF • 420 KB'
    const kb = Math.round(bytes / 1024)
    if (kb >= 1024) {
      return `PDF • ${(kb / 1024).toFixed(1)} MB`
    }
    return `PDF • ${kb} KB`
  }

  const plainSynopsis = caseData.synopsis ? stripHtml(caseData.synopsis) : ''
  const connectedMattersList = caseData.connectedMatters || []

  return (
    <div className="space-y-6 w-full">
      {/* Guidance Banner for Newly Created Case */}
      {showGuidance && (
        <div className="rounded-2xl border border-[#c3c6d7] bg-gradient-to-r from-[#eef2ff] to-white p-5 flex items-start justify-between gap-4 shadow-2xs">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#004ac6] flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#131b2e]">
                Case Dossier Initialized! Complete your registry parameters below:
              </h3>
              <p className="text-xs md:text-sm text-[#545f73] mt-0.5">
                Record the 16-digit CNR number, court hall, judge name, opposing counsel, and upload initial pleadings.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowGuidance(false)}
            className="p-1.5 rounded-lg text-[#545f73] hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Breadcrumb Bar */}
      <div className="flex items-center gap-2 text-xs md:text-sm">
        <Link
          href="/cases"
          className="inline-flex items-center gap-1.5 text-[#545f73] hover:text-[#004ac6] font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Cases</span>
        </Link>
        <span className="text-[#c3c6d7]">/</span>
        <span className="font-bold text-[#131b2e]">{caseData.caseNumber}</span>
      </div>

      {/* Main Hero Header Card */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 md:p-6 shadow-xs space-y-6">
        {/* Top Row: Case Title, Badges & Action Buttons */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#004ac6] flex items-center justify-center shadow-sm shadow-[#004ac6]/20 shrink-0 mt-0.5">
              <Gavel className="h-6 w-6 text-white" />
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl md:text-3xl font-extrabold text-[#131b2e] tracking-tight">
                  {caseData.caseNumber}
                </h1>

                {/* Status Pill */}
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                    caseData.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : caseData.status === 'PENDING'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      caseData.status === 'ACTIVE'
                        ? 'bg-emerald-500'
                        : caseData.status === 'PENDING'
                        ? 'bg-amber-500'
                        : 'bg-slate-400'
                    }`}
                  />
                  {caseData.status}
                </span>

                {/* Case Type Pill */}
                {caseData.caseType && (
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-[#f2f4f8] text-[#545f73] border border-[#e2e8f0]">
                    {caseData.caseType.name}
                  </span>
                )}
              </div>

              {/* Parties & Appearing For */}
              <div className="flex flex-wrap items-center gap-2 text-sm md:text-base">
                <span className="font-bold text-[#131b2e]">{getClientName()}</span>
                <span className="text-xs font-semibold uppercase text-[#737686]">vs</span>
                <span className="font-bold text-[#131b2e]">{caseData.opponentMainParty}</span>
                <span className="text-[#c3c6d7] mx-0.5">•</span>
                <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#eef2ff] text-[#004ac6]">
                  Appearing for: {caseData.appearingFor}
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link href={`/cases/${caseData.id}/edit`}>
              <Button
                variant="outline"
                size="sm"
                className="h-10 px-4 rounded-xl border-[#e2e8f0] bg-white hover:bg-[#f8f9ff] text-[#131b2e] font-semibold text-xs md:text-sm gap-2 cursor-pointer"
              >
                <Edit className="h-4 w-4 text-[#545f73]" />
                <span>Edit Case</span>
              </Button>
            </Link>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleShareDossier}
              className="h-10 px-4 rounded-xl border-[#e2e8f0] bg-white hover:bg-[#f8f9ff] text-[#131b2e] font-semibold text-xs md:text-sm gap-2 cursor-pointer"
            >
              <Share2 className="h-4 w-4 text-[#545f73]" />
              <span>Share Dossier</span>
            </Button>

            <HearingForm
              caseId={caseData.id}
              userEmail={user?.email || ''}
              onSuccess={fetchCase}
              buttonLabel="+ Add Hearing"
              buttonClassName="h-10 px-4 rounded-xl bg-[#004ac6] hover:bg-[#1d4ed8] text-white font-semibold text-xs md:text-sm shadow-sm shadow-[#004ac6]/20 cursor-pointer"
            />
          </div>
        </div>

        {/* 4 Summary Metric Boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Judicial Forum */}
          <div className="rounded-xl border border-[#e2e8f0] bg-[#fcfdff] p-3.5 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#eef2ff] text-[#004ac6] flex items-center justify-center shrink-0 mt-0.5">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#737686]">
                Judicial Forum
              </p>
              <p className="text-sm md:text-base font-extrabold text-[#131b2e] truncate mt-0.5">
                {caseData.court?.name || 'Not Specified'}
              </p>
              <p className="text-xs text-[#545f73] truncate mt-0.5">
                {caseData.courtNumber ? `Court Hall ${caseData.courtNumber}` : 'Court Hall TBD'}
                {caseData.judgeName ? ` • ${caseData.judgeName}` : ' • Single Bench'}
              </p>
            </div>
          </div>

          {/* Card 2: Category */}
          <div className="rounded-xl border border-[#e2e8f0] bg-[#fcfdff] p-3.5 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#eef2ff] text-[#004ac6] flex items-center justify-center shrink-0 mt-0.5">
              <Network className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#737686]">
                Category
              </p>
              <p className="text-sm md:text-base font-extrabold text-[#131b2e] truncate mt-0.5">
                {caseData.caseType?.name || 'General Litigation'}
              </p>
              <p className="text-xs text-[#545f73] truncate mt-0.5">
                {caseData.caseNumber}
              </p>
            </div>
          </div>

          {/* Card 3: Procedural Stage */}
          <div className="rounded-xl border border-[#e2e8f0] bg-[#fcfdff] p-3.5 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#eef2ff] text-[#004ac6] flex items-center justify-center shrink-0 mt-0.5">
              <Users className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#737686]">
                Procedural Stage
              </p>
              <p className="text-sm md:text-base font-extrabold text-[#131b2e] truncate mt-0.5">
                {proceduralStageTitle}
              </p>
              <p className="text-xs text-[#545f73] truncate mt-0.5">
                {proceduralStageSub}
              </p>
            </div>
          </div>

          {/* Card 4: Next Listing (Tinted Blue Box) */}
          <div className="rounded-xl border border-[#c7d7fe] bg-[#eef4ff] p-3.5 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#004ac6] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <Calendar className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#004ac6]">
                  Next Listing
                </p>
                {getDaysPillLabel() && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#dbeafe] text-[#004ac6]">
                    {getDaysPillLabel()}
                  </span>
                )}
              </div>
              <p className="text-sm md:text-base font-extrabold text-[#131b2e] truncate mt-0.5">
                {nextHearingDateObj
                  ? format(nextHearingDateObj, 'MMM d, yyyy')
                  : 'Not Scheduled'}
              </p>
              <p className="text-xs font-semibold text-[#004ac6] truncate mt-0.5">
                {latestHearing?.itemNumber ? `Item #${latestHearing.itemNumber} • ` : ''}
                {nextHearingDateObj ? format(nextHearingDateObj, 'hh:mm a') : 'Awaiting Cause List'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="border-b border-[#e2e8f0] overflow-x-auto">
          <TabsList className="inline-flex h-auto bg-transparent p-0 gap-2 sm:gap-6 min-w-full sm:min-w-0 justify-start">
            <TabsTrigger
              value="overview"
              className="relative rounded-none border-b-2 border-transparent px-2 py-3 text-xs md:text-sm font-bold text-[#545f73] hover:text-[#004ac6] data-active:!text-[#004ac6] data-active:!border-b-[#004ac6] data-active:!bg-transparent transition-all flex items-center gap-2 cursor-pointer"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>

            <TabsTrigger
              value="timeline"
              className="relative rounded-none border-b-2 border-transparent px-2 py-3 text-xs md:text-sm font-bold text-[#545f73] hover:text-[#004ac6] data-active:!text-[#004ac6] data-active:!border-b-[#004ac6] data-active:!bg-transparent transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <History className="h-4 w-4" />
              <span>Case History</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#e2e8f0] text-[#131b2e]">
                {caseData.hearings.length}
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="documents"
              className="relative rounded-none border-b-2 border-transparent px-2 py-3 text-xs md:text-sm font-bold text-[#545f73] hover:text-[#004ac6] data-active:!text-[#004ac6] data-active:!border-b-[#004ac6] data-active:!bg-transparent transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <FolderOpen className="h-4 w-4" />
              <span>Documents &amp; Orders</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#e2e8f0] text-[#131b2e]">
                {caseData.documents.length}
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="ai"
              className="relative rounded-none border-b-2 border-transparent px-2 py-3 text-xs md:text-sm font-bold text-[#545f73] hover:text-[#004ac6] data-active:!text-[#004ac6] data-active:!border-b-[#004ac6] data-active:!bg-transparent transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              <span>AI Legal Copilot</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-[#eef2ff] text-[#004ac6] border border-[#c7d7fe]">
                BETA
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="connected"
              className="relative rounded-none border-b-2 border-transparent px-2 py-3 text-xs md:text-sm font-bold text-[#545f73] hover:text-[#004ac6] data-active:!text-[#004ac6] data-active:!border-b-[#004ac6] data-active:!bg-transparent transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <Link2 className="h-4 w-4" />
              <span>Connected Matters</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#e2e8f0] text-[#131b2e]">
                {connectedMattersList.length}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          {/* ROW 1: Client Profile & Opposing Party & Counsel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT CARD: Client Profile */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-xs flex flex-col justify-between space-y-5">
              <div className="space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#eef2ff] text-[#004ac6] flex items-center justify-center shrink-0">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base md:text-lg font-bold text-[#131b2e]">
                        Client Profile
                      </h3>
                      <p className="text-xs text-[#545f73]">Authorized Instructing Party</p>
                    </div>
                  </div>
                  {!editingClient && (
                    <button
                      type="button"
                      onClick={handleEditClient}
                      className="p-2 rounded-lg text-[#545f73] hover:bg-[#f2f4f8] hover:text-[#131b2e] transition-colors cursor-pointer"
                      title="Edit Client Parties"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {editingClient ? (
                  <div className="space-y-4 pt-2 border-t border-[#e2e8f0]">
                    <div className="space-y-1.5">
                      <Label htmlFor="otherParties" className="text-xs font-semibold">
                        Additional Client Parties (comma-separated)
                      </Label>
                      <Input
                        id="otherParties"
                        value={clientForm.otherParties}
                        onChange={(e) =>
                          setClientForm({ ...clientForm, otherParties: e.target.value })
                        }
                        placeholder="e.g., Co-Petitioner 2, Co-Petitioner 3"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingClient(false)}
                        disabled={savingClient}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSaveClient}
                        disabled={savingClient}
                        className="bg-[#004ac6] hover:bg-[#1d4ed8]"
                      >
                        {savingClient ? 'Saving...' : 'Save'}
                      </Button>
                      {caseData.client && (
                        <Link href={`/clients/${caseData.client.id}/edit`} className="ml-auto">
                          <Button type="button" variant="ghost" size="sm" className="text-xs text-[#004ac6]">
                            Edit Full Client Record →
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Appearing For */}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#737686] mb-1.5">
                        Appearing For
                      </p>
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#eef2ff] text-[#004ac6] text-xs font-bold border border-[#c7d7fe]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#004ac6]" />
                        {caseData.appearingFor === 'RESPONDENT'
                          ? 'RESPONDENT (ACCUSED)'
                          : 'PETITIONER (COMPLAINANT)'}
                      </span>
                    </div>

                    {/* Client Legal Name */}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#737686] mb-1">
                        Client Legal Name
                      </p>
                      <p className="text-lg font-extrabold text-[#131b2e]">{getClientName()}</p>
                      <p className="text-xs text-[#545f73] mt-0.5">
                        {caseData.otherParties && caseData.otherParties.length > 0
                          ? `Along with: ${caseData.otherParties.join(', ')}`
                          : 'Primary Instructing Client'}
                      </p>
                    </div>

                    {/* Direct Communications */}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#737686] mb-2">
                        Direct Communications
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        {caseData.client?.phone ? (
                          <>
                            <a
                              href={`tel:${caseData.client.phone}`}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#f2f4f8] hover:bg-[#e2e7ff] text-xs font-semibold text-[#131b2e] transition-colors"
                            >
                              <Phone className="h-3.5 w-3.5 text-[#004ac6]" />
                              <span>{caseData.client.phone}</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                const cleanPhone = caseData.client!.phone.replace(/\D/g, '')
                                const msg = `Dear ${caseData.client!.firstName}, regarding your case ${caseData.caseNumber}:`
                                window.open(
                                  `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`,
                                  '_blank'
                                )
                              }}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-xs font-semibold text-emerald-800 border border-emerald-200 transition-colors cursor-pointer"
                            >
                              <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                              <span>WhatsApp Brief</span>
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-[#737686]">No phone recorded</span>
                        )}

                        {caseData.client?.email && (
                          <a
                            href={`mailto:${caseData.client.email}`}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#f2f4f8] hover:bg-[#e2e7ff] text-xs font-semibold text-[#131b2e] transition-colors"
                          >
                            <Mail className="h-3.5 w-3.5 text-[#545f73]" />
                            <span>{caseData.client.email}</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Registered Address */}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#737686] mb-1">
                        Registered Address
                      </p>
                      <p className="text-xs md:text-sm font-medium text-[#131b2e]">
                        {caseData.client?.address || 'Address not recorded in client profile'}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Bottom Highlight Callout Box */}
              <div className="rounded-xl bg-[#fffbeb] border border-[#fde68a] p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900">
                      Client Instructions &amp; Retainer Note
                    </p>
                    <p className="text-xs text-amber-800 truncate mt-0.5">
                      {caseData.client?.lawyerNotes ||
                        `Primary representation for ${caseData.caseType?.name || 'matter'} before ${
                          caseData.court?.name || 'Court'
                        }`}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-amber-950 shrink-0">
                  {caseData.status}
                </span>
              </div>
            </div>

            {/* RIGHT CARD: Opposing Party & Counsel */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-xs flex flex-col justify-between space-y-5">
              <div className="space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#f2f4f8] text-[#334155] flex items-center justify-center shrink-0">
                      <Scale className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base md:text-lg font-bold text-[#131b2e]">
                        Opposing Party &amp; Counsel
                      </h3>
                      <p className="text-xs text-[#545f73]">Adversary Representation</p>
                    </div>
                  </div>
                  {!editingOpposingCounsel && (
                    <button
                      type="button"
                      onClick={handleEditOpposingCounsel}
                      className="p-2 rounded-lg text-[#545f73] hover:bg-[#f2f4f8] hover:text-[#131b2e] transition-colors cursor-pointer"
                      title="Edit Opposing Party & Counsel"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {editingOpposingCounsel ? (
                  <div className="space-y-3.5 pt-2 border-t border-[#e2e8f0]">
                    <div className="space-y-1">
                      <Label htmlFor="opponentMainParty" className="text-xs font-semibold">
                        Complainant / Main Opponent Party *
                      </Label>
                      <Input
                        id="opponentMainParty"
                        value={opposingCounselForm.opponentMainParty}
                        onChange={(e) =>
                          setOpposingCounselForm({
                            ...opposingCounselForm,
                            opponentMainParty: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="opponentOtherParties" className="text-xs font-semibold">
                        Additional Opponent Parties (comma-separated)
                      </Label>
                      <Input
                        id="opponentOtherParties"
                        value={opposingCounselForm.opponentOtherParties}
                        onChange={(e) =>
                          setOpposingCounselForm({
                            ...opposingCounselForm,
                            opponentOtherParties: e.target.value,
                          })
                        }
                        placeholder="e.g., State, Respondent No. 2"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="opposingCounselName" className="text-xs font-semibold">
                        Opposing Advocate / Chamber
                      </Label>
                      <Input
                        id="opposingCounselName"
                        value={opposingCounselForm.opposingCounselName}
                        onChange={(e) =>
                          setOpposingCounselForm({
                            ...opposingCounselForm,
                            opposingCounselName: e.target.value,
                          })
                        }
                        placeholder="e.g., Adv. K. G. Raghavan & Associates"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="opposingCounselPhone" className="text-xs font-semibold">
                        Opposing Counsel Phone
                      </Label>
                      <Input
                        id="opposingCounselPhone"
                        value={opposingCounselForm.opposingCounselPhone}
                        onChange={(e) =>
                          setOpposingCounselForm({
                            ...opposingCounselForm,
                            opposingCounselPhone: e.target.value,
                          })
                        }
                        placeholder="e.g., +91 94470 55120"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="opposingCounselStrategy" className="text-xs font-semibold">
                        Known Advocate Demeanor &amp; Strategy
                      </Label>
                      <textarea
                        id="opposingCounselStrategy"
                        rows={3}
                        value={opposingCounselForm.opposingCounselStrategy}
                        onChange={(e) =>
                          setOpposingCounselForm({
                            ...opposingCounselForm,
                            opposingCounselStrategy: e.target.value,
                          })
                        }
                        placeholder="e.g., Strict on statutory 15-day notice limits. Frequently moves applications for commission examination..."
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-[#131b2e] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#004ac6]/30"
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingOpposingCounsel(false)}
                        disabled={savingOpposingCounsel}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSaveOpposingCounsel}
                        disabled={savingOpposingCounsel}
                        className="bg-[#004ac6] hover:bg-[#1d4ed8]"
                      >
                        {savingOpposingCounsel ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Complainant / Petitioner */}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#737686] mb-1">
                        {caseData.appearingFor === 'RESPONDENT'
                          ? 'Complainant / Petitioner'
                          : 'Respondent / Opposite Party'}
                      </p>
                      <p className="text-lg font-extrabold text-[#131b2e]">
                        {caseData.opponentMainParty}
                      </p>
                      <p className="text-xs text-[#545f73] mt-0.5">
                        {caseData.opponentOtherParties && caseData.opponentOtherParties.length > 0
                          ? caseData.opponentOtherParties.join(', ')
                          : 'Primary Opposite Party on Record'}
                      </p>
                    </div>

                    {/* Opposing Advocate / Chamber */}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#737686] mb-1">
                        Opposing Advocate / Chamber
                      </p>
                      <p className="text-base font-bold text-[#131b2e]">
                        {caseData.opposingCounselName || 'Advocate not yet entered on record'}
                      </p>
                      <p className="text-xs text-[#545f73] mt-0.5">
                        {caseData.court?.name
                          ? `${caseData.court.name} Bar Association`
                          : 'High Court / District Court Bar'}
                      </p>
                    </div>

                    {/* Opposing Contact & Registry Mail */}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#737686] mb-2">
                        Opposing Contact &amp; Registry Mail
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        {caseData.opposingCounselPhone ? (
                          <a
                            href={`tel:${caseData.opposingCounselPhone}`}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#f2f4f8] hover:bg-[#e2e7ff] text-xs font-semibold text-[#131b2e] transition-colors"
                          >
                            <Phone className="h-3.5 w-3.5 text-[#545f73]" />
                            <span>{caseData.opposingCounselPhone}</span>
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={handleEditOpposingCounsel}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-[#c3c6d7] text-xs font-semibold text-[#545f73] hover:text-[#004ac6] cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Add Counsel Contact</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Known Advocate Demeanor & Strategy Box */}
              {!editingOpposingCounsel && (
                <div className="rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] p-3.5 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#eef2ff] text-[#004ac6] flex items-center justify-center shrink-0 mt-0.5">
                    <Lightbulb className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#131b2e]">
                      Known Advocate Demeanor &amp; Strategy
                    </p>
                    {caseData.opposingCounselStrategy ? (
                      <p className="text-xs text-[#545f73] leading-relaxed mt-0.5 whitespace-pre-wrap">
                        {caseData.opposingCounselStrategy}
                      </p>
                    ) : (
                      <p className="text-xs text-[#737686] italic leading-relaxed mt-0.5">
                        No strategy notes recorded yet.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ROW 2: Court & Registry Metadata + Procedural Milestone Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT CARD: Court & Registry Metadata */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-xs flex flex-col justify-between space-y-5">
              <div className="space-y-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#eef2ff] text-[#004ac6] flex items-center justify-center shrink-0">
                      <Network className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base md:text-lg font-bold text-[#131b2e]">
                        Court &amp; Registry Metadata
                      </h3>
                      <p className="text-xs text-[#545f73]">Court &amp; Filing Parameters</p>
                    </div>
                  </div>
                  {!editingCourtDetails && (
                    <button
                      type="button"
                      onClick={handleEditCourtDetails}
                      className="p-2 rounded-lg text-[#545f73] hover:bg-[#f2f4f8] hover:text-[#131b2e] transition-colors cursor-pointer"
                      title="Edit Court & CNR Details"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {editingCourtDetails ? (
                  <div className="space-y-4 pt-2 border-t border-[#e2e8f0]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Court</Label>
                        <Select
                          value={courtDetailsForm.courtId || undefined}
                          onValueChange={(value) =>
                            setCourtDetailsForm({ ...courtDetailsForm, courtId: value || '' })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select court" />
                          </SelectTrigger>
                          <SelectContent>
                            {courts.map((court) => (
                              <SelectItem key={court.id} value={court.id}>
                                {court.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Court Hall / Number</Label>
                        <Input
                          value={courtDetailsForm.courtNumber}
                          onChange={(e) =>
                            setCourtDetailsForm({ ...courtDetailsForm, courtNumber: e.target.value })
                          }
                          placeholder="e.g., 04"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Case Type</Label>
                        <Select
                          value={courtDetailsForm.caseTypeId || undefined}
                          onValueChange={(value) =>
                            setCourtDetailsForm({ ...courtDetailsForm, caseTypeId: value || '' })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select case type" />
                          </SelectTrigger>
                          <SelectContent>
                            {caseTypes.map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Bench / Judge Name</Label>
                        <Input
                          value={courtDetailsForm.judgeName}
                          onChange={(e) =>
                            setCourtDetailsForm({ ...courtDetailsForm, judgeName: e.target.value })
                          }
                          placeholder="e.g., Hon'ble Justice S. Muraleedharan"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">
                        CNR Number (16-Digit Universal)
                      </Label>
                      <Input
                        value={courtDetailsForm.cnrNumber}
                        onChange={(e) =>
                          setCourtDetailsForm({ ...courtDetailsForm, cnrNumber: e.target.value })
                        }
                        placeholder="e.g., KLHC010045202025"
                        className="font-mono uppercase"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingCourtDetails(false)}
                        disabled={savingCourtDetails}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSaveCourtDetails}
                        disabled={savingCourtDetails}
                        className="bg-[#004ac6] hover:bg-[#1d4ed8]"
                      >
                        {savingCourtDetails ? 'Saving...' : 'Save Metadata'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* 2-col Jurisdiction Court & Bench */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#737686] mb-1">
                          Jurisdiction Court
                        </p>
                        <p className="text-sm md:text-base font-extrabold text-[#131b2e]">
                          {caseData.court?.name || 'Not Specified'}
                        </p>
                        <p className="text-xs text-[#545f73] mt-0.5">
                          {caseData.caseType?.name
                            ? `${caseData.caseType.name} Roster`
                            : 'Original / Appellate Jurisdiction'}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#737686] mb-1">
                          Bench &amp; Coram
                        </p>
                        <p className="text-sm md:text-base font-extrabold text-[#131b2e]">
                          {caseData.courtNumber
                            ? `Court Hall ${caseData.courtNumber}`
                            : 'Court Hall TBD'}
                        </p>
                        <p className="text-xs text-[#545f73] mt-0.5">
                          {caseData.judgeName || 'Presiding Bench'}
                        </p>
                      </div>
                    </div>

                    {/* Prominent 16-Digit CNR Box with Copy & Inline Entry */}
                    <div className="rounded-xl bg-[#f4f6fb] border border-[#dce4f5] p-3.5">
                      {editingCnr ? (
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-[#545f73]">
                            CNR Number (16-Digit Universal)
                          </Label>
                          <div className="flex items-center gap-2">
                            <Input
                              value={cnrForm}
                              onChange={(e) => setCnrForm(e.target.value)}
                              placeholder="Enter 16-digit CNR (e.g., KLHC010045202025)"
                              className="h-9 font-mono uppercase bg-white text-sm"
                              autoFocus
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleSaveCnr}
                              disabled={savingCnr}
                              className="h-9 bg-[#004ac6] hover:bg-[#1d4ed8]"
                            >
                              {savingCnr ? 'Saving...' : 'Save'}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingCnr(false)}
                              disabled={savingCnr}
                              className="h-9"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#545f73]">
                              CNR Number (16-Digit Universal)
                            </p>
                            {caseData.cnrNumber ? (
                              <p className="text-sm md:text-base font-mono font-extrabold text-[#004ac6] tracking-wide mt-0.5 truncate">
                                {caseData.cnrNumber}
                              </p>
                            ) : (
                              <p className="text-xs text-[#737686] italic mt-0.5">
                                Not recorded yet — click Enter CNR to add
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {caseData.cnrNumber ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleCopyCnr(caseData.cnrNumber!)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-[#eef2ff] border border-[#cbd5e1] text-xs font-bold text-[#131b2e] shadow-2xs transition-colors cursor-pointer"
                                >
                                  {copiedCnr ? (
                                    <>
                                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                                      <span>Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3.5 w-3.5 text-[#545f73]" />
                                      <span>Copy CNR</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={handleEditCnr}
                                  className="p-1.5 rounded-lg text-[#545f73] hover:bg-white hover:text-[#004ac6] transition-colors cursor-pointer"
                                  title="Edit CNR"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                              </>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={handleEditCnr}
                                className="h-8 text-xs font-bold border-[#004ac6] text-[#004ac6] hover:bg-[#eef2ff] cursor-pointer"
                              >
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                Enter CNR
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Filing No. & Date + Registry Diary */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#737686] mb-1">
                          Filing No. &amp; Date
                        </p>
                        <p className="text-sm font-extrabold text-[#131b2e]">
                          {caseData.caseNumber}
                        </p>
                        <p className="text-xs text-[#545f73] mt-0.5">
                          Filed on {format(new Date(caseData.filingDate), 'MMM d, yyyy')}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#737686] mb-1">
                          Registry / Diary Reference
                        </p>
                        <p className="text-sm font-extrabold text-[#131b2e]">
                          {caseData.court?.name || 'Central Filing Registry'}
                        </p>
                        <p className="text-xs text-[#545f73] mt-0.5">
                          {caseData.year ? `Year ${caseData.year} Roll` : 'Active Roll'}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="pt-2 border-t border-[#f1f5f9]">
                <Link
                  href="/calendar"
                  className="text-xs font-bold text-[#004ac6] hover:underline inline-flex items-center gap-1"
                >
                  <span>View Judicial Cause List</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* RIGHT CARD: Procedural Milestone Timeline */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-xs flex flex-col justify-between space-y-5">
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#eef2ff] text-[#004ac6] flex items-center justify-center shrink-0">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base md:text-lg font-bold text-[#131b2e]">
                        Procedural Milestone Timeline
                      </h3>
                      <p className="text-xs text-[#545f73]">Chronological Progression</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('timeline')}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#004ac6] hover:underline cursor-pointer shrink-0"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>View Full History ({caseData.hearings.length})</span>
                  </button>
                </div>

                {/* Vertical Milestone Steps (Actual Case Filing + Hearings) */}
                <div className="relative pl-6 space-y-5 max-h-[340px] overflow-y-auto pr-1 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[#e2e8f0]">
                  {/* Milestone 1: Actual Case Filing Date */}
                  <div className="relative">
                    <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center ring-4 ring-white">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-xs md:text-sm font-bold text-[#131b2e]">
                        Case Filed ({caseData.caseNumber})
                      </p>
                      <span className="text-[11px] font-mono text-[#737686] shrink-0">
                        {format(new Date(caseData.filingDate), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <p className="text-xs text-[#545f73] mt-0.5">
                      {[
                        caseData.caseType?.name,
                        caseData.court?.name,
                        caseData.courtNumber ? `Court ${caseData.courtNumber}` : null,
                      ]
                        .filter(Boolean)
                        .join(' • ') || `Appearing for ${caseData.appearingFor.toLowerCase()}`}
                    </p>
                  </div>

                  {/* Actual Hearings from Case Timeline */}
                  {sortedChronologicalHearings.map((h, idx) => {
                    const hDate = new Date(h.hearingDate)
                    const completed = isHearingCompleted(h)
                    const outcomeText = h.outcome ? stripHtml(h.outcome) : ''
                    const noteText = h.notes?.map((n) => n.content).filter(Boolean).join(' • ') || ''

                    if (completed) {
                      return (
                        <div key={h.id} className="relative">
                          <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center ring-4 ring-white">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="text-xs md:text-sm font-bold text-[#131b2e]">
                              Hearing #{idx + 1}
                              {h.itemNumber ? ` • Item #${h.itemNumber}` : ''}
                            </p>
                            <span className="text-[11px] font-mono text-[#737686] shrink-0">
                              {format(hDate, 'MMM d, yyyy')}
                            </span>
                          </div>
                          {outcomeText ? (
                            <p className="text-xs text-[#545f73] mt-0.5 whitespace-pre-wrap">
                              {outcomeText}
                            </p>
                          ) : noteText ? (
                            <p className="text-xs text-[#545f73] mt-0.5 whitespace-pre-wrap">
                              {noteText}
                            </p>
                          ) : (
                            <p className="text-xs text-[#737686] mt-0.5">
                              {format(hDate, 'EEEE')} at {format(hDate, 'h:mm a')}
                              {h.nextHearingDate
                                ? ` • Adjourned to ${format(new Date(h.nextHearingDate), 'MMM d, yyyy')}`
                                : ' • No outcome notes recorded'}
                            </p>
                          )}
                          {outcomeText && noteText && (
                            <p className="text-[11px] text-[#737686] mt-0.5">{noteText}</p>
                          )}
                        </div>
                      )
                    }

                    // Scheduled / Upcoming hearing in the hearings list
                    return (
                      <div key={h.id} className="relative">
                        <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-[#eef2ff] text-[#004ac6] flex items-center justify-center ring-4 ring-white">
                          <Circle className="h-3 w-3 fill-[#004ac6]" />
                        </div>
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-xs md:text-sm font-extrabold text-[#004ac6]">
                            Scheduled Hearing #{idx + 1}
                            {h.itemNumber ? ` • Item #${h.itemNumber}` : ''}
                          </p>
                          <span className="text-[11px] font-mono font-bold text-[#004ac6] shrink-0">
                            {format(hDate, 'MMM d, yyyy')}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-[#131b2e] mt-0.5">
                          {[
                            h.itemNumber ? `Item #${h.itemNumber}` : null,
                            caseData.courtNumber ? `Court ${caseData.courtNumber}` : caseData.court?.name,
                            `${format(hDate, 'h:mm a')}`,
                          ]
                            .filter(Boolean)
                            .join(' • ')}
                        </p>
                      </div>
                    )
                  })}

                  {/* If caseData.nextHearingDate is set on the case but not already in caseData.hearings */}
                  {nextHearingDateObj && !nextHearingInHearingsList && (
                    <div className="relative">
                      <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-[#eef2ff] text-[#004ac6] flex items-center justify-center ring-4 ring-white">
                        <Circle className="h-3 w-3 fill-[#004ac6]" />
                      </div>
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-xs md:text-sm font-extrabold text-[#004ac6]">
                          Next Scheduled Hearing
                        </p>
                        <span className="text-[11px] font-mono font-bold text-[#004ac6] shrink-0">
                          {format(nextHearingDateObj, 'MMM d, yyyy')}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-[#131b2e] mt-0.5">
                        {[
                          caseData.courtNumber ? `Court ${caseData.courtNumber}` : caseData.court?.name,
                          format(nextHearingDateObj, 'h:mm a'),
                        ]
                          .filter(Boolean)
                          .join(' • ')}
                      </p>
                    </div>
                  )}

                  {/* If no upcoming hearing is scheduled */}
                  {!nextHearingDateObj && upcomingHearings.length === 0 && (
                    <div className="relative">
                      <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center ring-4 ring-white">
                        <Circle className="h-3 w-3" />
                      </div>
                      <p className="text-xs md:text-sm font-bold text-[#545f73]">
                        No Upcoming Hearing Scheduled
                      </p>
                      <p className="text-xs text-[#737686] mt-0.5">
                        Use &ldquo;+ Add Hearing&rdquo; to record proceedings or schedule the next date.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Status Footer */}
              <div className="pt-3 border-t border-[#f1f5f9] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-semibold text-[#131b2e]">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      caseData.status === 'ACTIVE'
                        ? 'bg-emerald-500'
                        : caseData.status === 'PENDING'
                        ? 'bg-amber-500'
                        : 'bg-slate-400'
                    }`}
                  />
                  <span>
                    {completedHearings.length} Completed Hearing
                    {completedHearings.length === 1 ? '' : 's'}
                    {upcomingHearings.length > 0 || (nextHearingDateObj && !nextHearingInHearingsList)
                      ? ' • 1 Upcoming'
                      : ''}
                  </span>
                </div>
                <span className="text-[#545f73]">
                  Status: <strong className="text-[#131b2e]">{caseData.status}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* ROW 3: Structured Case Synopsis (Full Width) */}
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-xs space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#eef2ff] text-[#004ac6] flex items-center justify-center shrink-0">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-bold text-[#131b2e]">
                    Case Synopsis
                  </h3>
                  <p className="text-xs text-[#545f73]">
                    Crux of Dispute, Prayer / Relief, Key Issues &amp; Interim Orders
                  </p>
                </div>
              </div>
              {!editingSynopsis && (
                <button
                  type="button"
                  onClick={handleEditSynopsis}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#545f73] hover:bg-[#f2f4f8] hover:text-[#004ac6] transition-colors cursor-pointer"
                  title="Edit Case Synopsis"
                >
                  <Edit className="h-3.5 w-3.5" />
                  <span>
                    {caseData.cruxOfDispute ||
                    caseData.prayerRelief ||
                    caseData.keyIssues ||
                    caseData.interimOrders ||
                    caseData.synopsis
                      ? 'Edit Synopsis'
                      : 'Add Synopsis'}
                  </span>
                </button>
              )}
            </div>

            {editingSynopsis ? (
              <div className="space-y-4 pt-2 border-t border-[#e2e8f0]">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* 1. Crux of the Dispute */}
                  <div className="space-y-1.5">
                    <Label htmlFor="cruxOfDispute" className="text-xs font-bold text-[#131b2e]">
                      Crux of the Dispute
                    </Label>
                    <p className="text-[11px] text-[#545f73]">
                      A 2–3 sentence distillation of the factual matrix.
                    </p>
                    <textarea
                      id="cruxOfDispute"
                      rows={4}
                      value={synopsisForm.cruxOfDispute}
                      onChange={(e) =>
                        setSynopsisForm({ ...synopsisForm, cruxOfDispute: e.target.value })
                      }
                      placeholder="Distill the core factual matrix in 2–3 sentences..."
                      className="w-full rounded-xl border border-[#cbd5e1] bg-white px-3.5 py-2.5 text-xs md:text-sm text-[#131b2e] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#004ac6]/30"
                    />
                  </div>

                  {/* 2. Prayer / Relief Claimed */}
                  <div className="space-y-1.5">
                    <Label htmlFor="prayerRelief" className="text-xs font-bold text-[#131b2e]">
                      Prayer / Relief Claimed
                    </Label>
                    <p className="text-[11px] text-[#545f73]">
                      Exactly what has been demanded from the court (e.g., Quashing of FIR No. 12/2025, Specific performance of sale agreement, Interim injunction).
                    </p>
                    <textarea
                      id="prayerRelief"
                      rows={4}
                      value={synopsisForm.prayerRelief}
                      onChange={(e) =>
                        setSynopsisForm({ ...synopsisForm, prayerRelief: e.target.value })
                      }
                      placeholder="e.g., Quashing of FIR No. 12/2025, Specific performance of sale agreement dated 14.02.2023, Interim injunction restraining alienation of suit schedule property..."
                      className="w-full rounded-xl border border-[#cbd5e1] bg-white px-3.5 py-2.5 text-xs md:text-sm text-[#131b2e] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#004ac6]/30"
                    />
                  </div>

                  {/* 3. Key Issues / Question of Law */}
                  <div className="space-y-1.5">
                    <Label htmlFor="keyIssues" className="text-xs font-bold text-[#131b2e]">
                      Key Issues / Question of Law
                    </Label>
                    <p className="text-[11px] text-[#545f73]">
                      The 2–3 fundamental points framed for adjudication.
                    </p>
                    <textarea
                      id="keyIssues"
                      rows={4}
                      value={synopsisForm.keyIssues}
                      onChange={(e) =>
                        setSynopsisForm({ ...synopsisForm, keyIssues: e.target.value })
                      }
                      placeholder="1. Whether the statutory notice was served within limitation?&#10;2. Whether there exists a legally enforceable debt?"
                      className="w-full rounded-xl border border-[#cbd5e1] bg-white px-3.5 py-2.5 text-xs md:text-sm text-[#131b2e] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#004ac6]/30"
                    />
                  </div>

                  {/* 4. Interim Orders in Force */}
                  <div className="space-y-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="interimOrders" className="text-xs font-bold text-[#131b2e]">
                        Interim Orders in Force
                      </Label>
                      <p className="text-[11px] text-[#545f73]">
                        Any active interim protection, ad-interim injunction, stay on proceedings, or bail conditions.
                      </p>
                      <textarea
                        id="interimOrders"
                        rows={2}
                        value={synopsisForm.interimOrders}
                        onChange={(e) =>
                          setSynopsisForm({ ...synopsisForm, interimOrders: e.target.value })
                        }
                        placeholder="e.g., Ad-interim stay on coercive proceedings granted; status quo ordered on suit property..."
                        className="w-full rounded-xl border border-[#cbd5e1] bg-white px-3.5 py-2 text-xs md:text-sm text-[#131b2e] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#004ac6]/30"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label
                        htmlFor="interimOrderValidUntil"
                        className="text-[11px] font-semibold text-[#545f73]"
                      >
                        Stay / Interim Order Extended Up To (Date)
                      </Label>
                      <Input
                        id="interimOrderValidUntil"
                        type="date"
                        value={synopsisForm.interimOrderValidUntil}
                        onChange={(e) =>
                          setSynopsisForm({
                            ...synopsisForm,
                            interimOrderValidUntil: e.target.value,
                          })
                        }
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingSynopsis(false)}
                    disabled={savingSynopsis}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveSynopsis}
                    disabled={savingSynopsis}
                    className="bg-[#004ac6] hover:bg-[#1d4ed8]"
                  >
                    {savingSynopsis ? 'Saving...' : 'Save Synopsis'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* 1. Crux of the Dispute */}
                <div className="rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-rose-700">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>Crux of the Dispute</span>
                  </div>
                  {caseData.cruxOfDispute || plainSynopsis ? (
                    <p className="text-xs md:text-sm leading-relaxed text-[#131b2e] whitespace-pre-wrap">
                      {caseData.cruxOfDispute || plainSynopsis}
                    </p>
                  ) : (
                    <p className="text-xs text-[#737686] italic">
                      Not recorded yet — distill the factual matrix in 2–3 sentences.
                    </p>
                  )}
                </div>

                {/* 2. Prayer / Relief Claimed */}
                <div className="rounded-xl bg-[#f4f7ff] border border-[#d0e0ff] p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#004ac6]">
                    <Scale className="h-3.5 w-3.5" />
                    <span>Prayer / Relief Claimed</span>
                  </div>
                  {caseData.prayerRelief ? (
                    <p className="text-xs md:text-sm leading-relaxed text-[#131b2e] whitespace-pre-wrap">
                      {caseData.prayerRelief}
                    </p>
                  ) : (
                    <p className="text-xs text-[#737686] italic">
                      Not recorded yet — specify the exact relief demanded from the court.
                    </p>
                  )}
                </div>

                {/* 3. Key Issues / Question of Law */}
                <div className="rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#131b2e]">
                    <Gavel className="h-3.5 w-3.5 text-[#004ac6]" />
                    <span>Key Issues / Question of Law</span>
                  </div>
                  {caseData.keyIssues ? (
                    <p className="text-xs md:text-sm leading-relaxed text-[#131b2e] whitespace-pre-wrap">
                      {caseData.keyIssues}
                    </p>
                  ) : (
                    <p className="text-xs text-[#737686] italic">
                      Not recorded yet — list the 2–3 fundamental points framed for adjudication.
                    </p>
                  )}
                </div>

                {/* 4. Interim Orders in Force */}
                <div className="rounded-xl bg-amber-50/60 border border-amber-200/80 p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-amber-900">
                      <Shield className="h-3.5 w-3.5 text-amber-700" />
                      <span>Interim Orders in Force</span>
                    </div>
                    {caseData.interimOrderValidUntil && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold">
                        <Clock className="h-3 w-3" />
                        <span>
                          Extended up to:{' '}
                          {(() => {
                            const d = new Date(caseData.interimOrderValidUntil)
                            return isNaN(d.getTime())
                              ? caseData.interimOrderValidUntil
                              : format(d, 'MMM d, yyyy')
                          })()}
                        </span>
                      </span>
                    )}
                  </div>
                  {caseData.interimOrders ? (
                    <p className="text-xs md:text-sm leading-relaxed text-[#131b2e] whitespace-pre-wrap">
                      {caseData.interimOrders}
                    </p>
                  ) : (
                    <p className="text-xs text-[#737686] italic">
                      No active interim order recorded — add stay, injunction, or bail protection details.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Acts, Statutory Provisions & Sections */}
            <div className="pt-3 border-t border-[#f1f5f9] space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-[#545f73]">
                  <Scale className="h-3.5 w-3.5 text-[#004ac6]" />
                  <span>Acts, Statutory Provisions &amp; Sections</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddActDialog(true)}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#eef2ff] hover:bg-[#e0e7ff] text-xs font-bold text-[#004ac6] border border-[#c7d7fe] transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Act &amp; Section</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {actsList.map((item, idx) => (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#eef4ff] border border-[#c7d7fe] text-xs"
                  >
                    <span className="font-extrabold text-[#004ac6] underline decoration-[#004ac6]/40">
                      {item.act}:
                    </span>
                    <span className="font-semibold text-[#131b2e]">{item.section}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAct(idx)}
                      className="text-[#737686] hover:text-rose-600 transition-colors cursor-pointer ml-1"
                      title="Remove provision"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ROW 4: Assigned Chamber Team + Key Documents at a Glance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT CARD: Assigned Chamber Team */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-xs space-y-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#eef2ff] text-[#004ac6] flex items-center justify-center shrink-0">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-bold text-[#131b2e]">
                      Assigned Chamber Team
                    </h3>
                    <p className="text-xs text-[#545f73]">Role Delegation &amp; Brief Allocation</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAssignModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#eef2ff] hover:bg-[#e0e7ff] text-xs font-bold text-[#004ac6] border border-[#c7d7fe] transition-colors cursor-pointer"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>+ Assign</span>
                </button>
              </div>

              {caseData.assignments.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#545f73]">
                  No team members assigned yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {caseData.assignments.map((assignment, idx) => {
                    const name = assignment.user.name || assignment.user.email
                    const initials = name
                      .replace(/^Adv\.?\s*/i, '')
                      .split(' ')
                      .map((p) => p[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()

                    const isAdmin = assignment.user.role === 'ADMIN'
                    const isClerk = assignment.user.role === 'CLERK'

                    const roleSub = isAdmin
                      ? 'Lead Counsel • Senior Arguer'
                      : isClerk
                      ? 'Court Clerk • Registry Filing & Certified Copies'
                      : 'Junior Associate • Cross-Examination & Research Notes'

                    const badgeText = isAdmin
                      ? 'Main Arguer'
                      : isClerk
                      ? 'Court Liaison'
                      : 'Drafting & Examination'

                    return (
                      <div
                        key={assignment.user.id}
                        className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0]"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 ${
                              idx === 0
                                ? 'bg-[#004ac6] text-white'
                                : 'bg-[#e2e8f0] text-[#131b2e]'
                            }`}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-[#131b2e] truncate">
                              {isClerk || /^adv\.?\s/i.test(name) ? name : `Adv. ${name}`}
                            </p>
                            <p className="text-xs text-[#545f73] truncate">{roleSub}</p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-[#eef2ff] text-[#004ac6] text-[11px] font-bold shrink-0">
                          {badgeText}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* RIGHT CARD: Key Documents at a Glance */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-xs flex flex-col justify-between space-y-5">
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#eef2ff] text-[#004ac6] flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base md:text-lg font-bold text-[#131b2e]">
                        Key Documents at a Glance
                      </h3>
                      <p className="text-xs text-[#545f73]">Crucial Brief Attachments</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setShowUploadDialog(true)}
                    className="h-9 px-3.5 rounded-xl bg-[#004ac6] hover:bg-[#1d4ed8] text-white text-xs font-bold gap-1.5 cursor-pointer"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload Document</span>
                  </Button>
                </div>

                {caseData.documents.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#cbd5e1] p-8 text-center space-y-2">
                    <FileText className="h-8 w-8 text-[#737686] mx-auto" />
                    <p className="text-xs md:text-sm font-semibold text-[#131b2e]">
                      No documents uploaded yet
                    </p>
                    <p className="text-xs text-[#545f73]">
                      Upload petitions, vakalatnama, annexures, or court orders.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {caseData.documents.slice(0, 4).map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => doc.driveUrl && window.open(doc.driveUrl, '_blank')}
                        className="p-3.5 rounded-xl bg-[#f8f9ff] hover:bg-[#eef2ff] border border-[#e2e8f0] flex items-center justify-between gap-2.5 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center text-[10px] font-extrabold shrink-0">
                            PDF
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs md:text-sm font-bold text-[#131b2e] truncate group-hover:text-[#004ac6]">
                              {doc.title}
                            </p>
                            <p className="text-[11px] text-[#545f73]">
                              {formatFileSize(doc.fileSize)}
                            </p>
                          </div>
                        </div>
                        <Download className="h-4 w-4 text-[#545f73] group-hover:text-[#004ac6] shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setActiveTab('documents')}
                  className="text-xs font-bold text-[#004ac6] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>View All {caseData.documents.length} Case Documents</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* CASE HISTORY TAB */}
        <TabsContent value="timeline">
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-xs">
            <HearingTimeline
              hearings={caseData.hearings}
              userEmail={user?.email || ''}
              caseId={caseData.id}
              caseNumber={caseData.caseNumber}
              client={caseData.client}
              onUpdate={fetchCase}
            />
          </div>
        </TabsContent>

        {/* DOCUMENTS & ORDERS TAB */}
        <TabsContent value="documents">
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e2e8f0]">
              <div>
                <h3 className="text-lg font-bold text-[#131b2e]">Documents &amp; Court Orders</h3>
                <p className="text-xs text-[#545f73]">
                  All pleadings, evidence annexures, and certified orders synced to Google Drive
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => setShowUploadDialog(true)}
                className="bg-[#004ac6] hover:bg-[#1d4ed8] text-white gap-2 rounded-xl cursor-pointer"
              >
                <Upload className="h-4 w-4" />
                <span>Upload Document</span>
              </Button>
            </div>

            {caseData.documents.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                <p className="text-base font-bold text-[#131b2e] mb-1">
                  No documents uploaded yet
                </p>
                <p className="text-xs text-[#545f73] mb-4">
                  Upload petitions, annexures, or interim orders for this case.
                </p>
                <Button
                  onClick={() => setShowUploadDialog(true)}
                  size="sm"
                  className="bg-[#004ac6] hover:bg-[#1d4ed8] gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload First Document
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {caseData.documents.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => doc.driveUrl && window.open(doc.driveUrl, '_blank')}
                    className="flex items-center justify-between p-4 border border-[#e2e8f0] rounded-xl hover:bg-[#f8f9ff] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center text-xs font-extrabold shrink-0">
                        PDF
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[#131b2e] truncate group-hover:text-[#004ac6]">
                          {doc.title}
                        </p>
                        <p className="text-xs text-[#545f73]">
                          Uploaded on {format(new Date(doc.createdAt), 'MMM d, yyyy')} •{' '}
                          {formatFileSize(doc.fileSize)}
                        </p>
                      </div>
                    </div>
                    <div
                      className="flex items-center gap-2 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Badge variant="outline" className="text-xs">
                        {doc.documentType}
                      </Badge>
                      {doc.driveUrl && (
                        <>
                          <a href={doc.driveUrl} target="_blank" rel="noopener noreferrer">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              title="Preview in Google Drive"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </a>
                          <a
                            href={doc.driveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              title="Download"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* AI LEGAL COPILOT TAB */}
        <TabsContent value="ai">
          <CaseAIAssistant caseId={caseData.id} />
        </TabsContent>

        {/* CONNECTED MATTERS TAB */}
        <TabsContent value="connected">
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-lg font-bold text-[#131b2e]">Connected &amp; Related Matters</h3>
              <p className="text-xs text-[#545f73]">
                Other cases linked to client <strong>{getClientName()}</strong>
              </p>
            </div>

            {connectedMattersList.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-[#e2e8f0] rounded-xl">
                <Link2 className="h-8 w-8 text-[#737686] mx-auto mb-2" />
                <p className="text-sm font-bold text-[#131b2e]">No other connected matters found</p>
                <p className="text-xs text-[#545f73] mt-0.5">
                  Any additional petitions, appeals, or cross-cases for {getClientName()} will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {connectedMattersList.map((m) => (
                  <Link
                    key={m.id}
                    href={`/cases/${m.id}`}
                    className="flex items-center justify-between p-4 rounded-xl border border-[#e2e8f0] hover:border-[#004ac6] hover:bg-[#f8f9ff] transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#004ac6]">{m.caseNumber}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {m.status}
                        </Badge>
                        {m.caseType && (
                          <span className="text-xs text-[#545f73]">• {m.caseType.name}</span>
                        )}
                      </div>
                      <p className="text-xs font-medium text-[#131b2e]">
                        {getClientName()} vs {m.opponentMainParty}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[#545f73]" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Upload Document Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a document for this case. It will be saved to Google Drive.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUploadDocument} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Document Title *</Label>
              <Input
                id="title"
                value={uploadData.title}
                onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                placeholder="e.g., Dishonoured Cheque Memo / Legal Reply"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentType">Document Type *</Label>
              <Select
                value={uploadData.documentType}
                onValueChange={(value) => {
                  if (value) setUploadData({ ...uploadData, documentType: value })
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PETITION">Petition</SelectItem>
                  <SelectItem value="EVIDENCE">Evidence</SelectItem>
                  <SelectItem value="ANNEXURE">Annexure</SelectItem>
                  <SelectItem value="ORDER">Order</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">File *</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  if (file && file.size > 4 * 1024 * 1024) {
                    toast.error('File size must be less than 4MB on free plan')
                    e.target.value = ''
                    return
                  }
                  setUploadData({ ...uploadData, file })
                }}
                required
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <p className="text-xs text-muted-foreground">
                Supported: PDF, DOC, DOCX, JPG, PNG (Max 4MB)
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowUploadDialog(false)
                  setUploadData({ title: '', documentType: 'OTHER', file: null })
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={uploading}
                className="flex-1 bg-[#004ac6] hover:bg-[#1d4ed8]"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Act & Section Dialog */}
      <Dialog open={showAddActDialog} onOpenChange={setShowAddActDialog}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Add Statutory Act &amp; Section</DialogTitle>
            <DialogDescription>
              Tag an applicable statute and section to this case dossier.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="actName">Act / Statute Name *</Label>
              <Input
                id="actName"
                value={newActName}
                onChange={(e) => setNewActName(e.target.value)}
                placeholder="e.g., NI Act 1881 or CrPC / BNSS"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sectionName">Section / Provision *</Label>
              <Input
                id="sectionName"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                placeholder="e.g., Section 138"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowAddActDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddAct} className="bg-[#004ac6] hover:bg-[#1d4ed8]">
                Add Provision
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Team Members Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Assign Chamber Team</DialogTitle>
            <DialogDescription>
              Select advocates and clerks allocated to this case brief.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2.5 max-h-72 overflow-y-auto py-2">
            {allTeamMembers.map((member) => {
              const checked = selectedTeamIds.includes(member.id)
              return (
                <label
                  key={member.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-[#e2e8f0] hover:bg-[#f8f9ff] cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      setSelectedTeamIds((prev) =>
                        checked ? prev.filter((id) => id !== member.id) : [...prev, member.id]
                      )
                    }
                    className="h-4 w-4 rounded border-slate-300 text-[#004ac6]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#131b2e] truncate">
                      {member.name || member.email}
                    </p>
                    <p className="text-xs text-[#545f73] truncate">
                      {member.email} • {member.role}
                    </p>
                  </div>
                </label>
              )
            })}
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveTeamAssignments}
              disabled={savingTeam}
              className="bg-[#004ac6] hover:bg-[#1d4ed8]"
            >
              {savingTeam ? 'Saving...' : 'Save Assignments'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
