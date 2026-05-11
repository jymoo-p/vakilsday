'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Users, Mail, Phone, Shield } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface TeamMember {
  id: string
  name: string | null
  email: string
  phone: string | null
  role: string
  customRole?: {
    id: string
    name: string
  } | null
}

interface CustomRole {
  id: string
  name: string
  permissions: string[]
}

export default function TeamPage() {
  const { user } = useAuth()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddMember, setShowAddMember] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'ASSOCIATE',
    customRoleId: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string>('')

  useEffect(() => {
    fetchData()
  }, [user])

  async function fetchData() {
    if (!user?.email) return

    try {
      // Fetch user role
      const userResponse = await fetch(`/api/users/${encodeURIComponent(user.email)}`)
      if (userResponse.ok) {
        const userData = await userResponse.json()
        setUserRole(userData.user?.role || '')

        if (userData.user?.role === 'ADMIN' && userData.user?.organizationId) {
          // Fetch team members
          const membersResponse = await fetch(
            `/api/organizations/${userData.user.organizationId}/members`
          )
          if (membersResponse.ok) {
            const membersData = await membersResponse.json()
            setMembers(membersData.members || [])
          }

          // Fetch custom roles
          const rolesResponse = await fetch(`/api/roles?email=${encodeURIComponent(user.email)}`)
          if (rolesResponse.ok) {
            const rolesData = await rolesResponse.json()
            setCustomRoles(rolesData.roles || [])
          }
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      const response = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail: user?.email,
          ...formData,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setMembers([...members, data.member])
        setFormData({ name: '', email: '', phone: '', role: 'ASSOCIATE', customRoleId: '' })
        setShowAddMember(false)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to add member')
      }
    } catch (err) {
      setError('Failed to add member')
    } finally {
      setSaving(false)
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!confirm('Are you sure you want to remove this team member?')) return

    try {
      const response = await fetch(`/api/team/${memberId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail: user?.email }),
      })

      if (response.ok) {
        setMembers(members.filter(m => m.id !== memberId))
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to remove member')
      }
    } catch (err) {
      alert('Failed to remove member')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-600">Loading team...</p>
      </div>
    )
  }

  if (userRole !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center py-12">
        <Card>
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-slate-400" />
            <p className="text-lg text-slate-600">Admin access required</p>
            <p className="text-base text-slate-500 mt-2">Only admins can manage team members</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">My Team</h2>
          <p className="text-lg text-slate-600">Manage lawyers and clerks</p>
        </div>
        <Button onClick={() => setShowAddMember(!showAddMember)}>
          <Plus className="mr-2 h-5 w-5" />
          Add Member
        </Button>
      </div>

      {showAddMember && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Add New Team Member
            </CardTitle>
            <CardDescription>Invite a lawyer or clerk to your firm</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddMember} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="Full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">System Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => {
                      if (value) setFormData({ ...formData, role: value })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin - Full access</SelectItem>
                      <SelectItem value="ASSOCIATE">Associate - Standard access</SelectItem>
                      <SelectItem value="CLERK">Clerk - Limited access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {customRoles.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="customRole">Custom Role (Optional)</Label>
                  <Select
                    value={formData.customRoleId}
                    onValueChange={(value) => {
                      if (value) setFormData({ ...formData, customRoleId: value })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a custom role (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {customRoles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-slate-500">
                    Custom roles define specific page access permissions
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Adding...' : 'Add Member'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddMember(false)
                    setFormData({ name: '', email: '', phone: '', role: 'ASSOCIATE', customRoleId: '' })
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

      {members.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-slate-400" />
            <p className="text-lg text-slate-600">No team members yet</p>
            <p className="text-base text-slate-500 mt-2">Add lawyers and clerks to start collaborating</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {members.map((member) => (
            <Card key={member.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-semibold text-slate-900">
                        {member.name || member.email}
                      </h3>
                      <Badge className="bg-slate-900 text-white">
                        {member.role}
                      </Badge>
                      {member.customRole && (
                        <Badge variant="secondary">
                          {member.customRole.name}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-base text-slate-600">
                        <Mail className="h-4 w-4" />
                        {member.email}
                      </div>
                      {member.phone && (
                        <div className="flex items-center gap-2 text-base text-slate-600">
                          <Phone className="h-4 w-4" />
                          {member.phone}
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveMember(member.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
