'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, User, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { format, isFuture, isPast, isToday } from 'date-fns'
import { AppointmentForm } from '@/components/appointments/appointment-form'

type Appointment = {
  id: string
  title: string
  startTime: string
  endTime: string | null
  location: string | null
  client: {
    id: string
    firstName: string
    lastName: string
  } | null
}

type Client = {
  id: string
  firstName: string
  lastName: string
}

export default function AppointmentsPage() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all')

  useEffect(() => {
    fetchAppointments()
    fetchClients()
  }, [user])

  async function fetchAppointments() {
    if (!user?.email) return

    setLoading(true)
    try {
      const response = await fetch(`/api/appointments`)

      if (response.ok) {
        const data = await response.json()
        setAppointments(data.appointments || [])
      }
    } catch (err) {
      console.error('Error fetching appointments:', err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchClients() {
    if (!user?.email) return

    try {
      const response = await fetch(`/api/clients?email=${encodeURIComponent(user.email)}`)

      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || [])
      }
    } catch (err) {
      console.error('Error fetching clients:', err)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this appointment?')) return

    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchAppointments()
      }
    } catch (err) {
      console.error('Error deleting appointment:', err)
    }
  }

  const filteredAppointments = appointments.filter((appointment) => {
    const appointmentDate = new Date(appointment.startTime)
    if (filter === 'upcoming') return isFuture(appointmentDate) || isToday(appointmentDate)
    if (filter === 'past') return isPast(appointmentDate) && !isToday(appointmentDate)
    return true
  })

  if (loading && appointments.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-600">Loading appointments...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6 max-w-6xl px-4 md:px-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Appointments</h1>
          <p className="text-sm md:text-base text-slate-600 mt-1">
            {appointments.length} {appointments.length === 1 ? 'appointment' : 'appointments'}
          </p>
        </div>
        <AppointmentForm clients={clients} onSuccess={fetchAppointments} />
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(['all', 'upcoming', 'past'] as const).map((filterOption) => (
          <button
            key={filterOption}
            onClick={() => setFilter(filterOption)}
            style={
              filter === filterOption
                ? {
                    backgroundColor: '#7c3aed',
                    color: '#ffffff',
                  }
                : {}
            }
            className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-medium text-xs md:text-sm whitespace-nowrap transition-all text-slate-600 hover:bg-slate-100"
          >
            {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500">No appointments found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAppointments.map((appointment) => {
            const appointmentDate = new Date(appointment.startTime)
            const isUpcoming = isFuture(appointmentDate) || isToday(appointmentDate)

            return (
              <Link key={appointment.id} href={`/appointments/${appointment.id}`}>
                <Card className="border border-slate-200 hover:shadow-md hover:border-purple-200 transition-all cursor-pointer group">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Date Badge */}
                      <div
                        className={`flex flex-col items-center justify-center rounded-lg px-3 py-2 min-w-[70px] ${
                          isUpcoming
                            ? 'bg-gradient-to-br from-purple-500 to-purple-600'
                            : 'bg-gradient-to-br from-slate-500 to-slate-600'
                        }`}
                      >
                        <span className="text-xs font-medium text-white uppercase">
                          {format(appointmentDate, 'MMM')}
                        </span>
                        <span className="text-2xl font-bold text-white">
                          {format(appointmentDate, 'd')}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base md:text-lg font-semibold text-slate-900 group-hover:text-purple-700 transition-colors mb-1">
                          {appointment.title}
                        </h3>

                        <div className="flex flex-wrap gap-3 text-xs md:text-sm text-slate-600 mb-2">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {format(appointmentDate, 'h:mm a')}
                            {appointment.endTime &&
                              ` - ${format(new Date(appointment.endTime), 'h:mm a')}`}
                          </span>

                          {appointment.client && (
                            <span className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5" />
                              {appointment.client.firstName} {appointment.client.lastName}
                            </span>
                          )}

                          {appointment.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {appointment.location}
                            </span>
                          )}
                        </div>

                        <Badge
                          className={`text-xs ${
                            isUpcoming
                              ? 'bg-purple-100 text-purple-700 border-purple-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {isToday(appointmentDate)
                            ? 'Today'
                            : isUpcoming
                            ? 'Upcoming'
                            : 'Past'}
                        </Badge>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1" onClick={(e) => e.preventDefault()}>
                        <AppointmentForm
                          appointment={appointment}
                          clients={clients}
                          mode="edit"
                          onSuccess={fetchAppointments}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.preventDefault()
                            handleDelete(appointment.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
