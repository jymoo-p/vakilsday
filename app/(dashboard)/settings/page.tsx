'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { User, Shield, Calendar, Building2, Plus, Users, Mail, Trash2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert } from '@/components/ui/alert'

interface Organization {
  id: string
  name: string
  slug: string
  role: string
}

interface TeamMember {
  id: string
  name: string | null
  email: string
  role: string
}

export default function SettingsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<any>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [showCreateOrg, setShowCreateOrg] = useState(false)
  const [newOrgName, setNewOrgName] = useState('')
  const [creatingOrg, setCreatingOrg] = useState(false)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [showAddMember, setShowAddMember] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberRole, setNewMemberRole] = useState('ASSOCIATE')
  const [addingMember, setAddingMember] = useState(false)
  const [memberError, setMemberError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      if (!user?.email) return

      try {
        // Fetch user data
        const userResponse = await fetch(`/api/users/${encodeURIComponent(user.email)}`)
        if (userResponse.ok) {
          const data = await userResponse.json()
          setUserData(data.user)

          // Set current organization
          if (data.user?.organization) {
            setOrganizations([{
              id: data.user.organization.id,
              name: data.user.organization.name,
              slug: data.user.organization.slug,
              role: data.user.role
            }])

            // Fetch team members if admin
            if (data.user.role === 'ADMIN') {
              fetchTeamMembers(data.user.organizationId)
            }
          }
        }
      } catch (error) {
        console.error('Error fetching settings data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  async function fetchTeamMembers(organizationId: string) {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/members`)
      if (response.ok) {
        const data = await response.json()
        setTeamMembers(data.members || [])
      }
    } catch (error) {
      console.error('Error fetching team members:', error)
    }
  }

  async function handleCreateOrganization(e: React.FormEvent) {
    e.preventDefault()
    setCreatingOrg(true)

    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firmName: newOrgName,
          userName: user?.displayName || user?.email,
          userEmail: user?.email,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Refresh page to show new organization
        window.location.reload()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create organization')
      }
    } catch (error) {
      console.error('Error creating organization:', error)
      alert('Failed to create organization')
    } finally {
      setCreatingOrg(false)
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault()
    setMemberError(null)
    setAddingMember(true)

    if (!userData?.organizationId) {
      setMemberError('No organization found')
      setAddingMember(false)
      return
    }

    try {
      const response = await fetch(`/api/organizations/${userData.organizationId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newMemberEmail,
          role: newMemberRole,
          adminEmail: user?.email,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setTeamMembers([...teamMembers, data.member])
        setNewMemberEmail('')
        setNewMemberRole('ASSOCIATE')
        setShowAddMember(false)
      } else {
        const error = await response.json()
        setMemberError(error.error || 'Failed to add member')
      }
    } catch (error) {
      console.error('Error adding member:', error)
      setMemberError('Failed to add member')
    } finally {
      setAddingMember(false)
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!confirm('Are you sure you want to remove this member?')) return

    try {
      const response = await fetch(`/api/organizations/${userData?.organizationId}/members/${memberId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail: user?.email }),
      })

      if (response.ok) {
        setTeamMembers(teamMembers.filter(m => m.id !== memberId))
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to remove member')
      }
    } catch (error) {
      console.error('Error removing member:', error)
      alert('Failed to remove member')
    }
  }

  async function handleUpdateMemberRole(memberId: string, newRole: string | null) {
    if (!newRole) return

    try {
      const response = await fetch(`/api/organizations/${userData?.organizationId}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: newRole,
          adminEmail: user?.email,
        }),
      })

      if (response.ok) {
        setTeamMembers(teamMembers.map(m =>
          m.id === memberId ? { ...m, role: newRole } : m
        ))
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update role')
      }
    } catch (error) {
      console.error('Error updating role:', error)
      alert('Failed to update role')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your account and organizations</p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{user?.displayName || 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organizations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                My Organizations
              </CardTitle>
              <CardDescription>Law firms you belong to</CardDescription>
            </div>
            <Button onClick={() => setShowCreateOrg(!showCreateOrg)} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create New Firm
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showCreateOrg && (
            <form onSubmit={handleCreateOrganization} className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <div className="space-y-2">
                <Label htmlFor="orgName">New Law Firm Name</Label>
                <Input
                  id="orgName"
                  placeholder="e.g., Sharma & Associates"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={creatingOrg}>
                  {creatingOrg ? 'Creating...' : 'Create Firm'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateOrg(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          <Separator />

          {organizations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>You don't belong to any organizations yet</p>
              <p className="text-sm">Create your first law firm to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {organizations.map((org) => (
                <div key={org.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{org.name}</p>
                    <p className="text-sm text-muted-foreground">@{org.slug}</p>
                  </div>
                  <Badge>{org.role}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Members - Only for Admins */}
      {userData?.role === 'ADMIN' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Members
                </CardTitle>
                <CardDescription>Manage your organization's team</CardDescription>
              </div>
              <Button onClick={() => setShowAddMember(!showAddMember)} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {showAddMember && (
              <form onSubmit={handleAddMember} className="space-y-4 p-4 border rounded-lg bg-muted/50">
                {memberError && (
                  <Alert variant="destructive">{memberError}</Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="memberEmail">Email Address</Label>
                  <Input
                    id="memberEmail"
                    type="email"
                    placeholder="colleague@example.com"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    They will need to sign in with this Google account
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="memberRole">Role</Label>
                  <Select value={newMemberRole} onValueChange={(value) => {
                    if (value) setNewMemberRole(value)
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ASSOCIATE">Associate - Can create and edit cases</SelectItem>
                      <SelectItem value="CLERK">Clerk - Can view and update hearings</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={addingMember}>
                    {addingMember ? 'Adding...' : 'Add Member'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => {
                    setShowAddMember(false)
                    setMemberError(null)
                  }}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            <Separator />

            {teamMembers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No team members yet</p>
                <p className="text-sm">Add members to collaborate on cases</p>
              </div>
            ) : (
              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{member.name || member.email}</p>
                        <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Select
                        value={member.role}
                        onValueChange={(role) => {
                          if (role) handleUpdateMemberRole(member.id, role)
                        }}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                          <SelectItem value="ASSOCIATE">Associate</SelectItem>
                          <SelectItem value="CLERK">Clerk</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Permissions */}
      {userData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Permissions
            </CardTitle>
            <CardDescription>Your access level in {userData.organization?.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userData.role === 'ADMIN' && (
                <>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm">View all cases</span>
                    <Badge variant="secondary">Granted</Badge>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm">Create and edit cases</span>
                    <Badge variant="secondary">Granted</Badge>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm">Delete cases</span>
                    <Badge variant="secondary">Granted</Badge>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm">Manage team members</span>
                    <Badge variant="secondary">Granted</Badge>
                  </div>
                </>
              )}
              {userData.role === 'ASSOCIATE' && (
                <>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm">View assigned cases</span>
                    <Badge variant="secondary">Granted</Badge>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm">Create and edit cases</span>
                    <Badge variant="secondary">Granted</Badge>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm">Legal research</span>
                    <Badge variant="secondary">Granted</Badge>
                  </div>
                </>
              )}
              {userData.role === 'CLERK' && (
                <>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm">View assigned cases</span>
                    <Badge variant="secondary">Granted</Badge>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm">Update hearing dates</span>
                    <Badge variant="secondary">Granted</Badge>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm">View private notes</span>
                    <Badge variant="outline">Restricted</Badge>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar Integration
          </CardTitle>
          <CardDescription>
            Sync your hearing dates with Google Calendar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Status</p>
              <p className="text-sm text-muted-foreground">
                Connected via Google OAuth
              </p>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Active
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
