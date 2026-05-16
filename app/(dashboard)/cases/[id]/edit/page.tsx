'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, Loader2, Plus, X } from 'lucide-react'
import Link from 'next/link'
import { Alert } from '@/components/ui/alert'
import { toast } from 'sonner'

const caseSchema = z.object({
  caseNumber: z.string().min(1, 'Case number is required'),
  year: z.string().optional(),
  appearingFor: z.enum(['PETITIONER', 'RESPONDENT']),
  clientId: z.string().optional(),
  otherParties: z.string().optional(),
  opponentMainParty: z.string().min(1, 'Opponent main party is required'),
  opponentOtherParties: z.string().optional(),
  courtId: z.string().optional(),
  courtNumber: z.string().optional(),
  caseTypeId: z.string().optional(),
  judgeName: z.string().optional(),
  opposingCounselName: z.string().optional(),
  opposingCounselPhone: z.string().optional(),
  status: z.enum(['ACTIVE', 'PENDING', 'CLOSED', 'ARCHIVED']),
  filingDate: z.string().min(1, 'Filing date is required'),
  nextHearingDate: z.string().optional(),
  nextHearingTime: z.string().optional(),
  synopsis: z.string().optional(),
  assignedUserIds: z.array(z.string()).optional(),
})

type CaseFormData = z.infer<typeof caseSchema>

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
}

