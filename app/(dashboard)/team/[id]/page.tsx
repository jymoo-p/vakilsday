'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowLeft, Mail, Phone, Briefcase, Calendar, FileText } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMember()
  }, [user, resolvedParams.id])

  async function fetchMember() {
    if (!user?.email) return

    try {
      const response = await fetch(`/api/team/${resolvedParams.id}`)
      if (response.ok) {
        const data = await response.json()
        setMember(data.member)
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

  return (
    <div className="space-y-6 max-w-4xl px-4 md:px-0">
      {/* Header */}
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
