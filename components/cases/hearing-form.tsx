'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert } from '@/components/ui/alert'
import { Plus } from 'lucide-react'

const hearingSchema = z.object({
  hearingDate: z.string().min(1, 'Hearing date is required'),
  itemNumber: z.string().optional(),
  outcome: z.string().optional(),
  nextHearingDate: z.string().optional(),
})

type HearingFormData = z.infer<typeof hearingSchema>

interface HearingFormProps {
  caseId: string
  userEmail: string
  onSuccess?: () => void
}

export function HearingForm({ caseId, userEmail, onSuccess }: HearingFormProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<HearingFormData>({
    resolver: zodResolver(hearingSchema),
  })

  const onSubmit = async (data: HearingFormData) => {
    setError(null)
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/hearings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caseId,
          userEmail,
          hearingDate: new Date(data.hearingDate).toISOString(),
          itemNumber: data.itemNumber || null,
          outcome: data.outcome || null,
          nextHearingDate: data.nextHearingDate
            ? new Date(data.nextHearingDate).toISOString()
            : null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create hearing')
      }

      reset()
      setOpen(false)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="lg" className="text-base" />}>
        <Plus className="mr-2 h-5 w-5" />
        Add Hearing
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Add New Hearing</DialogTitle>
          <DialogDescription>
            Record details of a hearing for this case
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {error && (
            <Alert variant="destructive" className="text-base">
              {error}
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="hearingDate" className="text-base">
              Hearing Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="hearingDate"
              type="datetime-local"
              {...register('hearingDate')}
              className="text-base h-12"
            />
            {errors.hearingDate && (
              <p className="text-sm text-destructive">
                {errors.hearingDate.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="itemNumber" className="text-base">
              Item Number
            </Label>
            <Input
              id="itemNumber"
              type="text"
              placeholder="e.g., 45"
              {...register('itemNumber')}
              className="text-base h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="outcome" className="text-base">
              Outcome / Notes
            </Label>
            <Textarea
              id="outcome"
              placeholder="Record what happened during the hearing..."
              rows={5}
              {...register('outcome')}
              className="text-base resize-none"
            />
            {errors.outcome && (
              <p className="text-sm text-destructive">{errors.outcome.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nextHearingDate" className="text-base">
              Next Hearing Date
            </Label>
            <Input
              id="nextHearingDate"
              type="datetime-local"
              {...register('nextHearingDate')}
              className="text-base h-12"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
              className="text-base h-11"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="text-base h-11"
            >
              {isSubmitting ? 'Adding...' : 'Add Hearing'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
