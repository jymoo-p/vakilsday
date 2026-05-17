'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, User, Phone, Mail, MessageCircle } from 'lucide-react'

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

  const filteredClients = clients.filter(client => {
    const fullName = client.lastName ? `${client.firstName} ${client.lastName}` : client.firstName
    return fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone.includes(searchQuery) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase())
  })

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
            const initials = client.lastName
              ? `${client.firstName[0]}${client.lastName[0]}`.toUpperCase()
              : client.firstName.substring(0, 2).toUpperCase()
            return (
              <Card
                key={client.id}
                className="hover:shadow-lg hover:scale-[1.02] transition-all duration-200 group cursor-pointer"
                onClick={() => router.push(`/clients/${client.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-semibold text-purple-600">{initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate group-hover:text-primary transition-colors">
                        {client.firstName} {client.lastName || ''}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {client.gender && <span className="text-xs text-slate-500">{client.gender}</span>}
                        {client.age && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="text-xs text-slate-500">{client.age} years</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                        {client._count?.cases || 0}
                      </Badge>
                      {/* Action Icons */}
                      <div className="flex gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                          onClick={(e) => {
                            e.stopPropagation()
                            window.location.href = `tel:${client.phone}`
                          }}
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                          onClick={(e) => {
                            e.stopPropagation()
                            const cleanPhone = client.phone.replace(/\D/g, '')
                            window.open(`https://wa.me/${cleanPhone}`, '_blank')
                          }}
                        >
                          <WhatsAppIcon className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
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
