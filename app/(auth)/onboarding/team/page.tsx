'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Scale, Users, Plus, Trash2, ArrowRight, Mail, User, Phone } from 'lucide-react'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface TeamMember {
  id: string
  name: string
  email: string
  phone: string
  role: string
}

export default function OnboardingTeamPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'ASSOCIATE',
  })
  const [loading, setLoading] = useState(false)

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault()

    if (!user?.email) {
      toast.error('User not authenticated')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail: user.email,
          ...formData,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setMembers([...members, { ...data.member, ...formData }])
        setFormData({ name: '', email: '', phone: '', role: 'ASSOCIATE' })
        setShowForm(false)
        toast.success('Team member added')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to add member')
      }
    } catch (error) {
      console.error('Error adding member:', error)
      toast.error('Failed to add member')
    } finally {
      setLoading(false)
    }
  }

  function handleRemoveMember(index: number) {
    setMembers(members.filter((_, i) => i !== index))
  }

  function handleProceed() {
    router.push('/onboarding/courts')
  }

  function handleSkip() {
    router.push('/onboarding/courts')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="max-w-3xl w-full shadow-xl border-0">
        <CardContent className="p-8 md:p-12">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 shadow-lg">
              <Scale className="h-8 w-8 text-white" />
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              Assemble Your Team!
            </h1>
            <p className="text-lg text-slate-600">
              Add lawyers and clerks to your practice
            </p>
          </div>

          {/* Team Members List */}
          {members.length > 0 && (
            <div className="space-y-3 mb-6">
              {members.map((member, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-semibold text-slate-900">{member.name}</p>
                      <Badge className="bg-slate-900 text-white text-xs">
                        {member.role}
                      </Badge>
                    </div>
                    <div className="flex flex-col gap-1 text-sm text-slate-600">
                      <span>{member.email}</span>
                      {member.phone && <span>{member.phone}</span>}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveMember(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add Member Form */}
          {showForm ? (
            <form onSubmit={handleAddMember} className="space-y-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Full name"
                      required
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@example.com"
                      required
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="ASSOCIATE">Associate</SelectItem>
                      <SelectItem value="CLERK">Clerk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={loading}
                  className="gap-2 bg-slate-900 hover:bg-slate-800"
                >
                  <Plus className="h-4 w-4" />
                  {loading ? 'Adding...' : 'Add Member'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setFormData({ name: '', email: '', phone: '', role: 'ASSOCIATE' })
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <Button
              onClick={() => setShowForm(true)}
              variant="outline"
              className="w-full gap-2 mb-6 border-dashed border-2 h-12"
            >
              <Plus className="h-5 w-5" />
              Add Team Member
            </Button>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleProceed}
              className="flex-1 gap-2 bg-slate-900 hover:bg-slate-800 text-base py-6 h-auto"
              size="lg"
            >
              {members.length > 0 ? 'Proceed' : 'Skip for Now'}
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>

          <p className="text-sm text-slate-500 text-center mt-4">
            You can always add team members later
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