export default function EditCasePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [courts, setCourts] = useState<any[]>([])
  const [caseTypes, setCaseTypes] = useState<any[]>([])
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([])
  const [clientSearchQuery, setClientSearchQuery] = useState('')
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [currentClientName, setCurrentClientName] = useState<string>('')
  const [showClientChangeDialog, setShowClientChangeDialog] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CaseFormData>({
    resolver: zodResolver(caseSchema),
  })

  const watchStatus = watch('status')
  const watchAppearingFor = watch('appearingFor')

  useEffect(() => {
    if (user?.email) {
      fetchData()
    }
  }, [user, params.id])

  async function fetchData() {
    try {
      setLoading(true)

      // Fetch case details
      const caseRes = await fetch(`/api/cases/${params.id}?email=${encodeURIComponent(user!.email!)}`)
      if (!caseRes.ok) throw new Error('Failed to fetch case')
      const caseData = await caseRes.json()

      // Populate form
      const c = caseData.case
      setValue('caseNumber', c.caseNumber)
      setValue('year', c.year?.toString() || '')
      setValue('appearingFor', c.appearingFor)
      setValue('clientId', c.clientId || '')
      // Set current client name
      if (c.client) {
        const clientFullName = c.client.lastName
          ? `${c.client.firstName} ${c.client.lastName}`
          : c.client.firstName
        setCurrentClientName(clientFullName)
        setClientSearchQuery(clientFullName)
      }
      setValue('otherParties', c.otherParties?.join(', ') || '')
      setValue('opponentMainParty', c.opponentMainParty)
      setValue('opponentOtherParties', c.opponentOtherParties?.join(', ') || '')
      setValue('courtId', c.courtId || '')
      setValue('courtNumber', c.courtNumber || '')
      setValue('caseTypeId', c.caseTypeId || '')
      setValue('judgeName', c.judgeName || '')
      setValue('opposingCounselName', c.opposingCounselName || '')
      setValue('opposingCounselPhone', c.opposingCounselPhone || '')
      setValue('status', c.status)
      setValue('filingDate', c.filingDate ? c.filingDate.split('T')[0] : '')
      setValue('nextHearingDate', c.nextHearingDate ? c.nextHearingDate.split('T')[0] : '')
      // Extract time from nextHearingDate if exists, otherwise default to 11:00
      if (c.nextHearingDate) {
        const date = new Date(c.nextHearingDate)
        const hours = date.getHours().toString().padStart(2, '0')
        const minutes = date.getMinutes().toString().padStart(2, '0')
        setValue('nextHearingTime', `${hours}:${minutes}`)
      } else {
        setValue('nextHearingTime', '11:00')
      }
      setValue('synopsis', c.synopsis || '')

      // Set assigned users
      const assignedIds = c.assignments?.map((a: any) => a.user.id) || []
      setSelectedAssignees(assignedIds)

      // Fetch team members
      const teamRes = await fetch(`/api/team?email=${encodeURIComponent(user!.email!)}`)
      if (teamRes.ok) {
        const teamData = await teamRes.json()
        setTeamMembers(teamData.users || [])
      }

      // Fetch clients
      const clientsRes = await fetch(`/api/clients?email=${encodeURIComponent(user!.email!)}`)
      if (clientsRes.ok) {
        const clientsData = await clientsRes.json()
        setClients(clientsData.clients || [])
      }

      // Fetch courts
      const courtsRes = await fetch(`/api/courts?email=${encodeURIComponent(user!.email!)}`)
      if (courtsRes.ok) {
        const courtsData = await courtsRes.json()
        setCourts(courtsData.courts || [])
      }

      // Fetch case types
      const typesRes = await fetch(`/api/case-types?email=${encodeURIComponent(user!.email!)}`)
      if (typesRes.ok) {
        const typesData = await typesRes.json()
        setCaseTypes(typesData.caseTypes || [])
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load case')
    } finally {
      setLoading(false)
    }
  }

  async function onSubmit(data: CaseFormData) {
    setSubmitting(true)
    setError(null)

    try {
      // Combine date and time for nextHearingDate if both exist
      let nextHearingDateTime = null
      if (data.nextHearingDate && data.nextHearingTime) {
        const [hours, minutes] = data.nextHearingTime.split(':').map(Number)
        const dateTime = new Date(data.nextHearingDate)
        dateTime.setHours(hours, minutes, 0, 0)
        nextHearingDateTime = dateTime.toISOString()
      } else if (data.nextHearingDate) {
        nextHearingDateTime = new Date(data.nextHearingDate).toISOString()
      }

      const payload = {
        ...data,
        userEmail: user!.email,
        otherParties: data.otherParties ? data.otherParties.split(',').map(s => s.trim()).filter(Boolean) : [],
        opponentOtherParties: data.opponentOtherParties ? data.opponentOtherParties.split(',').map(s => s.trim()).filter(Boolean) : [],
        year: data.year ? parseInt(data.year) : null,
        assignedUserIds: selectedAssignees,
        nextHearingDate: nextHearingDateTime,
      }

      const response = await fetch(`/api/cases/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update case')
      }

      toast.success('Case updated successfully')
      router.push(`/cases/${params.id}`)
    } catch (err) {
      toast.error('Something went wrong. Try again.')
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  function toggleAssignee(userId: string) {
    setSelectedAssignees(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/cases/${params.id}`}>
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </Link>
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-slate-900">Edit Case</h2>
          <p className="text-lg text-slate-600">Update case details and assignments</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="text-base">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="caseNumber">Case Number *</Label>
                <Input id="caseNumber" {...register('caseNumber')} />
                {errors.caseNumber && (
                  <p className="text-sm text-destructive">{errors.caseNumber.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input id="year" type="number" {...register('year')} />
              </div>

              <div className="space-y-2">
                <Label>Appearing For <span className="text-red-500">*</span></Label>
                <div className="flex gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="PETITIONER"
                      checked={watchAppearingFor === 'PETITIONER'}
                      onChange={(e) => setValue('appearingFor', e.target.value as any)}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm">Petitioner</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="RESPONDENT"
                      checked={watchAppearingFor === 'RESPONDENT'}
                      onChange={(e) => setValue('appearingFor', e.target.value as any)}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm">Respondent</span>
                  </label>
                </div>
                {errors.appearingFor && (
                  <p className="text-sm text-red-500">{errors.appearingFor.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={watchStatus}
                  onValueChange={(value) => setValue('status', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Client</Label>
              {showClientChangeDialog ? (
                <div className="space-y-2">
                  <Select
                    value={watch('clientId') || undefined}
                    onValueChange={(value) => {
                      setValue('clientId', value || undefined)
                      const selectedClient = clients.find(c => c.id === value)
                      if (selectedClient) {
                        const fullName = selectedClient.lastName
                          ? `${selectedClient.firstName} ${selectedClient.lastName}`
                          : selectedClient.firstName
                        setCurrentClientName(fullName)
                        setClientSearchQuery(fullName)
                      }
                      setShowClientChangeDialog(false)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.firstName} {client.lastName || ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowClientChangeDialog(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 border border-slate-300 rounded-md bg-slate-50">
                    <span className="text-sm text-slate-700">
                      {currentClientName || 'No client assigned'}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowClientChangeDialog(true)}
                  >
                    Change Client
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="otherParties">Other Parties (comma-separated)</Label>
              <Input
                id="otherParties"
                placeholder="e.g., Party 2, Party 3"
                {...register('otherParties')}
              />
              <p className="text-xs text-slate-500">
                Additional parties on your client's side (if any)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="opponentMainParty">Opponent Main Party *</Label>
              <Input id="opponentMainParty" {...register('opponentMainParty')} />
              {errors.opponentMainParty && (
                <p className="text-sm text-destructive">{errors.opponentMainParty.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="opponentOtherParties">Additional Opponent Parties (comma-separated)</Label>
              <Input
                id="opponentOtherParties"
                placeholder="e.g., Opponent 2, Opponent 3"
                {...register('opponentOtherParties')}
              />
              <p className="text-xs text-slate-500">
                Additional parties on the opponent's side (if any)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="filingDate">Filing Date *</Label>
                <Input id="filingDate" type="date" {...register('filingDate')} />
                {errors.filingDate && (
                  <p className="text-sm text-destructive">{errors.filingDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nextHearingDate">Next Hearing Date</Label>
                <Input id="nextHearingDate" type="date" {...register('nextHearingDate')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nextHearingTime">Time</Label>
                <Input
                  id="nextHearingTime"
                  type="time"
                  defaultValue="11:00"
                  {...register('nextHearingTime')}
                />
              </div>
            </div>

            <div className="space-y-2" id="synopsis">
              <Label htmlFor="synopsis">Synopsis</Label>
              <RichTextEditor
                content={watch('synopsis') || ''}
                onChange={(html) => setValue('synopsis', html)}
                placeholder="Provide a brief summary of the case..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Court Details */}
        <Card id="court-details">
          <CardHeader>
            <CardTitle>Court Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="courtId">Court</Label>
                <Select
                  value={watch('courtId')}
                  onValueChange={(value) => setValue('courtId', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select court">
                      {watch('courtId')
                        ? courts.find(c => c.id === watch('courtId'))?.name || 'Select court'
                        : 'Select court'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {courts.map((court) => (
                      <SelectItem key={court.id} value={court.id}>
                        {court.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="courtNumber">Court Number</Label>
                <Input id="courtNumber" {...register('courtNumber')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="caseTypeId">Case Type</Label>
                <Select
                  value={watch('caseTypeId')}
                  onValueChange={(value) => setValue('caseTypeId', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type">
                      {watch('caseTypeId')
                        ? caseTypes.find(t => t.id === watch('caseTypeId'))?.name || 'Select type'
                        : 'Select type'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {caseTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="judgeName">Judge Name</Label>
                <Input id="judgeName" {...register('judgeName')} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Opposing Counsel */}
        <Card>
          <CardHeader>
            <CardTitle>Opposing Counsel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="opposingCounselName">Name</Label>
                <Input id="opposingCounselName" {...register('opposingCounselName')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="opposingCounselPhone">Phone</Label>
                <Input id="opposingCounselPhone" {...register('opposingCounselPhone')} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Assignment */}
        <Card>
          <CardHeader>
            <CardTitle>Assign Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            {teamMembers.length === 0 ? (
              <p className="text-slate-500">No team members available</p>
            ) : (
              <div className="space-y-2">
                {teamMembers.map((member) => (
                  <label
                    key={member.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-slate-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAssignees.includes(member.id)}
                      onChange={() => toggleAssignee(member.id)}
                      className="h-4 w-4"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-slate-500">{member.email} • {member.role}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/cases/${params.id}`)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
