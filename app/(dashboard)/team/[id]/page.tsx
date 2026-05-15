'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowLeft, Mail, Phone, Briefcase, Calendar, FileText, LogOut, UserMinus } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface TeamMember {
  id: string
  name: string | null
  email: string
  image: string | null
  phone: string | null
  role: string
  bio: string | null
  specialization: string | null
  yearsOfService: number | null
  joiningDate: string | null
  otherInfo: string | null
  createdAt: string
  customRole?: {
    id: string
    name: string
  } | null
}

export default function TeamMemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const { user } = useAuth()
  const router = useRouter()
  const [member, setMember] = useState<TeamMember | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<string>('')
  const [caseCount, setCaseCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [isRemoving, setIsRemoving] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    fetchMember()
  }, [user, resolvedParams.id])

  async function fetchMember() {
    if (!user?.email) return

    try {
      // Fetch current user role
      const userResponse = await fetch(`/api/users/${encodeURIComponent(user.email)}`)
      if (userResponse.ok) {
        const userData = await userResponse.json()
        setCurrentUserRole(userData.user?.role || '')
      }

      // Fetch member details
      const response = await fetch(`/api/team/${resolvedParams.id}`)
      if (response.ok) {
        const data = await response.json()
        setMember(data.member)

        // Fetch case count
        const caseResponse = await fetch(`/api/team/${resolvedParams.id}/cases`)
        if (caseResponse.ok) {
          const caseData = await caseResponse.json()
          setCaseCount(caseData.caseCount || 0)
        }
      } else {
        router.push('/team')
      }
    } catch (error) {
      console.error('Error fetching member:', error)
      router.push('/team')
    } finally {
      setLoading(false)
    }
  }

  async function handleExitOrganization() {
    if (!user?.email) return

    setIsExiting(true)
    try {
      const response = await fetch('/api/organizations/leave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: user.email,
        }),
      })

      if (response.ok) {
        toast.success('You have left the organization')
        router.push('/signin')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to leave organization')
      }
    } catch (error) {
      console.error('Error leaving organization:', error)
      toast.error('Failed to leave organization')
    } finally {
      setIsExiting(false)
    }
  }

  async function handleRemoveMember() {
    if (!member || !user?.email) return

    setIsRemoving(true)
    try {
      const response = await fetch('/api/organizations/remove-member', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: member.id,
          adminEmail: user.email,
        }),
      })

      if (response.ok) {
        toast.success(`${member.name || member.email} has been removed from the organization`)
        router.push('/team')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to remove member')
      }
    } catch (error) {
      console.error('Error removing member:', error)
      toast.error('Failed to remove member')
    } finally {
      setIsRemoving(false)
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
        <p className="text-slate-600">Loading profile...</p>
      </div>
    )
  }

  if (!member) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-600">Member not found</p>
      </div>
    )
  }

  const isViewingOwnProfile = user?.email === member.email

  return (
    <div className="space-y-6 max-w-4xl px-4 md:px-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/team">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Team Member Profile</h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Exit Organization - shown to current user viewing their own profile */}
          {isViewingOwnProfile && (
            <AlertDialog>
              <AlertDialogTrigger className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium border border-slate-300 rounded-md text-slate-700 bg-white hover:bg-slate-50 transition-colors">
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline">Exit Organization</span>
                <span className="md:hidden">Exit</span>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-white">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl font-bold text-slate-900">Exit Organization?</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-600 text-base pt-2">
                    Are you sure you want to leave this organization? You will lose access to all cases, documents, and team resources.
                    {currentUserRole === 'ADMIN' && (
                      <span className="block mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-sm font-medium">
                        ⚠️ Note: You cannot leave if you are the only admin. Please assign another admin first.
                      </span>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2 sm:gap-2">
                  <AlertDialogCancel className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleExitOrganization}
                    disabled={isExiting}
                    className="bg-slate-900 hover:bg-slate-800 text-white"
                  >
                    {isExiting ? 'Leaving...' : 'Yes, Exit'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* Remove Member - shown to admins viewing other profiles */}
          {!isViewingOwnProfile && currentUserRole === 'ADMIN' && (
            <AlertDialog>
              <AlertDialogTrigger className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium border border-slate-300 rounded-md text-slate-700 bg-white hover:bg-slate-50 transition-colors">
                <UserMinus className="h-4 w-4" />
                <span className="hidden md:inline">Remove Member</span>
                <span className="md:hidden">Remove</span>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-white">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl font-bold text-slate-900">Remove Team Member?</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-600 text-base pt-2 space-y-3">
                    <p>
                      Are you sure you want to remove <strong className="text-slate-900">{member.name || member.email}</strong> from the organization?
                      They will lose access to all cases, documents, and team resources.
                    </p>
                    {caseCount > 0 && (
                      <p className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-sm font-medium">
                        📋 <strong>{member.name || member.email}</strong> is assigned to <strong>{caseCount}</strong> {caseCount === 1 ? 'case' : 'cases'}. Removing user will also unassign them from all cases.
                      </p>
                    )}
                    {member.role === 'ADMIN' && (
                      <p className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-sm font-medium">
                        ⚠️ Note: You cannot remove the only admin. Assign another admin first.
                      </p>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2 sm:gap-2">
                  <AlertDialogCancel className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleRemoveMember}
                    disabled={isRemoving}
                    className="bg-slate-900 hover:bg-slate-800 text-white"
                  >
                    {isRemoving ? 'Removing...' : 'Yes, Remove'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6 md:p-8">
          {/* Avatar Section */}
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <div className="flex flex-col items-center md:items-start">
              <Avatar className="h-24 w-24 md:h-32 md:w-32 ring-4 ring-slate-100">
                <AvatarImage src={member.image || undefined} alt={member.name || 'User'} />
                <AvatarFallback className="bg-slate-900 text-white text-2xl md:text-3xl font-bold">
                  {getInitials(member.name)}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
                  {member.name || 'No name set'}
                </h2>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <Badge className="bg-slate-900 text-white text-sm px-3 py-1">
                    {member.role}
                  </Badge>
                  {member.customRole && (
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      {member.customRole.name}
                    </Badge>
                  )}
                  {member.specialization && (
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      {member.specialization}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 text-slate-600">
                  <Mail className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="font-medium text-slate-900">{member.email}</p>
                  </div>
                </div>
                {member.phone && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <Phone className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Phone</p>
                      <p className="font-medium text-slate-900">{member.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="space-y-6 pt-6 border-t border-slate-200">
            {/* Bio */}
            {member.bio && (
              <div>
                <h3 className="text-base font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  About
                </h3>
                <p className="text-slate-600">{member.bio}</p>
              </div>
            )}

            {/* Professional Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {member.specialization && (
                <div>
                  <h3 className="text-base font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Specialization
                  </h3>
                  <p className="text-slate-600">{member.specialization}</p>
                </div>
              )}

              {member.yearsOfService && (
                <div>
                  <h3 className="text-base font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Years of Service
                  </h3>
                  <p className="text-slate-600">{member.yearsOfService} years</p>
                </div>
              )}

              {member.joiningDate && (
                <div>
                  <h3 className="text-base font-semibold text-slate-900 mb-2">
                    Joining Date
                  </h3>
                  <p className="text-slate-600">
                    {format(new Date(member.joiningDate), 'MMMM d, yyyy')}
                  </p>
                </div>
              )}

              <div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">
                  Member Since
                </h3>
                <p className="text-slate-600">
                  {format(new Date(member.createdAt), 'MMMM d, yyyy')}
                </p>
              </div>
            </div>

            {/* Other Info */}
            {member.otherInfo && (
              <div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">
                  Other Information
                </h3>
                <p className="text-slate-600 whitespace-pre-wrap">{member.otherInfo}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
