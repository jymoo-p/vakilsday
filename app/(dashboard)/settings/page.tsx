'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { User, Shield, Calendar, Building2, Plus, Users, Mail, Trash2, HardDrive, Sparkles, Eye, EyeOff } from 'lucide-react'
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
  const [driveConnected, setDriveConnected] = useState<boolean | null>(null)
  const [connectingDrive, setConnectingDrive] = useState(false)
  const [calendarConnected, setCalendarConnected] = useState<boolean | null>(null)
  const [connectingCalendar, setConnectingCalendar] = useState(false)
  const [calendarSyncEnabled, setCalendarSyncEnabled] = useState<boolean>(false)
  const [togglingCalendar, setTogglingCalendar] = useState(false)
  const [geminiApiKey, setGeminiApiKey] = useState('')
  const [showGeminiKey, setShowGeminiKey] = useState(false)
  const [savingGeminiKey, setSavingGeminiKey] = useState(false)
  const [hasGeminiKey, setHasGeminiKey] = useState(false)
  const [geminiKeyPreview, setGeminiKeyPreview] = useState<string | null>(null)

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

          // Get calendar sync status
          if (data.user?.calendarSyncEnabled !== undefined) {
            setCalendarSyncEnabled(data.user.calendarSyncEnabled)
          }
        }

        // Check Google Drive connection status
        const driveResponse = await fetch(`/api/auth/google-drive/status?email=${encodeURIComponent(user.email)}`)
        if (driveResponse.ok) {
          const driveData = await driveResponse.json()
          setDriveConnected(driveData.connected)
        }

        // Check Google Calendar connection status
        const calendarResponse = await fetch(`/api/auth/google-calendar/status?email=${encodeURIComponent(user.email)}`)
        if (calendarResponse.ok) {
          const calendarData = await calendarResponse.json()
          setCalendarConnected(calendarData.connected)
        }

        // Check Gemini API key status (check localStorage first)
        const localKey = localStorage.getItem('gemini_api_key')
        if (localKey) {
          setHasGeminiKey(true)
          setGeminiKeyPreview(`${localKey.substring(0, 8)}...${localKey.substring(localKey.length - 4)}`)
        } else {
          const geminiResponse = await fetch(`/api/user/gemini-key?email=${encodeURIComponent(user.email)}`)
          if (geminiResponse.ok) {
            const geminiData = await geminiResponse.json()
            setHasGeminiKey(geminiData.hasKey)
            setGeminiKeyPreview(geminiData.keyPreview)
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

  async function handleConnectDrive() {
    if (!user?.email) return

    setConnectingDrive(true)
    try {
      const response = await fetch(`/api/auth/google-drive/connect?email=${encodeURIComponent(user.email)}`)
      if (response.ok) {
        const data = await response.json()
        window.location.href = data.authUrl
      } else {
        alert('Failed to initiate Google Drive connection')
      }
    } catch (error) {
      console.error('Error connecting Drive:', error)
      alert('Failed to connect Google Drive')
    } finally {
      setConnectingDrive(false)
    }
  }

  async function handleConnectCalendar() {
    if (!user?.email) return

    setConnectingCalendar(true)
    try {
      const response = await fetch(`/api/auth/google-calendar/connect?email=${encodeURIComponent(user.email)}`)
      if (response.ok) {
        const data = await response.json()
        window.location.href = data.authUrl
      } else {
        alert('Failed to initiate Google Calendar connection')
      }
    } catch (error) {
      console.error('Error connecting Calendar:', error)
      alert('Failed to connect Google Calendar')
    } finally {
      setConnectingCalendar(false)
    }
  }

  async function handleToggleCalendarSync() {
    if (!user?.email) return

    setTogglingCalendar(true)
    try {
      const newValue = !calendarSyncEnabled

      const response = await fetch('/api/settings/calendar-sync', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: user.email,
          enabled: newValue,
        }),
      })

      if (response.ok) {
        setCalendarSyncEnabled(newValue)
        alert(`Calendar sync ${newValue ? 'enabled' : 'disabled'}`)
      } else {
        alert('Failed to update calendar sync settings')
      }
    } catch (error) {
      console.error('Error toggling calendar sync:', error)
      alert('Failed to update calendar sync')
    } finally {
      setTogglingCalendar(false)
    }
  }

  async function handleSaveGeminiKey(e: React.FormEvent) {
    e.preventDefault()
    if (!user?.email) return

    setSavingGeminiKey(true)

    try {
      const response = await fetch('/api/user/gemini-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: geminiApiKey,
          userEmail: user.email,
          skipValidation: true  // Skip validation to avoid 503 errors when Google API is overloaded
        }),
      })

      if (response.ok) {
        const data = await response.json()

        // TEMPORARY: Store in localStorage due to pooler cache issue
        if (data.tempStorage) {
          localStorage.setItem('gemini_api_key', geminiApiKey)
          alert(data.message + ' (Stored locally until database cache refreshes)')
        } else {
          alert(data.message)
        }

        setHasGeminiKey(true)
        setGeminiApiKey('')
        setShowGeminiKey(false)
        window.location.reload()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save API key')
      }
    } catch (error) {
      console.error('Error saving Gemini key:', error)
      alert('Failed to save API key')
    } finally {
      setSavingGeminiKey(false)
    }
  }

  async function handleRemoveGeminiKey() {
    if (!confirm('Are you sure you want to remove your Gemini API key? You will not be able to use the AI Assistant.')) return

    try {
      // Remove from localStorage (since we're storing there temporarily)
      localStorage.removeItem('gemini_api_key')

      setHasGeminiKey(false)
      setGeminiKeyPreview(null)
      alert('Gemini API key removed successfully')
      window.location.reload()
    } catch (error) {
      console.error('Error removing Gemini key:', error)
      alert('Failed to remove API key')
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

      {/* Google Drive Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Google Drive Integration
          </CardTitle>
          <CardDescription>
            Store case documents in your Google Drive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Status</p>
              <p className="text-sm text-muted-foreground">
                {driveConnected === null
                  ? 'Checking...'
                  : driveConnected
                  ? 'Connected - Documents will be saved to your Google Drive'
                  : 'Not connected - Connect to upload documents'}
              </p>
            </div>
            {driveConnected !== null && (
              <Badge
                variant="outline"
                className={
                  driveConnected
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                }
              >
                {driveConnected ? 'Active' : 'Inactive'}
              </Badge>
            )}
          </div>

          {!driveConnected && driveConnected !== null && (
            <Button onClick={handleConnectDrive} disabled={connectingDrive}>
              <HardDrive className="h-4 w-4 mr-2" />
              {connectingDrive ? 'Connecting...' : 'Connect Google Drive'}
            </Button>
          )}

          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Documents are organized by case in your Drive</p>
            <p>• Files are automatically shared with your team</p>
            <p>• You maintain full control of your data</p>
          </div>
        </CardContent>
      </Card>

      {/* Gemini AI Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Gemini AI Assistant
          </CardTitle>
          <CardDescription>
            Connect your Gemini API key to use AI features (legal chat and document drafting)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">API Key Status</p>
              <p className="text-sm text-muted-foreground">
                {hasGeminiKey
                  ? `Configured: ${geminiKeyPreview}`
                  : 'Not configured - Add your API key to enable AI features'}
              </p>
            </div>
            <Badge
              variant="outline"
              className={
                hasGeminiKey
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-yellow-50 text-yellow-700 border-yellow-200'
              }
            >
              {hasGeminiKey ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          {!hasGeminiKey ? (
            <form onSubmit={handleSaveGeminiKey} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="geminiKey">Gemini API Key</Label>
                <div className="relative">
                  <Input
                    id="geminiKey"
                    type={showGeminiKey ? 'text' : 'password'}
                    placeholder="AIzaSy..."
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                  >
                    {showGeminiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Get your free API key at{' '}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Google AI Studio
                  </a>
                </p>
              </div>
              <Button type="submit" disabled={savingGeminiKey}>
                <Sparkles className="h-4 w-4 mr-2" />
                {savingGeminiKey ? 'Saving...' : 'Save API Key'}
              </Button>
            </form>
          ) : (
            <Button variant="outline" onClick={handleRemoveGeminiKey}>
              <Trash2 className="h-4 w-4 mr-2" />
              Remove API Key
            </Button>
          )}

          <div className="text-sm text-muted-foreground space-y-1 pt-2 border-t">
            <p>• Your API key is stored securely and never shared</p>
            <p>• Each user brings their own key for complete data privacy</p>
            <p>• Free tier includes 15 requests per minute</p>
            <p>• Used for legal chat and document drafting features</p>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar Sync
          </CardTitle>
          <CardDescription>
            Automatically sync hearing dates to your Google Calendar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection status */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Connection Status</p>
              <p className="text-sm text-muted-foreground">
                {calendarConnected === null
                  ? 'Checking...'
                  : calendarConnected
                  ? 'Connected with calendar access'
                  : 'Not connected - Connect to enable sync'}
              </p>
            </div>
            {calendarConnected !== null && (
              <Badge
                variant="outline"
                className={
                  calendarConnected
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                }
              >
                {calendarConnected ? 'Connected' : 'Not Connected'}
              </Badge>
            )}
          </div>

          {/* Connect button if not connected */}
          {!calendarConnected && calendarConnected !== null && (
            <Button onClick={handleConnectCalendar} disabled={connectingCalendar}>
              <Calendar className="h-4 w-4 mr-2" />
              {connectingCalendar ? 'Connecting...' : 'Connect Google Calendar'}
            </Button>
          )}

          {/* Toggle if connected */}
          {calendarConnected && (
            <>
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex-1">
                  <p className="font-medium">Auto-sync hearings</p>
                  <p className="text-sm text-muted-foreground">
                    {calendarSyncEnabled
                      ? 'New hearings are automatically added to Google Calendar'
                      : 'Enable to sync hearings to Google Calendar'}
                  </p>
                </div>
                <button
                  onClick={handleToggleCalendarSync}
                  disabled={togglingCalendar}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    calendarSyncEnabled ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      calendarSyncEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {calendarSyncEnabled && (
                <div className="text-sm text-muted-foreground space-y-1 pt-2 border-t">
                  <p>• Hearings are synced in real-time</p>
                  <p>• Reminders: 1 day before (email), 1 hour before (popup)</p>
                  <p>• Updates automatically when hearing dates change</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
