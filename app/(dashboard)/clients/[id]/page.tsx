'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, Phone, Mail, MapPin, Plus, FileText, Calendar, Building2 } from 'lucide-react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'

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
    ACTIVE: 'bg-green-100 text-green-800 border-green-300',
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    CLOSED: 'bg-slate-100 text-slate-600 border-slate-300',
    ARCHIVED: 'bg-slate-50 text-slate-500 border-slate-200',
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
            <Link href={`/cases/new?clientId=${client.id}&clientName=${encodeURIComponent(client.lastName ? `${client.firstName} ${client.lastName}` : client.firstName)}`}>
              <Button size="sm" className="gap-2 bg-slate-900 hover:bg-slate-800">
                <Plus className="h-4 w-4" />
                Add Case
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {cases.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 text-lg mb-4">No cases found for this client</p>
              <Link href={`/cases/new?clientId=${client.id}&clientName=${encodeURIComponent(client.lastName ? `${client.firstName} ${client.lastName}` : client.firstName)}`}>
                <Button className="gap-2 bg-slate-900 hover:bg-slate-800">
                  <Plus className="h-4 w-4" />
                  Add First Case
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {cases.map((caseItem) => (
                <Link key={caseItem.id} href={`/cases/${caseItem.id}`}>
                  <Card className="border-l-4 border-l-slate-900 hover:shadow-md transition-all cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-slate-900">
                              {caseItem.caseNumber}
                              {caseItem.year && ` / ${caseItem.year}`}
                            </h3>
                            <Badge className={statusColors[caseItem.status as keyof typeof statusColors]}>
                              {caseItem.status}
                            </Badge>
                          </div>

                          <div className="space-y-1 text-sm text-slate-600">
                            <p>
                              <span className="font-medium">vs</span> {caseItem.opponentMainParty}
                            </p>

                            {caseItem.court && (
                              <div className="flex items-center gap-1">
                                <Building2 className="h-3.5 w-3.5" />
                                <span>{caseItem.court.name}</span>
                                {caseItem.courtNumber && <span>• Court {caseItem.courtNumber}</span>}
                              </div>
                            )}

                            {caseItem.nextHearingDate && (
                              <div className="flex items-center gap-1 text-slate-900 font-medium">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>Next: {format(parseISO(caseItem.nextHearingDate), 'MMM d, yyyy')}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {caseItem.caseType && (
                          <Badge variant="outline" className="text-xs">
                            {caseItem.caseType.name}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
