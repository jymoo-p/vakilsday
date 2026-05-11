'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, User, Phone, Mail, Edit, Trash2 } from 'lucide-react'

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
  _count?: {
    cases: number
  }
}

export default function ClientsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchClients()
  }, [user])

  async function fetchClients() {
    if (!user?.email) return

    try {
      const response = await fetch(`/api/clients?email=${encodeURIComponent(user.email)}`)
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || [])
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(clientId: string, clientName: string, caseCount: number) {
    if (caseCount > 0) {
      alert(`${clientName} is associated with ${caseCount} case(s). Please delete or reassign the case(s) first.`)
      return
    }

    if (!confirm(`Are you sure you want to delete ${clientName}?`)) return

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: user?.email }),
      })

      if (response.ok) {
        setClients(clients.filter(c => c.id !== clientId))
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete client')
      }
    } catch (error) {
      alert('Failed to delete client')
    }
  }

  const filteredClients = clients.filter(client =>
    `${client.firstName} ${client.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone.includes(searchQuery) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-600">Loading clients...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Clients</h2>
          <p className="text-lg text-slate-600">Manage your client information</p>
        </div>
        <Button onClick={() => router.push('/clients/new')}>
          <Plus className="mr-2 h-5 w-5" />
          Add Client
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by name, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredClients.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <User className="h-12 w-12 mx-auto mb-4 text-slate-400" />
            <p className="text-lg text-slate-600">
              {searchQuery ? 'No clients found' : 'No clients yet'}
            </p>
            <p className="text-base text-slate-500 mt-2">
              {searchQuery ? 'Try a different search term' : 'Add your first client to get started'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredClients.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-semibold text-slate-900">
                        {client.firstName} {client.lastName}
                      </h3>
                      <Badge variant="secondary" className="text-sm">
                        {client.gender}
                      </Badge>
                      {client.age && (
                        <span className="text-sm text-slate-500">{client.age} years</span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-base text-slate-600">
                        <Phone className="h-4 w-4 flex-shrink-0" />
                        <span>{client.phone}</span>
                        {client.otherPhone && (
                          <span className="text-slate-400">• {client.otherPhone}</span>
                        )}
                      </div>

                      {client.email && (
                        <div className="flex items-center gap-2 text-base text-slate-600">
                          <Mail className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{client.email}</span>
                        </div>
                      )}

                      {client.address && (
                        <div className="text-base text-slate-600 col-span-full">
                          <span className="font-medium">Address:</span> {client.address}
                        </div>
                      )}

                      {client._count && client._count.cases > 0 && (
                        <div className="text-base text-slate-600">
                          <span className="font-medium">{client._count.cases}</span> active case(s)
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push(`/clients/${client.id}/edit`)}
                    >
                      <Edit className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        handleDelete(
                          client.id,
                          `${client.firstName} ${client.lastName}`,
                          client._count?.cases || 0
                        )
                      }
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
