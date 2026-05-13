'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Mail, Phone, Briefcase, Calendar, Edit2, Save, X, Upload } from 'lucide-react'
import { format } from 'date-fns'

interface UserProfile {
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
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    bio: '',
    specialization: '',
    yearsOfService: '',
    joiningDate: '',
    otherInfo: '',
  })

  useEffect(() => {
    fetchProfile()
  }, [user])

  async function fetchProfile() {
    if (!user?.email) return

    try {
      const response = await fetch(`/api/users/${encodeURIComponent(user.email)}`)
      if (response.ok) {
        const data = await response.json()
        setProfile(data.user)
        setFormData({
          name: data.user.name || '',
          phone: data.user.phone || '',
          bio: data.user.bio || '',
          specialization: data.user.specialization || '',
          yearsOfService: data.user.yearsOfService?.toString() || '',
          joiningDate: data.user.joiningDate
            ? format(new Date(data.user.joiningDate), 'yyyy-MM-dd')
            : '',
          otherInfo: data.user.otherInfo || '',
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!user?.email) return

    setSaving(true)
    try {
      const response = await fetch(`/api/users/${encodeURIComponent(user.email)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          bio: formData.bio,
          specialization: formData.specialization,
          yearsOfService: formData.yearsOfService ? parseInt(formData.yearsOfService) : null,
          joiningDate: formData.joiningDate ? new Date(formData.joiningDate).toISOString() : null,
          otherInfo: formData.otherInfo,
        }),
      })

      if (response.ok) {
        await fetchProfile()
        setEditing(false)
      } else {
        alert('Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    if (profile) {
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
        specialization: profile.specialization || '',
        yearsOfService: profile.yearsOfService?.toString() || '',
        joiningDate: profile.joiningDate
          ? format(new Date(profile.joiningDate), 'yyyy-MM-dd')
          : '',
        otherInfo: profile.otherInfo || '',
      })
    }
    setEditing(false)
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

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-600">Profile not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl px-4 md:px-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Profile</h1>
          <p className="text-sm md:text-base text-slate-600 mt-1">
            Manage your personal information
          </p>
        </div>
        {!editing ? (
          <Button
            onClick={() => setEditing(true)}
            className="gap-2 bg-slate-900 hover:bg-slate-800"
          >
            <Edit2 className="h-4 w-4" />
            <span className="hidden sm:inline">Edit Profile</span>
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">Cancel</span>
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="gap-2 bg-slate-900 hover:bg-slate-800"
            >
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save'}</span>
            </Button>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6 md:p-8">
          {/* Avatar Section */}
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <div className="flex flex-col items-center md:items-start gap-4">
              <Avatar className="h-24 w-24 md:h-32 md:w-32 ring-4 ring-slate-100">
                <AvatarImage src={profile.image || undefined} alt={profile.name || 'User'} />
                <AvatarFallback className="bg-slate-900 text-white text-2xl md:text-3xl font-bold">
                  {getInitials(profile.name)}
                </AvatarFallback>
              </Avatar>
              {editing && (
                <Button variant="outline" size="sm" className="gap-2 w-full md:w-auto">
                  <Upload className="h-4 w-4" />
                  Upload Photo
                </Button>
              )}
            </div>

            <div className="flex-1 space-y-4">
              {editing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter your full name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Enter your phone number"
                      className="mt-1"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
                    {profile.name || 'No name set'}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <Badge className="bg-slate-900 text-white text-sm px-3 py-1">
                      {profile.role}
                    </Badge>
                    {profile.specialization && (
                      <Badge variant="secondary" className="text-sm px-3 py-1">
                        {profile.specialization}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="flex items-center gap-3 text-slate-600">
                  <Mail className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="font-medium text-slate-900">{profile.email}</p>
                  </div>
                </div>
                {(editing ? formData.phone : profile.phone) && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <Phone className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Phone</p>
                      <p className="font-medium text-slate-900">
                        {editing ? formData.phone : profile.phone}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="space-y-6 pt-6 border-t border-slate-200">
            {/* Bio */}
            <div>
              <Label htmlFor="bio" className="text-base font-semibold text-slate-900 mb-2 block">
                About
              </Label>
              {editing ? (
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  className="mt-1"
                />
              ) : (
                <p className="text-slate-600">
                  {profile.bio || 'No bio added yet'}
                </p>
              )}
            </div>

            {/* Professional Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="specialization" className="text-base font-semibold text-slate-900 mb-2 block">
                  <Briefcase className="h-4 w-4 inline mr-2" />
                  Specialization
                </Label>
                {editing ? (
                  <Input
                    id="specialization"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    placeholder="e.g., Criminal Law, Corporate Law"
                    className="mt-1"
                  />
                ) : (
                  <p className="text-slate-600">
                    {profile.specialization || 'Not specified'}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="yearsOfService" className="text-base font-semibold text-slate-900 mb-2 block">
                  <Calendar className="h-4 w-4 inline mr-2" />
                  Years of Service
                </Label>
                {editing ? (
                  <Input
                    id="yearsOfService"
                    type="number"
                    value={formData.yearsOfService}
                    onChange={(e) => setFormData({ ...formData, yearsOfService: e.target.value })}
                    placeholder="e.g., 5"
                    className="mt-1"
                  />
                ) : (
                  <p className="text-slate-600">
                    {profile.yearsOfService ? `${profile.yearsOfService} years` : 'Not specified'}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="joiningDate" className="text-base font-semibold text-slate-900 mb-2 block">
                  Joining Date
                </Label>
                {editing ? (
                  <Input
                    id="joiningDate"
                    type="date"
                    value={formData.joiningDate}
                    onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-slate-600">
                    {profile.joiningDate
                      ? format(new Date(profile.joiningDate), 'MMMM d, yyyy')
                      : 'Not specified'}
                  </p>
                )}
              </div>

              <div>
                <Label className="text-base font-semibold text-slate-900 mb-2 block">
                  Member Since
                </Label>
                <p className="text-slate-600">
                  {format(new Date(profile.createdAt), 'MMMM d, yyyy')}
                </p>
              </div>
            </div>

            {/* Other Info */}
            <div>
              <Label htmlFor="otherInfo" className="text-base font-semibold text-slate-900 mb-2 block">
                Other Information
              </Label>
              {editing ? (
                <Textarea
                  id="otherInfo"
                  value={formData.otherInfo}
                  onChange={(e) => setFormData({ ...formData, otherInfo: e.target.value })}
                  placeholder="Additional information..."
                  rows={3}
                  className="mt-1"
                />
              ) : (
                <p className="text-slate-600">
                  {profile.otherInfo || 'No additional information'}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
