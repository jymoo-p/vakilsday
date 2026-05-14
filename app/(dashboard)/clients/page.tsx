'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, User, Phone, Mail } from 'lucide-react'

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
        <div className="animate-pulse space-y-3 w-full max-w-5xl px-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-200 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl px-4 md:px-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Clients</h1>
          <p className="text-sm md:text-base text-slate-600 mt-1">
            {filteredClients.length} {filteredClients.length === 1 ? 'client' : 'clients'}
          </p>
        </div>
        <Button onClick={() => router.push('/clients/new')} className="gap-2 bg-slate-900 hover:bg-slate-800 h-9 md:h-10 text-sm md:text-base">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Client</span>
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 md:left-4 top-1/2 h-4 w-4 md:h-5 md:w-5 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search clients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 md:pl-12 h-10 md:h-11 text-sm md:text-base border-slate-300 focus:border-slate-900 focus:ring-slate-900"
        />
      </div>

      {/* Clients List */}
      {filteredClients.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="pt-8 pb-8 md:pt-12 md:pb-12 text-center">
            <div className="p-3 md:p-4 bg-slate-100 rounded-full w-fit mx-auto mb-3 md:mb-4">
              <User className="h-8 w-8 md:h-12 md:w-12 text-slate-400" />
            </div>
            <p className="text-base md:text-lg font-medium text-slate-900">
              {searchQuery ? 'No clients found' : 'No clients yet'}
            </p>
            <p className="text-sm md:text-base text-slate-600 mt-1">
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => {
            const initials = `${client.firstName[0]}${client.lastName[0]}`.toUpperCase()
            return (
              <Card
                key={client.id}
                className="hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer group"
                onClick={() => router.push(`/clients/${client.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-semibold text-purple-600">{initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate group-hover:text-primary transition-colors">
                        {client.firstName} {client.lastName}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500">{client.gender}</span>
                        {client.age && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="text-xs text-slate-500">{client.age} years</span>
                          </>
                        )}
                      </div>
                    </div>
                    {client._count && client._count.cases > 0 && (
                      <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                        {client._count.cases}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="mt-3 space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{client.phone}</span>
                    </div>
                    {client.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}
                  </CardDescription>
                </CardHeader>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
