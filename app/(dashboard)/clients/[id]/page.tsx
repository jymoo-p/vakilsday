'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronLeft, Phone, Mail, MapPin, Plus, FileText, Calendar, Building2, ChevronRight, Briefcase, MessageCircle, User, Smartphone, PhoneCall, Scale } from 'lucide-react'

// WhatsApp SVG Icon
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
)
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
    ACTIVE: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0',
    PENDING: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0',
    CLOSED: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0',
    ARCHIVED: 'bg-gradient-to-r from-gray-400 to-gray-500 text-white border-0',
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 md:px-0">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          onClick={() => router.push('/clients')}
          className="mb-4 hover:bg-purple-50"
        >
          <ChevronLeft className="mr-2 h-5 w-5" />
          Back to Clients
        </Button>

        <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-white to-purple-50/30">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center shadow-md flex-shrink-0">
                  <User className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                    {client.firstName} {client.lastName || ''}
                  </h1>
                  <div className="flex items-center gap-2 mt-2">
                    {client.gender && (
                      <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                        {client.gender}
                      </Badge>
                    )}
                    {client.age && (
                      <span className="text-slate-600 text-sm">{client.age} years old</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="gap-2 border-purple-300 text-purple-700 hover:bg-purple-50 hover:text-purple-800 hover:border-purple-400 transition-all"
                  onClick={() => window.location.href = `tel:${client.phone}`}
                >
                  <Phone className="h-4 w-4" />
                  <span className="hidden sm:inline">Call</span>
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 border-purple-300 text-purple-700 hover:bg-purple-50 hover:text-purple-800 hover:border-purple-400 transition-all"
                  onClick={() => {
                    const cleanPhone = client.phone.replace(/\D/g, '')
                    window.open(`https://wa.me/${cleanPhone}`, '_blank')
                  }}
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </Button>
                <Button
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={() => router.push(`/clients/${client.id}/edit`)}
                >
                  Edit Client
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client Information */}
      <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-sm">
              <User className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-xl">Contact Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br from-blue-50/50 to-white border border-blue-100">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Smartphone className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-500 mb-1">Primary Phone</p>
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${client.phone}`}
                    className="text-slate-900 hover:text-purple-600 transition-colors"
                  >
                    {client.phone}
                  </a>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-md"
                    onClick={() => {
                      const cleanPhone = client.phone.replace(/\D/g, '')
                      window.open(`https://wa.me/${cleanPhone}`, '_blank')
                    }}
                  >
                    <WhatsAppIcon className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            {client.otherPhone && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br from-blue-50/50 to-white border border-blue-100">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <PhoneCall className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-500 mb-1">Other Phone</p>
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${client.otherPhone}`}
                      className="text-slate-900 hover:text-purple-600 transition-colors"
                    >
                      {client.otherPhone}
                    </a>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-md"
                      onClick={() => {
                        const cleanPhone = client.otherPhone!.replace(/\D/g, '')
                        window.open(`https://wa.me/${cleanPhone}`, '_blank')
                      }}
                    >
                      <WhatsAppIcon className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {client.email && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br from-teal-50/50 to-white border border-teal-100">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-500 mb-1">Email</p>
                  <a
                    href={`mailto:${client.email}`}
                    className="text-slate-900 hover:text-purple-600 transition-colors break-all"
                  >
                    {client.email}
                  </a>
                </div>
              </div>
            )}

            {client.address && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br from-slate-50/50 to-white border border-slate-200 md:col-span-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-500 mb-1">Address</p>
                  <p className="text-slate-900">{client.address}</p>
                </div>
              </div>
            )}
          </div>

          {client.lawyerNotes && (
            <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50/50 to-white border border-purple-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-sm">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <p className="text-sm font-semibold text-slate-700">Lawyer's Notes</p>
              </div>
              <p className="text-slate-900 whitespace-pre-wrap leading-relaxed">{client.lawyerNotes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cases */}
      <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center shadow-sm">
                <Briefcase className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-xl">Cases ({cases.length})</CardTitle>
            </div>
            <Button
              size="sm"
              className="gap-2 bg-purple-600 hover:bg-purple-700"
              onClick={() => setShowQuickCreateDialog(true)}
            >
              <Plus className="h-4 w-4" />
              Add Case
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {cases.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 bg-gradient-to-br from-purple-100 to-purple-50 rounded-full w-fit mx-auto mb-4">
                <Briefcase className="h-12 w-12 text-purple-600" />
              </div>
              <p className="text-slate-900 text-lg font-medium mb-1">No cases found for this client</p>
              <p className="text-slate-600 text-sm mb-4">Create the first case to get started</p>
              <Button
                className="gap-2 bg-purple-600 hover:bg-purple-700"
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
                  <Card className="hover:shadow-lg hover:scale-[1.01] transition-all duration-200 cursor-pointer group border-slate-200 bg-gradient-to-br from-white to-slate-50/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center shadow-sm flex-shrink-0">
                            <Scale className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-base truncate group-hover:text-purple-600 transition-colors font-semibold">
                                {caseItem.caseNumber}
                                {caseItem.year && ` / ${caseItem.year}`}
                              </h3>
                              <Badge className={`${statusColors[caseItem.status as keyof typeof statusColors]} text-xs font-semibold px-3 py-1 shadow-sm`}>
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
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-purple-600 transition-colors flex-shrink-0 mt-1" />
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
        <DialogContent className="w-[calc(100vw-2rem)] max-w-[540px] rounded-xl sm:rounded-2xl max-h-[95vh] p-0 gap-0 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-4 sm:pt-6" style={{ maxHeight: 'calc(95vh - 80px)' }}>
            <DialogHeader className="space-y-2 sm:space-y-3">
              <div className="mx-auto w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <Briefcase className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-semibold text-center">New Case</DialogTitle>
              <DialogDescription className="text-center text-sm sm:text-base">
                Create case quickly for {client?.firstName} {client?.lastName}. Add more details later.
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
    </div>
  )
}
