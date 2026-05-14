'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
import { Separator } from '@/components/ui/separator'
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
  Trash2,
  Eye,
} from 'lucide-react'
import Link from 'next/link'
import { HearingTimeline } from '@/components/cases/hearing-timeline'
import { HearingForm } from '@/components/cases/hearing-form'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  const { user } = useAuth()
  const [caseData, setCaseData] = useState<Case | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadData, setUploadData] = useState({
    title: '',
    documentType: 'OTHER',
    file: null as File | null,
  })

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
    }
  }, [params.id, user])

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
            <ArrowLeft className="mr-2 h-4 w-4" />
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
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link href="/cases">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>

        <div className="flex flex-col gap-4">
          <div className="space-y-3">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              {caseData.caseNumber}
            </h1>
            <p className="text-base md:text-lg text-slate-600">
              {getClientName()} <span className="text-slate-400">vs</span> {caseData.opponentMainParty}
            </p>
            {caseData.court && (
              <p className="text-sm md:text-base text-slate-600 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {caseData.court.name}
                {caseData.courtNumber && <span>• Court {caseData.courtNumber}</span>}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge
              className={`text-sm px-3 py-1 border ${
                caseData.status === 'ACTIVE'
                  ? 'bg-green-100 text-green-700 border-green-200'
                  : caseData.status === 'PENDING'
                  ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                  : caseData.status === 'CLOSED'
                  ? 'bg-blue-100 text-blue-700 border-blue-200'
                  : 'bg-gray-100 text-gray-600 border-gray-200'
              }`}
            >
              {caseData.status}
            </Badge>
            <Link href={`/cases/${caseData.id}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Edit Case
              </Button>
            </Link>
            <HearingForm caseId={caseData.id} userEmail={user?.email || ''} onSuccess={fetchCase} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4 md:space-y-6">
        <div className="border-b border-slate-200">
          <TabsList className="inline-flex h-auto bg-transparent p-0 gap-1">
            <TabsTrigger
              value="overview"
              className="relative bg-transparent border-0 px-4 py-3 text-sm md:text-base font-medium text-slate-600 hover:text-slate-900 data-[state=active]:text-slate-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-transparent data-[state=active]:after:bg-slate-900 transition-colors"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="timeline"
              className="relative bg-transparent border-0 px-4 py-3 text-sm md:text-base font-medium text-slate-600 hover:text-slate-900 data-[state=active]:text-slate-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-transparent data-[state=active]:after:bg-slate-900 transition-colors whitespace-nowrap"
            >
              <span className="hidden md:inline">Case History</span>
              <span className="md:hidden">History</span>
              <span className="ml-1 text-slate-400">({caseData.hearings.length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="documents"
              className="relative bg-transparent border-0 px-4 py-3 text-sm md:text-base font-medium text-slate-600 hover:text-slate-900 data-[state=active]:text-slate-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-transparent data-[state=active]:after:bg-slate-900 transition-colors whitespace-nowrap"
            >
              Documents <span className="ml-1 text-slate-400">({caseData.documents.length})</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 md:space-y-6">
          <div className="grid gap-4 md:gap-6 md:grid-cols-2">
            {/* Court Details */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <Building2 className="h-5 w-5" />
                  Court Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4">
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
              </CardContent>
            </Card>

            {/* Important Dates */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <Calendar className="h-5 w-5" />
                  Important Dates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4">
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
              </CardContent>
            </Card>

            {/* Opposing Counsel */}
            {(caseData.opposingCounselName || caseData.opposingCounselPhone) && (
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <Users className="h-5 w-5" />
                    Opposing Counsel
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 md:space-y-4">
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
                </CardContent>
              </Card>
            )}

            {/* Team */}
            {caseData.assignments.length > 0 && (
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <Users className="h-5 w-5" />
                    Assigned Team
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
          {caseData.synopsis && (
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <FileText className="h-5 w-5" />
                  Case Synopsis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="prose prose-sm max-w-none text-sm md:text-base leading-relaxed text-slate-700 [&_ul]:list-disc [&_ul]:pl-4 md:[&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-4 md:[&_ol]:pl-6 [&_li]:my-1"
                  dangerouslySetInnerHTML={{ __html: caseData.synopsis }}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <HearingTimeline
            hearings={caseData.hearings}
            userEmail={user?.email || ''}
            caseId={caseData.id}
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
      </Tabs>
    </div>
  )
}
