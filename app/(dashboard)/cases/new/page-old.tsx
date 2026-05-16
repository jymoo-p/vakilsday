'use client'

import { useState } from 'react'
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
import { Alert } from '@/components/ui/alert'
import { ChevronLeft } from 'lucide-react'

const caseSchema = z.object({
  caseNumber: z.string().min(1, 'Case number is required'),
  courtName: z.string().min(1, 'Court name is required'),
  courtNumber: z.string().optional(),
  petitionerName: z.string().min(1, 'Petitioner name is required'),
  respondentName: z.string().min(1, 'Respondent name is required'),
  judgeName: z.string().optional(),
  opposingCounselName: z.string().optional(),
  opposingCounselPhone: z.string().optional(),
  filingDate: z.string().min(1, 'Filing date is required'),
  nextHearingDate: z.string().optional(),
  synopsis: z.string().optional(),
})

type CaseFormData = z.infer<typeof caseSchema>

export default function NewCasePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CaseFormData>({
    resolver: zodResolver(caseSchema),
  })

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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Button
          variant="ghost"
          onClick={() => router.push('/cases')}
          className="mb-4 text-base"
        >
          <ChevronLeft className="mr-2 h-5 w-5" />
          Back to Cases
        </Button>

        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold">New Case</h1>
          <p className="text-lg text-muted-foreground">
            Create a new case record in the system
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <Alert variant="destructive" className="text-base">
            {error}
          </Alert>
        )}

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Basic Information</CardTitle>
            <CardDescription className="text-base">
              Core details about the case
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="caseNumber" className="text-base">
                Case Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="caseNumber"
                type="text"
                placeholder="e.g., CRL/123/2024"
                {...register('caseNumber')}
                className="text-base h-12"
              />
              {errors.caseNumber && (
                <p className="text-sm text-destructive">
                  {errors.caseNumber.message}
                </p>
              )}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="courtName" className="text-base">
                  Court Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="courtName"
                  type="text"
                  placeholder="e.g., Delhi High Court"
                  {...register('courtName')}
                  className="text-base h-12"
                />
                {errors.courtName && (
                  <p className="text-sm text-destructive">
                    {errors.courtName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="courtNumber" className="text-base">
                  Court Number
                </Label>
                <Input
                  id="courtNumber"
                  type="text"
                  placeholder="e.g., 12"
                  {...register('courtNumber')}
                  className="text-base h-12"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Parties */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Parties</CardTitle>
            <CardDescription className="text-base">
              Petitioner and respondent details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="petitionerName" className="text-base">
                Petitioner Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="petitionerName"
                type="text"
                placeholder="Name of petitioner"
                {...register('petitionerName')}
                className="text-base h-12"
              />
              {errors.petitionerName && (
                <p className="text-sm text-destructive">
                  {errors.petitionerName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="respondentName" className="text-base">
                Respondent Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="respondentName"
                type="text"
                placeholder="Name of respondent"
                {...register('respondentName')}
                className="text-base h-12"
              />
              {errors.respondentName && (
                <p className="text-sm text-destructive">
                  {errors.respondentName.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Additional Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Additional Details</CardTitle>
            <CardDescription className="text-base">
              Judge and opposing counsel information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="judgeName" className="text-base">
                Judge Name
              </Label>
              <Input
                id="judgeName"
                type="text"
                placeholder="Name of presiding judge"
                {...register('judgeName')}
                className="text-base h-12"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="opposingCounselName" className="text-base">
                  Opposing Counsel Name
                </Label>
                <Input
                  id="opposingCounselName"
                  type="text"
                  placeholder="Name of opposing counsel"
                  {...register('opposingCounselName')}
                  className="text-base h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="opposingCounselPhone" className="text-base">
                  Opposing Counsel Phone
                </Label>
                <Input
                  id="opposingCounselPhone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  {...register('opposingCounselPhone')}
                  className="text-base h-12"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Important Dates</CardTitle>
            <CardDescription className="text-base">
              Filing and hearing dates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="filingDate" className="text-base">
                  Filing Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="filingDate"
                  type="date"
                  {...register('filingDate')}
                  className="text-base h-12"
                />
                {errors.filingDate && (
                  <p className="text-sm text-destructive">
                    {errors.filingDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nextHearingDate" className="text-base">
                  Next Hearing Date (Optional)
                </Label>
                <Input
                  id="nextHearingDate"
                  type="datetime-local"
                  {...register('nextHearingDate')}
                  className="text-base h-12"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Synopsis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Case Synopsis</CardTitle>
            <CardDescription className="text-base">
              Brief overview of the case (optional)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              id="synopsis"
              placeholder="Provide a brief summary of the case, key facts, legal issues, etc."
              rows={6}
              {...register('synopsis')}
              className="text-base resize-none"
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/cases')}
            disabled={isSubmitting}
            className="text-base h-12"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="text-base h-12 px-8"
          >
            {isSubmitting ? 'Creating...' : 'Create Case'}
          </Button>
        </div>
      </form>
    </div>
  )
}
