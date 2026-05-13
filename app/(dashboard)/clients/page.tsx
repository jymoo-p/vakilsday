'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
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
        <div className="animate-pulse space-y-3 w-full max-w-5xl">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-200 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Clients</h1>
          <p className="text-slate-600 mt-1">
            {filteredClients.length} {filteredClients.length === 1 ? 'client' : 'clients'}
          </p>
        </div>
        <Button onClick={() => router.push('/clients/new')} className="gap-2 bg-slate-900 hover:bg-slate-800">
          <Plus className="h-4 w-4" />
          Add Client
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search by name, phone, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 h-11 text-base border-slate-300 focus:border-slate-900 focus:ring-slate-900"
        />
      </div>

      {/* Clients List */}
      {filteredClients.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="p-4 bg-slate-100 rounded-full w-fit mx-auto mb-4">
              <User className="h-12 w-12 text-slate-400" />
            </div>
            <p className="text-lg font-medium text-slate-900">
              {searchQuery ? 'No clients found' : 'No clients yet'}
            </p>
            <p className="text-slate-600 mt-1">
              {searchQuery ? 'Try a different search term' : 'Add your first client to get started'}
            </p>
            {!searchQuery && (
              <Button onClick={() => router.push('/clients/new')} className="mt-4 bg-slate-900 hover:bg-slate-800">
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredClients.map((client) => (
            <Card
              key={client.id}
              className="border-l-4 border-l-slate-900 hover:shadow-md transition-all duration-200 group"
            >
              <CardContent className="py-4">
                <div className="flex items-center justify-between gap-6">
                  {/* Left: Name & Gender */}
                  <div className="flex items-center gap-4 min-w-0 flex-shrink-0 w-64">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-slate-900 truncate">
                        {client.firstName} {client.lastName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs font-medium px-2 py-0.5">
                          {client.gender}
                        </Badge>
                        {client.age && (
                          <span className="text-xs text-slate-500">{client.age} years</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Contact Details */}
                  <div className="flex-1 min-w-0">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500 mb-0.5">Phone</p>
                        <div className="flex items-center gap-1.5 text-sm text-slate-900">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          <span className="font-medium">{client.phone}</span>
                          {client.otherPhone && (
                            <span className="text-slate-400">• {client.otherPhone}</span>
                          )}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500 mb-0.5">Email</p>
                        <div className="flex items-center gap-1.5 text-sm text-slate-900">
                          {client.email ? (
                            <>
                              <Mail className="h-3.5 w-3.5 text-slate-400" />
                              <span className="font-medium truncate">{client.email}</span>
                            </>
                          ) : (
                            <span className="text-slate-400 text-sm">Not provided</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Cases & Actions */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    {client._count && (
                      <div className="px-4 py-2 bg-slate-50 rounded-lg text-center">
                        <p className="text-lg font-bold text-slate-900">
                          {client._count.cases}
                        </p>
                        <p className="text-xs text-slate-500">Cases</p>
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={(e) => {
                          e.preventDefault()
                          router.push(`/clients/${client.id}/edit`)
                        }}
                      >
                        <Edit className="h-4 w-4 text-slate-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.preventDefault()
                          handleDelete(
                            client.id,
                            `${client.firstName} ${client.lastName}`,
                            client._count?.cases || 0
                          )
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
