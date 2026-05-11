'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Scale, Edit, Check, X, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface CaseType {
  id: string
  name: string
  _count?: {
    cases: number
  }
}

export default function CaseTypesPage() {
  const { user } = useAuth()
  const [caseTypes, setCaseTypes] = useState<CaseType[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCaseTypeName, setNewCaseTypeName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [userRole, setUserRole] = useState<string>('')

  useEffect(() => {
    fetchUserRole()
    fetchCaseTypes()
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

  async function fetchCaseTypes() {
    if (!user?.email) return

    try {
      const response = await fetch(`/api/case-types?email=${encodeURIComponent(user.email)}`)
      if (response.ok) {
        const data = await response.json()
        setCaseTypes(data.caseTypes || [])
      }
    } catch (err) {
      console.error('Error fetching case types:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddCaseType(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      const response = await fetch('/api/case-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail: user?.email,
          name: newCaseTypeName,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setCaseTypes([...caseTypes, data.caseType])
        setNewCaseTypeName('')
        setShowAddForm(false)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to add case type')
      }
    } catch (err) {
      setError('Failed to add case type')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdateCaseType(id: string) {
    if (!editingName.trim()) return

    try {
      const response = await fetch(`/api/case-types/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail: user?.email,
          name: editingName,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setCaseTypes(caseTypes.map(ct => ct.id === id ? data.caseType : ct))
        setEditingId(null)
        setEditingName('')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to update case type')
      }
    } catch (err) {
      alert('Failed to update case type')
    }
  }

  async function handleDeleteCaseType(caseTypeId: string, caseTypeName: string) {
    if (!confirm(`Are you sure you want to delete "${caseTypeName}"?`)) return

    try {
      const response = await fetch(`/api/case-types/${caseTypeId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail: user?.email }),
      })

      if (response.ok) {
        setCaseTypes(caseTypes.filter(ct => ct.id !== caseTypeId))
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete case type')
      }
    } catch (err) {
      alert('Failed to delete case type')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-600">Loading case types...</p>
      </div>
    )
  }

  if (userRole !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center py-12">
        <Card>
          <CardContent className="pt-6 text-center">
            <Scale className="h-12 w-12 mx-auto mb-4 text-slate-400" />
            <p className="text-lg text-slate-600">Admin access required</p>
            <p className="text-base text-slate-500 mt-2">Only admins can manage case types</p>
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
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Case Types</h2>
            <p className="text-lg text-slate-600">Manage case type names for case creation</p>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="mr-2 h-5 w-5" />
            Add Case Type
          </Button>
        </div>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Add New Case Type
            </CardTitle>
            <CardDescription>Enter a clear case type name for easy selection</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddCaseType} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="caseTypeName">Case Type Name</Label>
                <Input
                  id="caseTypeName"
                  placeholder="e.g., Civil Suit, Criminal Appeal"
                  value={newCaseTypeName}
                  onChange={(e) => setNewCaseTypeName(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={saving || !newCaseTypeName.trim()}>
                  {saving ? 'Adding...' : 'Add Case Type'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false)
                    setNewCaseTypeName('')
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

      {caseTypes.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Scale className="h-12 w-12 mx-auto mb-4 text-slate-400" />
            <p className="text-lg text-slate-600">No case types yet</p>
            <p className="text-base text-slate-500 mt-2">Add case types to use when creating cases</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {caseTypes.map((caseType) => (
            <Card key={caseType.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  {editingId === caseType.id ? (
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
                        onClick={() => handleUpdateCaseType(caseType.id)}
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
                      <Scale className="h-5 w-5 text-slate-400" />
                      <h3 className="text-xl font-semibold text-slate-900">{caseType.name}</h3>
                      {caseType._count && caseType._count.cases > 0 && (
                        <Badge variant="secondary" className="text-sm">
                          {caseType._count.cases} case{caseType._count.cases !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  )}

                  {editingId !== caseType.id && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingId(caseType.id)
                          setEditingName(caseType.name)
                        }}
                      >
                        <Edit className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCaseType(caseType.id, caseType.name)}
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
