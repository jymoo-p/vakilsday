'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Building2, Edit, Check, X, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

interface Court {
  id: string
  name: string
  _count?: {
    cases: number
  }
}

export default function CourtsPage() {
  const { user } = useAuth()
  const [courts, setCourts] = useState<Court[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCourtName, setNewCourtName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [userRole, setUserRole] = useState<string>('')

  useEffect(() => {
    fetchUserRole()
    fetchCourts()
  }, [user])

  async function fetchUserRole() {
    if (!user?.email) return

    try {
      const response = await fetch(`/api/users/${encodeURIComponent(user.email)}`)
      if (response.ok) {
        const data = await response.json()
        setUserRole(data.user?.role || '')
      }
    } catch (err) {
      console.error('Error fetching user role:', err)
    }
  }

  async function fetchCourts() {
    if (!user?.email) return

    try {
      const response = await fetch(`/api/courts?email=${encodeURIComponent(user.email)}`)
      if (response.ok) {
        const data = await response.json()
        setCourts(data.courts || [])
      }
    } catch (err) {
      console.error('Error fetching courts:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddCourt(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      const response = await fetch('/api/courts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail: user?.email,
          name: newCourtName,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setCourts([...courts, data.court])
        setNewCourtName('')
        setShowAddForm(false)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to add court')
      }
    } catch (err) {
      setError('Failed to add court')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdateCourt(id: string) {
    if (!editingName.trim()) return

    try {
      const response = await fetch(`/api/courts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail: user?.email,
          name: editingName,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setCourts(courts.map(c => c.id === id ? data.court : c))
        setEditingId(null)
        setEditingName('')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to update court')
      }
    } catch (err) {
      alert('Failed to update court')
    }
  }

  async function handleDeleteCourt(courtId: string, courtName: string) {
    if (!confirm(`Are you sure you want to delete "${courtName}"?`)) return

    try {
      const response = await fetch(`/api/courts/${courtId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail: user?.email }),
      })

      if (response.ok) {
        setCourts(courts.filter(c => c.id !== courtId))
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete court')
      }
    } catch (err) {
      alert('Failed to delete court')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-600">Loading courts...</p>
      </div>
    )
  }

  if (userRole !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center py-12">
        <Card>
          <CardContent className="pt-6 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-slate-400" />
            <p className="text-lg text-slate-600">Admin access required</p>
            <p className="text-base text-slate-500 mt-2">Only admins can manage courts</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </Link>
        <div className="flex-1 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Courts</h2>
            <p className="text-lg text-slate-600">Manage court names for case creation</p>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="mr-2 h-5 w-5" />
            Add Court
          </Button>
        </div>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Add New Court
            </CardTitle>
            <CardDescription>Enter a clear court name for easy selection</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddCourt} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="courtName">Court Name</Label>
                <Input
                  id="courtName"
                  placeholder="e.g., Delhi High Court"
                  value={newCourtName}
                  onChange={(e) => setNewCourtName(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={saving || !newCourtName.trim()}>
                  {saving ? 'Adding...' : 'Add Court'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false)
                    setNewCourtName('')
                    setError(null)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {courts.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-slate-400" />
            <p className="text-lg text-slate-600">No courts yet</p>
            <p className="text-base text-slate-500 mt-2">Add courts to use when creating cases</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {courts.map((court) => (
            <Card key={court.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  {editingId === court.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="max-w-md"
                        autoFocus
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleUpdateCourt(court.id)}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <Check className="h-5 w-5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setEditingId(null)
                          setEditingName('')
                        }}
                        className="text-slate-500 hover:text-slate-700"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 flex-1">
                      <Building2 className="h-5 w-5 text-slate-400" />
                      <h3 className="text-xl font-semibold text-slate-900">{court.name}</h3>
                      {court._count && court._count.cases > 0 && (
                        <Badge variant="secondary" className="text-sm">
                          {court._count.cases} case{court._count.cases !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  )}

                  {editingId !== court.id && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingId(court.id)
                          setEditingName(court.name)
                        }}
                      >
                        <Edit className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCourt(court.id, court.name)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
