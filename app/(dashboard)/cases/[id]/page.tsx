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
} from 'lucide-react'
import Link from 'next/link'
import { HearingTimeline } from '@/components/cases/hearing-timeline'
import { HearingForm } from '@/components/cases/hearing-form'

interface Case {
  id: string
  caseNumber: string
  courtName: string
  courtNumber: string | null
  petitionerName: string
  respondentName: string
  judgeName: string | null
  opposingCounselName: string | null
  opposingCounselPhone: string | null
  status: string
  filingDate: string
  nextHearingDate: string | null
  synopsis: string | null
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
            <p className="text-xl text-muted-foreground">
              {caseData.petitionerName} vs {caseData.respondentName}
            </p>
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
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Court Name</p>
                  <p className="text-lg font-medium">{caseData.courtName}</p>
                </div>
                {caseData.courtNumber && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Court Number</p>
                    <p className="text-lg font-medium">{caseData.courtNumber}</p>
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
            <CardContent className="pt-6">
              {caseData.documents.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg text-muted-foreground">
                    No documents uploaded yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {caseData.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-base font-medium">{doc.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(doc.createdAt), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{doc.documentType}</Badge>
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
