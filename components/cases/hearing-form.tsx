'use client'

import { useState, useEffect } from 'react'
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
import { Plus, Edit } from 'lucide-react'
import { format } from 'date-fns'

const hearingSchema = z.object({
  hearingDate: z.string().min(1, 'Hearing date is required'),
  itemNumber: z.string().optional(),
  outcome: z.string().optional(),
  nextHearingDate: z.string().optional(),
}).refine((data) => {
  if (!data.nextHearingDate) return true
  const hearingDate = new Date(data.hearingDate)
  const nextHearingDate = new Date(data.nextHearingDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Next hearing date cannot be in the past
  if (nextHearingDate < today) {
    return false
  }

  // Next hearing date must be after or equal to hearing date
  hearingDate.setHours(0, 0, 0, 0)
  nextHearingDate.setHours(0, 0, 0, 0)
  return nextHearingDate >= hearingDate
}, {
  message: 'Next hearing date must be in the future and after or on the hearing date',
  path: ['nextHearingDate'],
})

type HearingFormData = z.infer<typeof hearingSchema>

interface Hearing {
  id: string
  hearingDate: string
  itemNumber: string | null
  outcome: string | null
  nextHearingDate: string | null
}

interface HearingFormProps {
  caseId: string
  userEmail: string
  onSuccess?: () => void
  hearing?: Hearing | null
  mode?: 'create' | 'edit'
}

export function HearingForm({ caseId, userEmail, onSuccess, hearing, mode = 'create' }: HearingFormProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<HearingFormData>({
    resolver: zodResolver(hearingSchema),
    defaultValues: {
      hearingDate: hearing ? format(new Date(hearing.hearingDate), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      itemNumber: hearing?.itemNumber || '',
      outcome: hearing?.outcome || '',
      nextHearingDate: hearing?.nextHearingDate ? format(new Date(hearing.nextHearingDate), "yyyy-MM-dd") : '',
    },
  })

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && hearing) {
        setValue('hearingDate', format(new Date(hearing.hearingDate), "yyyy-MM-dd"))
        setValue('itemNumber', hearing.itemNumber || '')
        setValue('outcome', hearing.outcome || '')
        setValue('nextHearingDate', hearing.nextHearingDate ? format(new Date(hearing.nextHearingDate), "yyyy-MM-dd") : '')
      } else {
        setValue('hearingDate', format(new Date(), "yyyy-MM-dd"))
        setValue('itemNumber', '')
        setValue('outcome', '')
        setValue('nextHearingDate', '')
      }
    }
  }, [open, setValue, mode, hearing])

  const onSubmit = async (data: HearingFormData) => {
    setError(null)
    setIsSubmitting(true)

    try {
      // Create hearing date with current time (or preserve existing time for edit)
      const hearingDateTime = new Date(data.hearingDate)
      if (mode === 'create') {
        const now = new Date()
        hearingDateTime.setHours(now.getHours(), now.getMinutes(), 0, 0)
      } else if (hearing) {
        const existingDate = new Date(hearing.hearingDate)
        hearingDateTime.setHours(existingDate.getHours(), existingDate.getMinutes(), 0, 0)
      }

      // Create next hearing date with 10 AM time if provided
      let nextHearingDateTime = null
      if (data.nextHearingDate) {
        nextHearingDateTime = new Date(data.nextHearingDate)
        nextHearingDateTime.setHours(10, 0, 0, 0)
      }

      const url = mode === 'edit' && hearing ? `/api/hearings/${hearing.id}` : '/api/hearings'
      const method = mode === 'edit' ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caseId,
          userEmail,
          hearingDate: hearingDateTime.toISOString(),
          itemNumber: data.itemNumber || null,
          outcome: data.outcome || null,
          nextHearingDate: nextHearingDateTime?.toISOString() || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to ${mode} hearing`)
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
      {mode === 'edit' ? (
        <DialogTrigger render={<Button variant="ghost" size="sm" className="h-8 w-8 p-0" />}>
          <Edit className="h-4 w-4" />
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button size="lg" className="text-base" />}>
          <Plus className="mr-2 h-5 w-5" />
          Add Hearing
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl">{mode === 'edit' ? 'Edit Hearing' : 'Add New Hearing'}</DialogTitle>
          <DialogDescription>
            {mode === 'edit' ? 'Update hearing details' : 'Record details of a hearing for this case'}
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
              type="date"
              {...register('hearingDate')}
              className="text-base h-12"
            />
            <p className="text-xs text-slate-500">
              Time will be set to current time
            </p>
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
              type="date"
              {...register('nextHearingDate')}
              className="text-base h-12"
            />
            {errors.nextHearingDate && (
              <p className="text-sm text-destructive">{errors.nextHearingDate.message}</p>
            )}
            <p className="text-xs text-slate-500">
              Time will be set to 10:00 AM (automatically added to calendar)
            </p>
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
              {isSubmitting
                ? (mode === 'edit' ? 'Updating...' : 'Adding...')
                : (mode === 'edit' ? 'Update Hearing' : 'Add Hearing')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
