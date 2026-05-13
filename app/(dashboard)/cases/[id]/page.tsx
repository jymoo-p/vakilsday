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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          onClick={() => router.push('/cases')}
          className="w-fit text-base"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Cases
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl sm:text-4xl font-bold">
                {caseData.caseNumber}
              </h1>
              <Badge
                variant={
                  caseData.status === 'ACTIVE'
                    ? 'default'
                    : caseData.status === 'CLOSED'
                    ? 'secondary'
                    : 'outline'
                }
                className="text-base px-3 py-1"
              >
                {caseData.status}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-xl text-muted-foreground">
                {getClientName()} <span className="text-slate-400">vs</span> {caseData.opponentMainParty}
              </p>
              {caseData.court && (
                <p className="text-base text-muted-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {caseData.court.name}
                  {caseData.courtNumber && <span>• Court {caseData.courtNumber}</span>}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Link href={`/cases/${caseData.id}/edit`}>
              <Button variant="outline" size="lg" className="text-base">
                <Edit className="mr-2 h-5 w-5" />
                Edit Case
              </Button>
            </Link>
            <HearingForm caseId={caseData.id} userEmail={user?.email || ''} onSuccess={fetchCase} />
          </div>
        </div>
      </div>

      <Separator />

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="overview" className="text-base py-3">
            Overview
          </TabsTrigger>
          <TabsTrigger value="timeline" className="text-base py-3">
            Timeline ({caseData.hearings.length})
          </TabsTrigger>
          <TabsTrigger value="documents" className="text-base py-3">
            Documents ({caseData.documents.length})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Court Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Building2 className="h-5 w-5" />
                  Court Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {caseData.court && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Court Name</p>
                    <p className="text-lg font-medium">{caseData.court.name}</p>
                  </div>
                )}
                {caseData.courtNumber && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Court Number</p>
                    <p className="text-lg font-medium">{caseData.courtNumber}</p>
                  </div>
                )}
                {caseData.caseType && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Case Type</p>
                    <p className="text-lg font-medium">{caseData.caseType.name}</p>
                  </div>
                )}
                {caseData.judgeName && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Judge</p>
                    <p className="text-lg font-medium flex items-center gap-2">
                      <Gavel className="h-4 w-4" />
                      {caseData.judgeName}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Important Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Calendar className="h-5 w-5" />
                  Important Dates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Filing Date</p>
                  <p className="text-lg font-medium">
                    {format(new Date(caseData.filingDate), 'MMMM d, yyyy')}
                  </p>
                </div>
                {caseData.nextHearingDate && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Next Hearing
                    </p>
                    <p className="text-lg font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      {format(new Date(caseData.nextHearingDate), 'MMMM d, yyyy')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Opposing Counsel */}
            {(caseData.opposingCounselName || caseData.opposingCounselPhone) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Users className="h-5 w-5" />
                    Opposing Counsel
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {caseData.opposingCounselName && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Name</p>
                      <p className="text-lg font-medium">
                        {caseData.opposingCounselName}
                      </p>
                    </div>
                  )}
                  {caseData.opposingCounselPhone && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Phone</p>
                      <p className="text-lg font-medium flex items-center gap-2">
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Users className="h-5 w-5" />
                    Assigned Team
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {caseData.assignments.map((assignment) => (
                      <div
                        key={assignment.user.id}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <p className="text-lg font-medium">
                            {assignment.user.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {assignment.user.email}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-sm">
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <FileText className="h-5 w-5" />
                  Case Synopsis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base leading-relaxed whitespace-pre-wrap">
                  {caseData.synopsis}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <HearingTimeline hearings={caseData.hearings} />
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>Documents</CardTitle>
              <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                <DialogTrigger>
                  <Button className="gap-2">
                    <Upload className="h-4 w-4" />
                    Upload Document
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
                          setUploadData({ ...uploadData, file })
                        }}
                        required
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      />
                      <p className="text-xs text-muted-foreground">
                        Supported: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
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
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg text-muted-foreground mb-4">
                    No documents uploaded yet
                  </p>
                  <Button onClick={() => setShowUploadDialog(true)} className="gap-2">
                    <Upload className="h-4 w-4" />
                    Upload First Document
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {caseData.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                      onClick={() => doc.driveUrl && window.open(doc.driveUrl, '_blank')}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-medium truncate group-hover:text-primary">
                            {doc.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(doc.createdAt), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Badge variant="outline">{doc.documentType}</Badge>
                        {doc.driveUrl && (
                          <>
                            <a href={doc.driveUrl} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="sm" title="Preview in Google Drive">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </a>
                            <a href={doc.driveUrl} target="_blank" rel="noopener noreferrer" download>
                              <Button variant="ghost" size="sm" title="Download">
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
