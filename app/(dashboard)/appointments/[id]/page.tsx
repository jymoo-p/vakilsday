'use client'

import { useState, useEffect, use } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Mail,
  Phone,
  FileText,
  ArrowLeft,
  Edit,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { AppointmentForm } from '@/components/appointments/appointment-form'
import { useRouter } from 'next/navigation'

type Client = {
  id: string
  firstName: string
  lastName: string
  phone: string
  email: string | null
  address: string | null
  gender: string
  age: number | null
}

type Case = {
  id: string
  caseNumber: string
  status: string
  filingDate: string
  nextHearingDate: string | null
  court: {
    name: string
  } | null
  caseType: {
    name: string
  } | null
}

type Appointment = {
  id: string
  title: string
  startTime: string
  endTime: string | null
  location: string | null
  notes: string | null
  clientId: string | null
  client: Client | null
}

export default function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const { user } = useAuth()
  const router = useRouter()
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [clientCases, setClientCases] = useState<Case[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAppointment()
    fetchClients()
  }, [user, resolvedParams.id])

  async function fetchAppointment() {
    if (!user?.email) return

    setLoading(true)
    try {
      const response = await fetch(`/api/appointments/${resolvedParams.id}`)

      if (response.ok) {
        const data = await response.json()
        setAppointment(data.appointment)
        setClientCases(data.clientCases || [])
      }
    } catch (err) {
      console.error('Error fetching appointment:', err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchClients() {
    if (!user?.email) return

    try {
      const response = await fetch(
        `/api/clients?email=${encodeURIComponent(user.email)}`
      )

      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || [])
      }
    } catch (err) {
      console.error('Error fetching clients:', err)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this appointment?')) return

    try {
      const response = await fetch(`/api/appointments/${resolvedParams.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/appointments')
      }
    } catch (err) {
      console.error('Error deleting appointment:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-600">Loading...</p>
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-600">Appointment not found</p>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'CLOSED':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  return (
    <div className="space-y-4 md:space-y-6 max-w-6xl px-4 md:px-0">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/appointments">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              {appointment.title}
            </h1>
            <p className="text-sm md:text-base text-slate-600 mt-1">
              {format(new Date(appointment.startTime), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <AppointmentForm
            appointment={appointment}
            clients={clients}
            mode="edit"
            onSuccess={fetchAppointment}
            trigger={
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            }
          />
          <Button variant="outline" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Left Column - Appointment Details */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          {/* Appointment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Appointment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Start Time</p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span className="font-medium text-slate-900">
                      {format(new Date(appointment.startTime), 'h:mm a')}
                    </span>
                  </div>
                </div>

                {appointment.endTime && (
                  <div>
                    <p className="text-sm text-slate-500 mb-1">End Time</p>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <span className="font-medium text-slate-900">
                        {format(new Date(appointment.endTime), 'h:mm a')}
                      </span>
                    </div>
                  </div>
                )}

                {appointment.location && (
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Location</p>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span className="font-medium text-slate-900">
                        {appointment.location}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {appointment.notes && (
                <div>
                  <p className="text-sm text-slate-500 mb-2">Notes</p>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                      {appointment.notes}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Client's Cases */}
          {appointment.client && clientCases.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Client Cases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {clientCases.map((caseItem) => (
                    <Link key={caseItem.id} href={`/cases/${caseItem.id}`}>
                      <Card className="border border-slate-200 hover:shadow-md hover:border-purple-200 transition-all cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-base font-semibold text-slate-900">
                              {caseItem.caseNumber}
                            </h4>
                            <Badge className={getStatusColor(caseItem.status)}>
                              {caseItem.status}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            {caseItem.court && (
                              <div>
                                <p className="text-xs text-slate-500">Court</p>
                                <p className="font-medium text-slate-900">
                                  {caseItem.court.name}
                                </p>
                              </div>
                            )}

                            {caseItem.caseType && (
                              <div>
                                <p className="text-xs text-slate-500">Type</p>
                                <p className="font-medium text-slate-900">
                                  {caseItem.caseType.name}
                                </p>
                              </div>
                            )}

                            {caseItem.nextHearingDate && (
                              <div>
                                <p className="text-xs text-slate-500">Next Hearing</p>
                                <p className="font-medium text-slate-900">
                                  {format(
                                    new Date(caseItem.nextHearingDate),
                                    'MMM d, yyyy'
                                  )}
                                </p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Client Info */}
        {appointment.client && (
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Client Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">
                    {appointment.client.firstName} {appointment.client.lastName}
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Phone className="h-4 w-4 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500">Phone</p>
                        <p className="text-sm font-medium text-slate-900">
                          {appointment.client.phone}
                        </p>
                      </div>
                    </div>

                    {appointment.client.email && (
                      <div className="flex items-start gap-2">
                        <Mail className="h-4 w-4 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500">Email</p>
                          <p className="text-sm font-medium text-slate-900">
                            {appointment.client.email}
                          </p>
                        </div>
                      </div>
                    )}

                    {appointment.client.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500">Address</p>
                          <p className="text-sm font-medium text-slate-900">
                            {appointment.client.address}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-4 pt-2">
                      {appointment.client.age && (
                        <div>
                          <p className="text-xs text-slate-500">Age</p>
                          <p className="text-sm font-medium text-slate-900">
                            {appointment.client.age}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-slate-500">Gender</p>
                        <p className="text-sm font-medium text-slate-900">
                          {appointment.client.gender}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Link href={`/clients/${appointment.client.id}`}>
                  <Button variant="outline" className="w-full">
                    <User className="h-4 w-4 mr-2" />
                    View Client Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
