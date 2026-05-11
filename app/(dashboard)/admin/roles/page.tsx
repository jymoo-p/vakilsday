'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Shield, CheckSquare, Square, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface CustomRole {
  id: string
  name: string
  permissions: string[]
  _count?: { users: number }
}

const AVAILABLE_PAGES = [
  { id: 'dashboard', name: 'Dashboard' },
  { id: 'cases', name: 'Cases' },
  { id: 'clients', name: 'Clients' },
  { id: 'calendar', name: 'Calendar' },
  { id: 'research', name: 'Research' },
  { id: 'admin', name: 'Admin' },
  { id: 'settings', name: 'Settings' },
]

export default function RolesPage() {
  const { user } = useAuth()
  const [roles, setRoles] = useState<CustomRole[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddRole, setShowAddRole] = useState(false)
  const [newRoleName, setNewRoleName] = useState('')
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRoles()
  }, [user])

  async function fetchRoles() {
    if (!user?.email) return

    try {
      const response = await fetch(`/api/roles?email=${encodeURIComponent(user.email)}`)
      if (response.ok) {
        const data = await response.json()
        setRoles(data.roles || [])
      }
    } catch (err) {
      console.error('Error fetching roles:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateRole(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail: user?.email,
          name: newRoleName,
          permissions: selectedPermissions,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setRoles([...roles, data.role])
        setNewRoleName('')
        setSelectedPermissions([])
        setShowAddRole(false)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to create role')
      }
    } catch (err) {
      setError('Failed to create role')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteRole(roleId: string) {
    if (!confirm('Are you sure you want to delete this role? Users with this role will be set to default role.')) return

    try {
      const response = await fetch(`/api/roles/${roleId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail: user?.email }),
      })

      if (response.ok) {
        setRoles(roles.filter(r => r.id !== roleId))
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete role')
      }
    } catch (err) {
      alert('Failed to delete role')
    }
  }

  function togglePermission(pageId: string) {
    setSelectedPermissions(prev =>
      prev.includes(pageId)
        ? prev.filter(p => p !== pageId)
        : [...prev, pageId]
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-600">Loading roles...</p>
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
            <h2 className="text-3xl font-bold text-slate-900">Roles</h2>
            <p className="text-lg text-slate-600">Manage custom roles and permissions</p>
          </div>
          <Button onClick={() => setShowAddRole(!showAddRole)}>
            <Plus className="mr-2 h-5 w-5" />
            Create Role
          </Button>
        </div>
      </div>

      {showAddRole && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Create New Role
            </CardTitle>
            <CardDescription>Define a custom role with specific page access</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateRole} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="roleName">Role Name</Label>
                <Input
                  id="roleName"
                  placeholder="e.g., Senior Associate, Junior Clerk"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-3">
                <Label>Page Access Permissions</Label>
                <div className="grid gap-3">
                  {AVAILABLE_PAGES.map((page) => (
                    <div
                      key={page.id}
                      onClick={() => togglePermission(page.id)}
                      className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      {selectedPermissions.includes(page.id) ? (
                        <CheckSquare className="h-5 w-5 text-slate-900" />
                      ) : (
                        <Square className="h-5 w-5 text-slate-400" />
                      )}
                      <span className="text-base font-medium text-slate-900">{page.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={saving || !newRoleName || selectedPermissions.length === 0}>
                  {saving ? 'Creating...' : 'Create Role'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddRole(false)
                    setNewRoleName('')
                    setSelectedPermissions([])
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

      {roles.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-slate-400" />
            <p className="text-lg text-slate-600">No custom roles yet</p>
            <p className="text-base text-slate-500 mt-2">Create custom roles to manage team member permissions</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {roles.map((role) => (
            <Card key={role.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      {role.name}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {role._count?.users || 0} team member{role._count?.users !== 1 ? 's' : ''} assigned
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteRole(role.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div>
                  <p className="text-sm text-slate-600 mb-3 font-medium">Can Access:</p>
                  <div className="flex flex-wrap gap-2">
                    {role.permissions.map((perm) => {
                      const page = AVAILABLE_PAGES.find(p => p.id === perm)
                      return (
                        <Badge key={perm} variant="secondary" className="text-sm">
                          {page?.name || perm}
                        </Badge>
                      )
                    })}
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
