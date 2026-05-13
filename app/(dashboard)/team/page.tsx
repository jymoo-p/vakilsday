'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Plus, Users, Mail, Phone, Shield, Briefcase, Calendar, X } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  image: string | null
  phone: string | null
  role: string
  specialization: string | null
  yearsOfService: number | null
  joiningDate: string | null
  customRole?: {
    id: string
    name: string
  } | null
}

interface CustomRole {
  id: string
  name: string
}

export default function TeamPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>('')
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    roleSelection: 'ASSOCIATE', // Can be ADMIN/ASSOCIATE/CLERK or a customRoleId
  })

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

        if (userData.user?.organizationId) {
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

    if (!user?.email) {
      toast.error('User not authenticated')
      return
    }

    setSubmitting(true)

    try {
      // Determine if selection is a base role or custom role
      const isCustomRole = !['ADMIN', 'ASSOCIATE', 'CLERK'].includes(formData.roleSelection)

      const payload: any = {
        adminEmail: user.email,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: isCustomRole ? 'ASSOCIATE' : formData.roleSelection, // Default to ASSOCIATE for custom roles
      }

      if (isCustomRole) {
        payload.customRoleId = formData.roleSelection
      }

      const response = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Sustained! Team member "${result.member.name}" was added`)
        setShowAddDialog(false)
        setFormData({ name: '', email: '', phone: '', roleSelection: 'ASSOCIATE' })
        fetchData() // Refresh the list
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to add member')
      }
    } catch (error) {
      console.error('Error adding member:', error)
      toast.error('Failed to add member')
    } finally {
      setSubmitting(false)
    }
  }

  const getInitials = (name: string | null) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-600">Loading team...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl px-4 md:px-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">My Team</h1>
          <p className="text-sm md:text-base text-slate-600 mt-1">
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </p>
        </div>
        {userRole === 'ADMIN' && (
          <Button
            onClick={() => setShowAddDialog(true)}
            className="gap-2 bg-slate-900 hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Member</span>
          </Button>
        )}
      </div>

      {members.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="pt-8 pb-8 md:pt-12 md:pb-12 text-center">
            <div className="p-3 md:p-4 bg-slate-100 rounded-full w-fit mx-auto mb-3 md:mb-4">
              <Users className="h-8 w-8 md:h-12 md:w-12 text-slate-400" />
            </div>
            <p className="text-base md:text-lg font-medium text-slate-900">No team members yet</p>
            <p className="text-sm md:text-base text-slate-600 mt-1">
              Add lawyers and clerks to start collaborating
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => (
            <Link key={member.id} href={`/team/${member.id}`}>
              <Card className="border-l-4 border-l-slate-900 hover:shadow-md transition-all cursor-pointer group h-full">
                <CardContent className="p-3 md:p-4">
                  {/* Avatar & Name */}
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className="h-16 w-16 ring-2 ring-slate-100">
                      <AvatarImage src={member.image || undefined} alt={member.name || 'User'} />
                      <AvatarFallback className="bg-slate-900 text-white font-semibold text-lg">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-slate-900 group-hover:text-slate-700 truncate">
                        {member.name || 'No name set'}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge className="bg-slate-900 text-white text-xs px-2 py-0.5">
                          {member.role}
                        </Badge>
                        {member.customRole && (
                          <Badge variant="secondary" className="text-xs px-2 py-0.5">
                            {member.customRole.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </div>
                    {member.phone && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                        <span>{member.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Professional Info */}
                  {(member.specialization || member.yearsOfService || member.joiningDate) && (
                    <div className="pt-4 border-t border-slate-100 space-y-2 text-sm">
                      {member.specialization && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Briefcase className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{member.specialization}</span>
                        </div>
                      )}
                      {member.yearsOfService && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                          <span>{member.yearsOfService} years of service</span>
                        </div>
                      )}
                      {member.joiningDate && !member.yearsOfService && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                          <span>Since {format(new Date(member.joiningDate), 'MMM yyyy')}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Add Member Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Invite a lawyer or clerk to join your team
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddMember} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={formData.roleSelection}
                onValueChange={(value) => {
                  if (value) setFormData({ ...formData, roleSelection: value })
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="ASSOCIATE">Associate</SelectItem>
                  <SelectItem value="CLERK">Clerk</SelectItem>
                  {customRoles.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 border-t mt-1">
                        Custom Roles
                      </div>
                      {customRoles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {formData.roleSelection && !['ADMIN', 'ASSOCIATE', 'CLERK'].includes(formData.roleSelection)
                  ? 'Custom role with specific permissions'
                  : 'Base role with system-defined permissions'}
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false)
                  setFormData({ name: '', email: '', phone: '', roleSelection: 'ASSOCIATE' })
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-slate-900 hover:bg-slate-800"
              >
                {submitting ? 'Adding...' : 'Add Member'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
