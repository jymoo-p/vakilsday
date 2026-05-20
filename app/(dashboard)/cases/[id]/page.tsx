'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { format } from 'date-fns'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ChevronLeft,
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
  appearingFor: string
  courtNumber: string | null
  judgeName: string | null
  opposingCounselName: string | null
  opposingCounselPhone: string | null
  status: string
  filingDate: string
  nextHearingDate: string | null
  synopsis: string | null
  otherParties: string[]
  opponentMainParty: string
  opponentOtherParties: string[]
  client: {
    id: string
    firstName: string
    lastName: string
    phone: string
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
  }>
  documents: Array<{
    id: string
    title: string
    documentType: string
    filePath: string | null
    driveUrl: string | null
    createdAt: string
  }>
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
  const [editingCourtDetails, setEditingCourtDetails] = useState(false)
  const [editingSynopsis, setEditingSynopsis] = useState(false)
  const [editingOpposingCounsel, setEditingOpposingCounsel] = useState(false)
  const [editingClient, setEditingClient] = useState(false)
  const [editingOpponent, setEditingOpponent] = useState(false)
  const [savingCourtDetails, setSavingCourtDetails] = useState(false)
  const [savingSynopsis, setSavingSynopsis] = useState(false)
  const [savingOpposingCounsel, setSavingOpposingCounsel] = useState(false)
  const [savingClient, setSavingClient] = useState(false)
  const [savingOpponent, setSavingOpponent] = useState(false)
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
  })
  const [synopsisForm, setSynopsisForm] = useState('')
  const [opposingCounselForm, setOpposingCounselForm] = useState({
    opposingCounselName: '',
    opposingCounselPhone: '',
  })
  const [clientForm, setClientForm] = useState({
    otherParties: '',
  })
  const [opponentForm, setOpponentForm] = useState({
    opponentMainParty: '',
    opponentOtherParties: '',
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
      // Check if this is a newly created case
      if (searchParams.get('newCase') === 'true') {
        setShowGuidance(true)
      }
    }
  }, [params.id, user, searchParams])

  const fetchCourtsAndTypes = async () => {
    if (!user?.email) return

    try {
      const [courtsRes, typesRes] = await Promise.all([
        fetch(`/api/courts?email=${encodeURIComponent(user.email)}`),
        fetch(`/api/case-types?email=${encodeURIComponent(user.email)}`)
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
    })
    fetchCourtsAndTypes()
    setEditingCourtDetails(true)
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

      toast.success('Court details saved')
      setEditingCourtDetails(false)
      fetchCase()
    } catch (err) {
      toast.error('Something went wrong. Try again.')
    } finally {
      setSavingCourtDetails(false)
    }
  }

  const handleEditSynopsis = () => {
    if (!caseData) return
    setSynopsisForm(caseData.synopsis || '')
    setEditingSynopsis(true)
  }

  const handleSaveSynopsis = async () => {
    if (!user?.email || !caseData) return

    setSavingSynopsis(true)
    try {
      const response = await fetch(`/api/cases/${caseData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: user.email,
          synopsis: synopsisForm,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save synopsis')
      }

      toast.success('Synopsis saved')
      setEditingSynopsis(false)
      fetchCase()
    } catch (err) {
      toast.error('Something went wrong. Try again.')
    } finally {
      setSavingSynopsis(false)
    }
  }

  const handleEditOpposingCounsel = () => {
    if (!caseData) return
    setOpposingCounselForm({
      opposingCounselName: caseData.opposingCounselName || '',
      opposingCounselPhone: caseData.opposingCounselPhone || '',
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
          ...opposingCounselForm,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save opposing counsel details')
      }

      toast.success('Opposing counsel details saved')
      setEditingOpposingCounsel(false)
      fetchCase()
    } catch (err) {
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
          otherParties: clientForm.otherParties,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save client details')
      }

      toast.success('Client details saved')
      setEditingClient(false)
      fetchCase()
    } catch (err) {
      toast.error('Something went wrong. Try again.')
    } finally {
      setSavingClient(false)
    }
  }

  const handleEditOpponent = () => {
    if (!caseData) return
    setOpponentForm({
      opponentMainParty: caseData.opponentMainParty,
      opponentOtherParties: caseData.opponentOtherParties?.join(', ') || '',
    })
    setEditingOpponent(true)
  }

  const handleSaveOpponent = async () => {
    if (!user?.email || !caseData) return

    setSavingOpponent(true)
    try {
      const response = await fetch(`/api/cases/${caseData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: user.email,
          opponentMainParty: opponentForm.opponentMainParty,
          opponentOtherParties: opponentForm.opponentOtherParties,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save opponent details')
      }

      toast.success('Opponent details saved')
      setEditingOpponent(false)
      fetchCase()
    } catch (err) {
      toast.error('Something went wrong. Try again.')
    } finally {
      setSavingOpponent(false)
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
        fetchCase() // Refresh to show new document
      } else {
        // Read response body once
        const text = await response.text()
        let errorMessage = 'Failed to upload document'

        // Try to parse as JSON first
        try {
          const data = JSON.parse(text)
          errorMessage = data.error || errorMessage
        } catch {
          // Not JSON, check for known error messages
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-lg text-muted-foreground">Loading case details...</div>
        </div>
      </div>
    )
  }

  if (error || !caseData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-lg text-destructive mb-4">
            {error || 'Case not found'}
          </div>
          <Button onClick={() => router.push('/cases')}>
            <ChevronLeft className="mr-2 h-5 w-5" />
            Back to Cases
          </Button>
        </div>
      </div>
    )
  }

  const getClientName = () => {
    if (caseData.client) {
      return `${caseData.client.firstName} ${caseData.client.lastName}`
    }
    return caseData.otherParties[0] || 'Unknown'
  }

  return (
    <div className="space-y-4 md:space-y-6 max-w-6xl px-4 md:px-0">
      {/* Guidance Banner for New Cases */}
      {showGuidance && (
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-purple-900 mb-2">Welcome to Your New Case! 🎉</h3>
                    <p className="text-sm text-purple-800 mb-4">
                      Your case has been created successfully. Here's what you can do next:
                    </p>
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Building2 className="h-3.5 w-3.5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-purple-900">Add Court Details</p>
                          <p className="text-xs text-purple-700">Scroll down to add court name, number, case type, and judge information</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Calendar className="h-3.5 w-3.5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-purple-900">Schedule Hearings</p>
                          <p className="text-xs text-purple-700">Click "Add Hearing" to record hearing dates and outcomes</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <FileText className="h-3.5 w-3.5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-purple-900">Upload Documents</p>
                          <p className="text-xs text-purple-700">Go to the Documents tab to upload petitions, evidence, orders, and more</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Edit className="h-3.5 w-3.5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-purple-900">Add Synopsis & Team</p>
                          <p className="text-xs text-purple-700">Click "Edit Case" to add case summary and assign team members</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowGuidance(false)}
                    className="flex-shrink-0 p-1 hover:bg-purple-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-purple-600" />
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex flex-col gap-6">
        <Link href="/cases">
          <Button variant="ghost" size="sm" className="gap-2 text-slate-600 hover:text-slate-900 -ml-2">
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Cases</span>
          </Button>
        </Link>

        {/* Modern Card Header */}
        <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-white to-slate-50">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="space-y-4">
                {/* Case Number with Badge */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center flex-shrink-0 shadow-md">
                        <Gavel className="h-5 w-5 text-white" />
                      </div>
                      <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                        {caseData.caseNumber}
                      </h1>
                    </div>
                    <Badge
                      className={`text-xs font-semibold px-3 py-1 border-0 shadow-sm ${
                        caseData.status === 'ACTIVE'
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                          : caseData.status === 'PENDING'
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                          : caseData.status === 'CLOSED'
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                          : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                      }`}
                    >
                      {caseData.status}
                    </Badge>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/cases/${caseData.id}/edit`}>
                      <Button variant="outline" size="sm" className="gap-2 border-slate-300 hover:border-purple-300 hover:bg-purple-50">
                        <Edit className="h-4 w-4" />
                        <span className="hidden sm:inline">Edit Case</span>
                        <span className="sm:hidden">Edit</span>
                      </Button>
                    </Link>
                    <HearingForm caseId={caseData.id} userEmail={user?.email || ''} onSuccess={fetchCase} />
                  </div>
                </div>

                {/* Parties */}
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                  <p className="text-base md:text-lg text-slate-900 font-medium">
                    <span className="text-purple-600">{getClientName()}</span>
                    <span className="text-slate-400 mx-2">vs</span>
                    <span className="text-slate-900">{caseData.opponentMainParty}</span>
                  </p>
                </div>

                {/* Court & Type Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {caseData.court && (
                    <div className="flex items-center gap-3 text-sm text-slate-600 bg-white rounded-lg p-3 border border-slate-200">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-4 w-4 text-slate-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{caseData.court.name}</p>
                        {caseData.courtNumber && (
                          <p className="text-xs text-slate-500">Court No. {caseData.courtNumber}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {caseData.caseType && (
                    <div className="flex items-center gap-3 text-sm text-slate-600 bg-white rounded-lg p-3 border border-slate-200">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-4 w-4 text-slate-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{caseData.caseType.name}</p>
                        <p className="text-xs text-slate-500">Case Type</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="border-b border-slate-200 bg-white rounded-t-xl overflow-x-auto">
          <TabsList className="inline-flex h-auto bg-transparent p-0 gap-0 sm:gap-2 min-w-full sm:min-w-0 justify-evenly sm:justify-start">
            <TabsTrigger
              value="overview"
              className="relative border-0 px-4 sm:px-6 py-3 text-sm md:text-base font-semibold text-slate-600 hover:text-purple-700 hover:bg-purple-50 data-active:!text-purple-700 data-active:!bg-purple-100 data-active:border-purple-200 rounded-lg transition-all duration-200 flex-shrink-0 border-r border-slate-100 sm:border-r-0"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline ml-1.5">Overview</span>
            </TabsTrigger>
            <TabsTrigger
              value="timeline"
              className="relative border-0 px-4 sm:px-6 py-3 text-sm md:text-base font-semibold text-slate-600 hover:text-purple-700 hover:bg-purple-50 data-active:!text-purple-700 data-active:!bg-purple-100 data-active:border-purple-200 rounded-lg transition-all duration-200 whitespace-nowrap flex-shrink-0 border-r border-slate-100 sm:border-r-0"
            >
              <History className="h-4 w-4" />
              <span className="hidden sm:inline ml-1.5">Case History</span>
              <span className="hidden md:inline">
                <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-600 hover:bg-slate-100 text-xs px-1.5 py-0">{caseData.hearings.length}</Badge>
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="documents"
              className="relative border-0 px-4 sm:px-6 py-3 text-sm md:text-base font-semibold text-slate-600 hover:text-purple-700 hover:bg-purple-50 data-active:!text-purple-700 data-active:!bg-purple-100 data-active:border-purple-200 rounded-lg transition-all duration-200 whitespace-nowrap flex-shrink-0 border-r border-slate-100 sm:border-r-0"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline ml-1.5">Documents</span>
              <span className="hidden md:inline">
                <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-600 hover:bg-slate-100 text-xs px-1.5 py-0">{caseData.documents.length}</Badge>
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="ai"
              className="relative border-0 px-4 sm:px-6 py-3 text-sm md:text-base font-semibold text-slate-600 hover:text-purple-700 hover:bg-purple-50 data-active:!text-purple-700 data-active:!bg-purple-100 data-active:border-purple-200 rounded-lg transition-all duration-200 whitespace-nowrap flex-shrink-0"
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline ml-1.5">AI Assistant</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Client Side */}
            <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-white to-purple-50/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-slate-100">
                <CardTitle className="flex items-center gap-3 text-lg md:text-xl font-bold">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center shadow-sm">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  Client
                </CardTitle>
                {!editingClient && (
                  <Button variant="ghost" size="sm" onClick={handleEditClient} className="h-8 hover:bg-purple-50">
                    <Edit className="h-4 w-4 text-purple-600" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4 pt-3 md:pt-6">
                {editingClient ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="otherParties">Other Parties (comma-separated)</Label>
                      <Input
                        id="otherParties"
                        value={clientForm.otherParties}
                        onChange={(e) => setClientForm({ ...clientForm, otherParties: e.target.value })}
                        placeholder="e.g., Party 2, Party 3"
                      />
                    </div>

                    <div className="flex gap-2">
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
                      >
                        {savingClient ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-xs md:text-sm text-slate-500 mb-1">Appearing For</p>
                      <Badge variant="outline" className="text-sm">
                        {caseData.appearingFor}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-xs md:text-sm text-slate-500 mb-1">Main Party</p>
                      <p className="text-base md:text-lg font-medium text-slate-900">
                        {getClientName()}
                      </p>
                    </div>

                    {caseData.otherParties && caseData.otherParties.length > 0 && (
                      <div>
                        <p className="text-xs md:text-sm text-slate-500 mb-1">Other Parties</p>
                        <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
                          {caseData.otherParties.join(', ')}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Opponent Side */}
            <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-white to-slate-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-slate-100">
                <CardTitle className="flex items-center gap-3 text-lg md:text-xl font-bold">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-sm">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  Opponent
                </CardTitle>
                {!editingOpponent && (
                  <Button variant="ghost" size="sm" onClick={handleEditOpponent} className="h-8 hover:bg-slate-50">
                    <Edit className="h-4 w-4 text-slate-600" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4 pt-3 md:pt-6">
                {editingOpponent ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="opponentMainParty">Main Party *</Label>
                      <Input
                        id="opponentMainParty"
                        value={opponentForm.opponentMainParty}
                        onChange={(e) => setOpponentForm({ ...opponentForm, opponentMainParty: e.target.value })}
                        placeholder="Enter opponent main party"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="opponentOtherParties">Additional Parties (comma-separated)</Label>
                      <Input
                        id="opponentOtherParties"
                        value={opponentForm.opponentOtherParties}
                        onChange={(e) => setOpponentForm({ ...opponentForm, opponentOtherParties: e.target.value })}
                        placeholder="e.g., Opponent 2, Opponent 3"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingOpponent(false)}
                        disabled={savingOpponent}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSaveOpponent}
                        disabled={savingOpponent}
                      >
                        {savingOpponent ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-xs md:text-sm text-slate-500 mb-1">Main Party</p>
                      <p className="text-base md:text-lg font-medium text-slate-900">
                        {caseData.opponentMainParty}
                      </p>
                    </div>

                    {caseData.opponentOtherParties && caseData.opponentOtherParties.length > 0 && (
                      <div>
                        <p className="text-xs md:text-sm text-slate-500 mb-1">Additional Parties</p>
                        <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
                          {caseData.opponentOtherParties.join(', ')}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Court Details */}
            <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-white to-blue-50/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-slate-100">
                <CardTitle className="flex items-center gap-3 text-lg md:text-xl font-bold">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-sm">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  Court Details
                </CardTitle>
                {!editingCourtDetails && (caseData.court || caseData.courtNumber || caseData.caseType || caseData.judgeName) && (
                  <Button variant="ghost" size="sm" onClick={handleEditCourtDetails} className="h-8 hover:bg-blue-50">
                    <Edit className="h-4 w-4 text-blue-600" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4 pt-3 md:pt-6">
                {editingCourtDetails ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="court">Court</Label>
                      <Select
                        value={courtDetailsForm.courtId || undefined}
                        onValueChange={(value) => setCourtDetailsForm({ ...courtDetailsForm, courtId: value || '' })}
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

                    <div className="space-y-2">
                      <Label htmlFor="courtNumber">Court Number</Label>
                      <Input
                        id="courtNumber"
                        value={courtDetailsForm.courtNumber || ''}
                        onChange={(e) => setCourtDetailsForm({ ...courtDetailsForm, courtNumber: e.target.value })}
                        placeholder="e.g., 1, 2, 3"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="caseType">Case Type</Label>
                      <Select
                        value={courtDetailsForm.caseTypeId || undefined}
                        onValueChange={(value) => setCourtDetailsForm({ ...courtDetailsForm, caseTypeId: value || '' })}
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

                    <div className="space-y-2">
                      <Label htmlFor="judgeName">Judge Name</Label>
                      <Input
                        id="judgeName"
                        value={courtDetailsForm.judgeName}
                        onChange={(e) => setCourtDetailsForm({ ...courtDetailsForm, judgeName: e.target.value })}
                        placeholder="Enter judge name"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
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
                      >
                        {savingCourtDetails ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </div>
                ) : !caseData.court && !caseData.courtNumber && !caseData.caseType && !caseData.judgeName ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-slate-500 mb-3">No court details added yet</p>
                    <Button variant="outline" size="sm" className="gap-2" onClick={handleEditCourtDetails}>
                      <Plus className="h-4 w-4" />
                      Add Court Details
                    </Button>
                  </div>
                ) : (
                  <>
                    {caseData.court && (
                      <div>
                        <p className="text-xs md:text-sm text-slate-500 mb-1">Court Name</p>
                        <p className="text-base md:text-lg font-medium text-slate-900">{caseData.court.name}</p>
                      </div>
                    )}
                    {caseData.courtNumber && (
                      <div>
                        <p className="text-xs md:text-sm text-slate-500 mb-1">Court Number</p>
                        <p className="text-base md:text-lg font-medium text-slate-900">{caseData.courtNumber}</p>
                      </div>
                    )}
                    {caseData.caseType && (
                      <div>
                        <p className="text-xs md:text-sm text-slate-500 mb-1">Case Type</p>
                        <p className="text-base md:text-lg font-medium text-slate-900">{caseData.caseType.name}</p>
                      </div>
                    )}
                    {caseData.judgeName && (
                      <div>
                        <p className="text-xs md:text-sm text-slate-500 mb-1">Judge</p>
                        <p className="text-base md:text-lg font-medium text-slate-900 flex items-center gap-2">
                          <Gavel className="h-4 w-4" />
                          {caseData.judgeName}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Important Dates */}
            <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-white to-emerald-50/30">
              <CardHeader className="pb-4 border-b border-slate-100">
                <CardTitle className="flex items-center gap-3 text-lg md:text-xl font-bold">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center shadow-sm">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  Important Dates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-3 md:pt-6">
                <div>
                  <p className="text-xs md:text-sm text-slate-500 mb-1">Filing Date</p>
                  <p className="text-base md:text-lg font-medium text-slate-900">
                    {format(new Date(caseData.filingDate), 'MMMM d, yyyy')}
                  </p>
                </div>
                {caseData.nextHearingDate && (
                  <div>
                    <p className="text-xs md:text-sm text-slate-500 mb-1">
                      Next Hearing
                    </p>
                    <p className="text-base md:text-lg font-medium text-slate-900 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-purple-600" />
                      {format(new Date(caseData.nextHearingDate), 'MMMM d, yyyy')}
                    </p>
                  </div>
                )}
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => {
                      console.log('Button clicked, switching to timeline')
                      setActiveTab('timeline')
                    }}
                  >
                    <History className="h-4 w-4" />
                    View History
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Opposing Counsel */}
            <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-white to-teal-50/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-slate-100">
                <CardTitle className="flex items-center gap-3 text-lg md:text-xl font-bold">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center shadow-sm">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  Opposing Counsel
                </CardTitle>
                {!editingOpposingCounsel && (caseData.opposingCounselName || caseData.opposingCounselPhone) && (
                  <Button variant="ghost" size="sm" onClick={handleEditOpposingCounsel} className="h-8 hover:bg-teal-50">
                    <Edit className="h-4 w-4 text-teal-600" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4 pt-3 md:pt-6">
                {editingOpposingCounsel ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="opposingCounselName">Counsel Name</Label>
                      <Input
                        id="opposingCounselName"
                        value={opposingCounselForm.opposingCounselName || ''}
                        onChange={(e) => setOpposingCounselForm({ ...opposingCounselForm, opposingCounselName: e.target.value })}
                        placeholder="Enter opposing counsel name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="opposingCounselPhone">Phone Number</Label>
                      <Input
                        id="opposingCounselPhone"
                        value={opposingCounselForm.opposingCounselPhone || ''}
                        onChange={(e) => setOpposingCounselForm({ ...opposingCounselForm, opposingCounselPhone: e.target.value })}
                        placeholder="Enter phone number"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
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
                      >
                        {savingOpposingCounsel ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </div>
                ) : !caseData.opposingCounselName && !caseData.opposingCounselPhone ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-slate-500 mb-3">No opposing counsel details added yet</p>
                    <Button variant="outline" size="sm" className="gap-2" onClick={handleEditOpposingCounsel}>
                      <Plus className="h-4 w-4" />
                      Add Opposing Counsel
                    </Button>
                  </div>
                ) : (
                  <>
                    {caseData.opposingCounselName && (
                      <div>
                        <p className="text-xs md:text-sm text-slate-500 mb-1">Name</p>
                        <p className="text-base md:text-lg font-medium text-slate-900">
                          {caseData.opposingCounselName}
                        </p>
                      </div>
                    )}
                    {caseData.opposingCounselPhone && (
                      <div>
                        <p className="text-xs md:text-sm text-slate-500 mb-1">Phone</p>
                        <p className="text-base md:text-lg font-medium text-slate-900 flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {caseData.opposingCounselPhone}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Team */}
            {caseData.assignments.length > 0 && (
              <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-white to-indigo-50/30">
                <CardHeader className="pb-4 border-b border-slate-100">
                  <CardTitle className="flex items-center gap-3 text-lg md:text-xl font-bold">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center shadow-sm">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    Assigned Team
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {caseData.assignments.map((assignment) => (
                      <div
                        key={assignment.user.id}
                        className="flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-base md:text-lg font-medium text-slate-900 truncate">
                            {assignment.user.name}
                          </p>
                          <p className="text-xs md:text-sm text-slate-500 truncate">
                            {assignment.user.email}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs md:text-sm flex-shrink-0">
                          {assignment.user.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Synopsis */}
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-white to-amber-50/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-slate-100">
              <CardTitle className="flex items-center gap-3 text-lg md:text-xl font-bold">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center shadow-sm">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                Case Synopsis
              </CardTitle>
              {!editingSynopsis && caseData.synopsis && (
                <Button variant="ghost" size="sm" onClick={handleEditSynopsis} className="h-8 hover:bg-amber-50">
                  <Edit className="h-4 w-4 text-amber-600" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="pt-6">
              {editingSynopsis ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="synopsis">Synopsis</Label>
                    <RichTextEditor
                      content={synopsisForm}
                      onChange={(html) => setSynopsisForm(html)}
                      placeholder="Provide a brief summary of the case..."
                    />
                  </div>

                  <div className="flex gap-2">
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
                    >
                      {savingSynopsis ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </div>
              ) : !caseData.synopsis ? (
                <div className="text-center py-4">
                  <p className="text-sm text-slate-500 mb-3">No synopsis added yet</p>
                  <Button variant="outline" size="sm" className="gap-2" onClick={handleEditSynopsis}>
                    <Plus className="h-4 w-4" />
                    Add Synopsis
                  </Button>
                </div>
              ) : (
                <div
                  className="prose prose-sm max-w-none text-sm md:text-base leading-relaxed text-slate-700 [&_ul]:list-disc [&_ul]:pl-4 md:[&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-4 md:[&_ol]:pl-6 [&_li]:my-1"
                  dangerouslySetInnerHTML={{ __html: caseData.synopsis }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <HearingTimeline
            hearings={caseData.hearings}
            userEmail={user?.email || ''}
            caseId={caseData.id}
            caseNumber={caseData.caseNumber}
            client={caseData.client}
            onUpdate={fetchCase}
          />
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card className="border-slate-200">
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0 pb-4">
              <CardTitle className="text-lg md:text-xl">Documents</CardTitle>
              <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                <DialogTrigger>
                  <Button size="sm" className="gap-2">
                    <Upload className="h-4 w-4" />
                    <span className="hidden md:inline">Upload Document</span>
                    <span className="md:hidden">Upload</span>
                  </Button>
                </DialogTrigger>
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
                        placeholder="e.g., Petition Copy"
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

                          // Validate file size (4MB limit due to Vercel free tier)
                          if (file && file.size > 4 * 1024 * 1024) {
                            toast.error('File size must be less than 4MB on free plan')
                            e.target.value = '' // Clear the input
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
                        className="flex-1"
                      >
                        {uploading ? 'Uploading...' : 'Upload'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {caseData.documents.length === 0 ? (
                <div className="text-center py-8 md:py-12">
                  <FileText className="h-10 w-10 md:h-12 md:w-12 mx-auto text-slate-300 mb-3 md:mb-4" />
                  <p className="text-base md:text-lg text-slate-500 mb-3 md:mb-4">
                    No documents uploaded yet
                  </p>
                  <Button onClick={() => setShowUploadDialog(true)} size="sm" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Upload First Document
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 md:space-y-3">
                  {caseData.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 md:p-4 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer group"
                      onClick={() => doc.driveUrl && window.open(doc.driveUrl, '_blank')}
                    >
                      <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                        <FileText className="h-4 w-4 md:h-5 md:w-5 text-slate-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm md:text-base font-medium text-slate-900 truncate group-hover:text-purple-700">
                            {doc.title}
                          </p>
                          <p className="text-xs md:text-sm text-slate-500">
                            {format(new Date(doc.createdAt), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 md:gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Badge variant="outline" className="text-xs hidden md:inline-flex">{doc.documentType}</Badge>
                        {doc.driveUrl && (
                          <>
                            <a href={doc.driveUrl} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Preview in Google Drive">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </a>
                            <a href={doc.driveUrl} target="_blank" rel="noopener noreferrer" download>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hidden md:inline-flex" title="Download">
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Assistant Tab */}
        <TabsContent value="ai">
          <CaseAIAssistant caseId={caseData.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
