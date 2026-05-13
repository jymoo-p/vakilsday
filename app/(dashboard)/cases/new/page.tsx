'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Plus, X } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const caseSchema = z.object({
  caseNumber: z.string().min(1, 'Case number is required'),
  year: z.string().optional(),
  appearingFor: z.enum(['PETITIONER', 'RESPONDENT'], {
    message: 'Appearing for is required',
  }),
  clientId: z.string().optional(),
  courtId: z.string().optional(),
  courtNumber: z.string().optional(),
  caseTypeId: z.string().optional(),
  opponentMainParty: z.string().min(1, 'Main opponent party is required'),
  filingDate: z.string().min(1, 'Filing date is required'),
  nextHearingDate: z.string().optional(),
  synopsis: z.string().optional(),
})

type CaseFormData = z.infer<typeof caseSchema>

interface Client {
  id: string
  firstName: string
  lastName: string
}

interface Court {
  id: string
  name: string
}

interface CaseType {
  id: string
  name: string
}

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
}

export default function NewCasePageNew() {
  const router = useRouter()
  const { user } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Dropdowns data
  const [clients, setClients] = useState<Client[]>([])
  const [courts, setCourts] = useState<Court[]>([])
  const [caseTypes, setCaseTypes] = useState<CaseType[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([])

  // Dynamic party lists
  const [otherParties, setOtherParties] = useState<string[]>([])
  const [otherPartyInput, setOtherPartyInput] = useState('')
  const [opponentOtherParties, setOpponentOtherParties] = useState<string[]>([])
  const [opponentOtherPartyInput, setOpponentOtherPartyInput] = useState('')

  // Form selections
  const [selectedAppearingFor, setSelectedAppearingFor] = useState<string>('')
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [selectedCourt, setSelectedCourt] = useState<string>('')
  const [selectedCaseType, setSelectedCaseType] = useState<string>('')
  const [clientSearchQuery, setClientSearchQuery] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CaseFormData>({
    resolver: zodResolver(caseSchema),
  })

  useEffect(() => {
    fetchDropdownData()
  }, [user])

  // Restore form state if returning from client creation
  useEffect(() => {
    const savedState = localStorage.getItem('newCaseFormState')
    if (savedState) {
      try {
        const state = JSON.parse(savedState)
        // Restore form values
        if (state.caseNumber) setValue('caseNumber', state.caseNumber)
        if (state.year) setValue('year', state.year)
        if (state.appearingFor) {
          setSelectedAppearingFor(state.appearingFor)
          setValue('appearingFor', state.appearingFor)
        }
        if (state.clientId) {
          setSelectedClient(state.clientId)
          setValue('clientId', state.clientId)
          if (state.clientName) {
            setClientSearchQuery(state.clientName)
          }
        }
        if (state.courtId) {
          setSelectedCourt(state.courtId)
          setValue('courtId', state.courtId)
        }
        if (state.courtNumber) setValue('courtNumber', state.courtNumber)
        if (state.caseTypeId) {
          setSelectedCaseType(state.caseTypeId)
          setValue('caseTypeId', state.caseTypeId)
        }
        if (state.opponentMainParty) setValue('opponentMainParty', state.opponentMainParty)
        if (state.filingDate) setValue('filingDate', state.filingDate)
        if (state.nextHearingDate) setValue('nextHearingDate', state.nextHearingDate)
        if (state.synopsis) setValue('synopsis', state.synopsis)
        if (state.otherParties) setOtherParties(state.otherParties)
        if (state.opponentOtherParties) setOpponentOtherParties(state.opponentOtherParties)
        if (state.selectedAssignees) setSelectedAssignees(state.selectedAssignees)

        // Clear saved state
        localStorage.removeItem('newCaseFormState')
      } catch (err) {
        console.error('Failed to restore form state:', err)
      }
    }
  }, [setValue])

  async function fetchDropdownData() {
    if (!user?.email) return

    try {
      // Fetch team members
      const teamRes = await fetch(`/api/team?email=${encodeURIComponent(user.email)}`)
      if (teamRes.ok) {
        const teamData = await teamRes.json()
        setTeamMembers(teamData.users || [])
      }

      // Fetch clients
      const clientsRes = await fetch(`/api/clients?email=${encodeURIComponent(user.email)}`)
      if (clientsRes.ok) {
        const data = await clientsRes.json()
        setClients(data.clients || [])
      }

      // Fetch courts
      const courtsRes = await fetch(`/api/courts?email=${encodeURIComponent(user.email)}`)
      if (courtsRes.ok) {
        const data = await courtsRes.json()
        setCourts(data.courts || [])
      }

      // Fetch case types
      const caseTypesRes = await fetch(`/api/case-types?email=${encodeURIComponent(user.email)}`)
      if (caseTypesRes.ok) {
        const data = await caseTypesRes.json()
        setCaseTypes(data.caseTypes || [])
      }
    } catch (err) {
      console.error('Error fetching dropdown data:', err)
    }
  }

  function addOtherParty() {
    if (otherPartyInput.trim()) {
      setOtherParties([...otherParties, otherPartyInput.trim()])
      setOtherPartyInput('')
    }
  }

  function removeOtherParty(index: number) {
    setOtherParties(otherParties.filter((_, i) => i !== index))
  }

  function addOpponentOtherParty() {
    if (opponentOtherPartyInput.trim()) {
      setOpponentOtherParties([...opponentOtherParties, opponentOtherPartyInput.trim()])
      setOpponentOtherPartyInput('')
    }
  }

  function removeOpponentOtherParty(index: number) {
    setOpponentOtherParties(opponentOtherParties.filter((_, i) => i !== index))
  }

  function toggleAssignee(userId: string) {
    setSelectedAssignees(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const onSubmit = async (data: CaseFormData) => {
    setError(null)
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          userEmail: user?.email,
          year: data.year ? parseInt(data.year) : null,
          clientId: data.clientId || null,
          courtId: data.courtId || null,
          caseTypeId: data.caseTypeId || null,
          otherParties,
          opponentOtherParties,
          assignedUserIds: selectedAssignees,
          filingDate: new Date(data.filingDate).toISOString(),
          nextHearingDate: data.nextHearingDate
            ? new Date(data.nextHearingDate).toISOString()
            : null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create case')
      }

      const result = await response.json()
      router.push(`/cases/${result.case.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsSubmitting(false)
    }
  }

  const filteredClients = clients.filter(client =>
    `${client.firstName} ${client.lastName}`.toLowerCase().includes(clientSearchQuery.toLowerCase())
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Button
          variant="ghost"
          onClick={() => router.push('/cases')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Cases
        </Button>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">New Case</h1>
          <p className="text-lg text-slate-600">
            Create a new case record in the system
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Core case details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="caseNumber">
                  Case Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="caseNumber"
                  placeholder="e.g., CRL/123/2024 or 'Unassigned'"
                  {...register('caseNumber')}
                />
                {errors.caseNumber && (
                  <p className="text-sm text-red-500">{errors.caseNumber.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  placeholder="2024"
                  {...register('year')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="appearingFor">
                Appearing For <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedAppearingFor}
                onValueChange={(value) => {
                  if (value) {
                    setSelectedAppearingFor(value)
                    setValue('appearingFor', value as 'PETITIONER' | 'RESPONDENT')
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select appearing for" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PETITIONER">Petitioner</SelectItem>
                  <SelectItem value="RESPONDENT">Respondent</SelectItem>
                </SelectContent>
              </Select>
              {errors.appearingFor && (
                <p className="text-sm text-red-500">{errors.appearingFor.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Client & Parties */}
        <Card>
          <CardHeader>
            <CardTitle>Client & Parties</CardTitle>
            <CardDescription>Select client or add party names manually</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="clientSearch">Client (Start typing to search)</Label>
              <Input
                id="clientSearch"
                placeholder="Search clients..."
                value={clientSearchQuery}
                onChange={(e) => setClientSearchQuery(e.target.value)}
              />
              {clientSearchQuery && (
                <div className="border border-slate-200 rounded-lg mt-2">
                  {filteredClients.length > 0 ? (
                    <div className="max-h-48 overflow-y-auto">
                      {filteredClients.map((client) => (
                        <div
                          key={client.id}
                          onClick={() => {
                            setSelectedClient(client.id)
                            setValue('clientId', client.id)
                            setClientSearchQuery(`${client.firstName} ${client.lastName}`)
                          }}
                          className="p-3 hover:bg-slate-50 cursor-pointer border-b last:border-b-0"
                        >
                          {client.firstName} {client.lastName}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 text-center space-y-3">
                      <p className="text-sm text-slate-500">No clients found matching "{clientSearchQuery}"</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Save current form state in localStorage
                          const formState = {
                            caseNumber: (document.getElementById('caseNumber') as HTMLInputElement)?.value,
                            year: (document.getElementById('year') as HTMLInputElement)?.value,
                            appearingFor: selectedAppearingFor,
                            courtId: selectedCourt,
                            courtNumber: (document.getElementById('courtNumber') as HTMLInputElement)?.value,
                            caseTypeId: selectedCaseType,
                            opponentMainParty: (document.getElementById('opponentMainParty') as HTMLInputElement)?.value,
                            filingDate: (document.getElementById('filingDate') as HTMLInputElement)?.value,
                            nextHearingDate: (document.getElementById('nextHearingDate') as HTMLInputElement)?.value,
                            synopsis: (document.getElementById('synopsis') as HTMLTextAreaElement)?.value,
                            otherParties,
                            opponentOtherParties,
                            selectedAssignees,
                            returnTo: '/cases/new'
                          }
                          localStorage.setItem('newCaseFormState', JSON.stringify(formState))
                          router.push(`/clients/new?prefillName=${encodeURIComponent(clientSearchQuery)}`)
                        }}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Create New Client
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Other Parties (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add party name"
                  value={otherPartyInput}
                  onChange={(e) => setOtherPartyInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOtherParty())}
                />
                <Button type="button" onClick={addOtherParty} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {otherParties.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {otherParties.map((party, index) => (
                    <div key={index} className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-lg">
                      <span className="text-sm">{party}</span>
                      <button
                        type="button"
                        onClick={() => removeOtherParty(index)}
                        className="text-slate-500 hover:text-slate-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Opponent Party */}
        <Card>
          <CardHeader>
            <CardTitle>Opponent Party</CardTitle>
            <CardDescription>Main opponent and additional parties</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="opponentMainParty">
                Main Opponent Party <span className="text-red-500">*</span>
              </Label>
              <Input
                id="opponentMainParty"
                placeholder="Name of main opponent"
                {...register('opponentMainParty')}
              />
              {errors.opponentMainParty && (
                <p className="text-sm text-red-500">{errors.opponentMainParty.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Additional Opponent Parties (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add opponent name"
                  value={opponentOtherPartyInput}
                  onChange={(e) => setOpponentOtherPartyInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOpponentOtherParty())}
                />
                <Button type="button" onClick={addOpponentOtherParty} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {opponentOtherParties.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {opponentOtherParties.map((party, index) => (
                    <div key={index} className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-lg">
                      <span className="text-sm">{party}</span>
                      <button
                        type="button"
                        onClick={() => removeOpponentOtherParty(index)}
                        className="text-slate-500 hover:text-slate-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Court & Case Type */}
        <Card>
          <CardHeader>
            <CardTitle>Court & Case Type</CardTitle>
            <CardDescription>Select from available options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="courtId">Court</Label>
                <Select
                  value={selectedCourt}
                  onValueChange={(value) => {
                    if (value) {
                      setSelectedCourt(value)
                      setValue('courtId', value)
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select court" />
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
                <Input
                  id="courtNumber"
                  placeholder="e.g., 12"
                  {...register('courtNumber')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="caseTypeId">Case Type</Label>
              <Select
                value={selectedCaseType}
                onValueChange={(value) => {
                  if (value) {
                    setSelectedCaseType(value)
                    setValue('caseTypeId', value)
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select case type" />
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
          </CardContent>
        </Card>

        {/* Dates */}
        <Card>
          <CardHeader>
            <CardTitle>Important Dates</CardTitle>
            <CardDescription>Filing and hearing dates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="filingDate">
                  Filing Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="filingDate"
                  type="date"
                  {...register('filingDate')}
                />
                {errors.filingDate && (
                  <p className="text-sm text-red-500">{errors.filingDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nextHearingDate">Next Hearing Date</Label>
                <Input
                  id="nextHearingDate"
                  type="datetime-local"
                  {...register('nextHearingDate')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Synopsis */}
        <Card>
          <CardHeader>
            <CardTitle>Case Synopsis</CardTitle>
            <CardDescription>Brief overview of the case</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              id="synopsis"
              placeholder="Provide a brief summary of the case, key facts, legal issues, etc."
              rows={6}
              {...register('synopsis')}
            />
          </CardContent>
        </Card>

        {/* Team Assignment */}
        <Card>
          <CardHeader>
            <CardTitle>Assign Team Members</CardTitle>
            <CardDescription>Select team members who can access this case</CardDescription>
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
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/cases')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Case'}
          </Button>
        </div>
      </form>
    </div>
  )
}
