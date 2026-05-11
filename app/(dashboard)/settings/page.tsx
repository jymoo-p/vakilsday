'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { User, Shield, Calendar, Building2, Plus, Users } from 'lucide-react'

interface Organization {
  id: string
  name: string
  slug: string
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
