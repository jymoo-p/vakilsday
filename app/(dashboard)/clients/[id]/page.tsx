'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronLeft, Phone, Mail, MapPin, Plus, FileText, Calendar, Building2, ChevronRight, Briefcase } from 'lucide-react'
import Link from 'next/link'
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

interface Client {
  id: string
  firstName: string
  lastName: string
  gender: string
  age: number | null
  phone: string
  otherPhone: string | null
  email: string | null
  address: string | null
  lawyerNotes: string | null
  createdAt: string
}

interface Case {
  id: string
  caseNumber: string
  year: number | null
  status: string
  courtNumber: string | null
  filingDate: string
  nextHearingDate: string | null
  court: {
    name: string
  } | null
  caseType: {
    name: string
  } | null
  opponentMainParty: string
  _count: {
    hearings: number
    documents: number
  }
}

export default function ClientDetailPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string

  const [client, setClient] = useState<Client | null>(null)
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showQuickCreateDialog, setShowQuickCreateDialog] = useState(false)
  const [creating, setCreating] = useState(false)
  const [quickCaseForm, setQuickCaseForm] = useState({
    caseNumber: '',
    opponentMainParty: '',
    appearingFor: 'PETITIONER' as 'PETITIONER' | 'RESPONDENT',
  })

  useEffect(() => {
    fetchClientData()
  }, [user, clientId])

  async function fetchClientData() {
    if (!user?.email) return

    try {
      // Fetch client details
      const clientResponse = await fetch(`/api/clients/${clientId}?email=${encodeURIComponent(user.email)}`)
      if (!clientResponse.ok) {
        throw new Error('Failed to load client')
      }
      const clientData = await clientResponse.json()
      setClient(clientData.client)

      // Fetch cases for this client
      const casesResponse = await fetch(`/api/cases?email=${encodeURIComponent(user.email)}&clientId=${clientId}`)
      if (casesResponse.ok) {
        const casesData = await casesResponse.json()
        setCases(casesData.cases || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load client')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickCreateCase = async () => {
    if (!quickCaseForm.caseNumber || !quickCaseForm.opponentMainParty || !client) {
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
          clientId: client.id,
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
        opponentMainParty: '',
        appearingFor: 'PETITIONER',
      })
      router.push(`/cases/${data.case.id}?newCase=true`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create case')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-slate-900"></div>
      </div>
    )
  }

  if (error || !client) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <p className="text-red-600 text-lg">{error || 'Client not found'}</p>
            <Button onClick={() => router.push('/clients')} className="mt-4">
              Back to Clients
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const statusColors = {
    ACTIVE: 'bg-green-100 text-green-700 border-green-200',
    PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    CLOSED: 'bg-blue-100 text-blue-700 border-blue-200',
    ARCHIVED: 'bg-gray-100 text-gray-600 border-gray-200',
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          onClick={() => router.push('/clients')}
          className="mb-4"
        >
          <ChevronLeft className="mr-2 h-5 w-5" />
          Back to Clients
        </Button>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {client.firstName} {client.lastName || ''}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              {client.gender && <Badge variant="secondary">{client.gender}</Badge>}
              {client.age && <span className="text-slate-600">{client.age} years old</span>}
            </div>
          </div>

          <Button onClick={() => router.push(`/clients/${client.id}/edit`)}>
            Edit Client
          </Button>
        </div>
      </div>

      {/* Client Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-sm text-slate-500">Primary Phone</p>
                <p className="font-medium text-slate-900">{client.phone}</p>
              </div>
            </div>

            {client.otherPhone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500">Other Phone</p>
                  <p className="font-medium text-slate-900">{client.otherPhone}</p>
                </div>
              </div>
            )}

            {client.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="font-medium text-slate-900">{client.email}</p>
                </div>
              </div>
            )}

            {client.address && (
              <div className="flex items-start gap-3 md:col-span-2">
                <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-500">Address</p>
                  <p className="font-medium text-slate-900">{client.address}</p>
                </div>
              </div>
            )}
          </div>

          {client.lawyerNotes && (
            <div className="pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-500 mb-2">Lawyer's Notes</p>
              <p className="text-slate-900 whitespace-pre-wrap">{client.lawyerNotes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cases */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Cases ({cases.length})</CardTitle>
            <Button
              size="sm"
              className="gap-2 bg-slate-900 hover:bg-slate-800"
              onClick={() => setShowQuickCreateDialog(true)}
            >
              <Plus className="h-4 w-4" />
              Add Case
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {cases.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 text-lg mb-4">No cases found for this client</p>
              <Button
                className="gap-2 bg-slate-900 hover:bg-slate-800"
                onClick={() => setShowQuickCreateDialog(true)}
              >
                <Plus className="h-4 w-4" />
                Add First Case
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {cases.map((caseItem) => (
                <Link key={caseItem.id} href={`/cases/${caseItem.id}`}>
                  <Card className="hover:shadow-lg hover:scale-[1.01] transition-all duration-200 cursor-pointer group border-slate-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base truncate group-hover:text-primary transition-colors font-normal tracking-wide">
                              {caseItem.caseNumber}
                              {caseItem.year && ` / ${caseItem.year}`}
                            </h3>
                            <Badge className={`${statusColors[caseItem.status as keyof typeof statusColors]} text-xs font-medium px-2 py-0.5 border`}>
                              {caseItem.status}
                            </Badge>
                          </div>
                          <div className="space-y-1.5 mt-1">
                            <div className="flex items-center gap-2 text-base">
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
                        <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                      </div>
                      <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 text-sm">
                          <Calendar className="h-3.5 w-3.5 text-purple-600" />
                          <span className="text-xs text-slate-500">Next:</span>
                          <span className="font-medium text-slate-900">
                            {caseItem.nextHearingDate
                              ? format(parseISO(caseItem.nextHearingDate), 'MMM d, yyyy')
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
        </CardContent>
      </Card>

      {/* Quick Case Creation Dialog */}
      <Dialog open={showQuickCreateDialog} onOpenChange={setShowQuickCreateDialog}>
        <DialogContent className="sm:max-w-[540px] rounded-2xl">
          <DialogHeader className="space-y-3">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <Briefcase className="h-7 w-7 text-white" />
            </div>
            <DialogTitle className="text-2xl font-semibold text-center">New Case</DialogTitle>
            <DialogDescription className="text-center text-base">
              Create case quickly for {client?.firstName} {client?.lastName}. Add more details later.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-6">
            <div className="space-y-2">
              <Label htmlFor="caseNumber" className="text-sm font-medium text-slate-700">
                Case Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="caseNumber"
                value={quickCaseForm.caseNumber}
                onChange={(e) => setQuickCaseForm({ ...quickCaseForm, caseNumber: e.target.value })}
                placeholder="e.g., WP(C) 12345/2024"
                className="h-11 text-base"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium text-slate-700">
                Appearing For <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`flex items-center justify-center gap-2 cursor-pointer rounded-lg border-2 p-3 transition-all ${
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
                  <span className="font-medium text-sm">Petitioner</span>
                </label>
                <label className={`flex items-center justify-center gap-2 cursor-pointer rounded-lg border-2 p-3 transition-all ${
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
                  <span className="font-medium text-sm">Respondent</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="opponentMainParty" className="text-sm font-medium text-slate-700">
                Opponent Main Party <span className="text-red-500">*</span>
              </Label>
              <Input
                id="opponentMainParty"
                value={quickCaseForm.opponentMainParty}
                onChange={(e) => setQuickCaseForm({ ...quickCaseForm, opponentMainParty: e.target.value })}
                placeholder="e.g., Union of India"
                className="h-11 text-base"
              />
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                  <span className="text-white text-lg">💡</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">Quick Entry Mode</p>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    After creating, you'll be redirected to add court details, hearings, documents, and more information.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowQuickCreateDialog(false)}
              disabled={creating}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleQuickCreateCase}
              disabled={creating}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {creating ? 'Creating...' : 'Create Case'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
