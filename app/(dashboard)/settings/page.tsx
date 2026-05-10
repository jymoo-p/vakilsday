import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Shield, Calendar } from 'lucide-react'

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

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
              <p className="font-medium">{session.user.name || 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{session.user.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <Badge>{session.user.role}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permissions
          </CardTitle>
          <CardDescription>Your access level and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {session.user.role === 'ADMIN' && (
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
                  <span className="text-sm">Manage users</span>
                  <Badge variant="secondary">Granted</Badge>
                </div>
              </>
            )}
            {session.user.role === 'ASSOCIATE' && (
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
                  <span className="text-sm">Add private notes</span>
                  <Badge variant="secondary">Granted</Badge>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">Legal research</span>
                  <Badge variant="secondary">Granted</Badge>
                </div>
              </>
            )}
            {session.user.role === 'CLERK' && (
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
                  <span className="text-sm">Upload documents</span>
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
    </div>
  )
}
