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
import { toast } from 'sonner'

const hearingSchema = z.object({
  hearingDate: z.string().min(1, 'Hearing date is required'),
  itemNumber: z.string().optional(),
  outcome: z.string().optional(),
  nextHearingDate: z.string().min(1, 'Next hearing date is required'),
  nextHearingTime: z.string().min(1, 'Next hearing time is required'),
}).refine((data) => {
  const hearingDate = new Date(data.hearingDate)
  const nextHearingDate = new Date(data.nextHearingDate)

  // Next hearing date must be on or after the hearing date
  hearingDate.setHours(0, 0, 0, 0)
  nextHearingDate.setHours(0, 0, 0, 0)
  return nextHearingDate >= hearingDate
}, {
  message: 'Next hearing date cannot be earlier than the hearing date',
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
      nextHearingDate: hearing?.nextHearingDate ? format(new Date(hearing.nextHearingDate), "yyyy-MM-dd") : format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      nextHearingTime: hearing?.nextHearingDate ? format(new Date(hearing.nextHearingDate), "HH:mm") : "11:00",
    },
  })

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && hearing) {
        setValue('hearingDate', format(new Date(hearing.hearingDate), "yyyy-MM-dd"))
        setValue('itemNumber', hearing.itemNumber || '')
        setValue('outcome', hearing.outcome || '')
        setValue('nextHearingDate', hearing.nextHearingDate ? format(new Date(hearing.nextHearingDate), "yyyy-MM-dd") : format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"))
        setValue('nextHearingTime', hearing.nextHearingDate ? format(new Date(hearing.nextHearingDate), "HH:mm") : "11:00")
      } else {
        const today = new Date()
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
        setValue('hearingDate', format(today, "yyyy-MM-dd"))
        setValue('itemNumber', '')
        setValue('outcome', '')
        setValue('nextHearingDate', format(nextWeek, "yyyy-MM-dd"))
        setValue('nextHearingTime', "11:00")
      }
    }
  }, [open, setValue, mode, hearing])

  const onSubmit = async (data: HearingFormData) => {
    setError(null)

    // Check if time is unusual (between 5 PM and 11 AM)
    const [hours, minutes] = data.nextHearingTime.split(':').map(Number)
    const isUnusualTime = hours >= 17 || hours < 11

    if (isUnusualTime) {
      const confirmed = window.confirm(
        `The selected time is ${data.nextHearingTime} (${hours >= 12 ? hours === 12 ? '12' : hours - 12 : hours}:${minutes.toString().padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}).\n\nThis is outside typical court hours (11 AM - 5 PM).\n\nDo you want to continue?`
      )
      if (!confirmed) {
        return
      }
    }

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

      // Create next hearing date with selected time
      let nextHearingDateTime = null
      if (data.nextHearingDate) {
        nextHearingDateTime = new Date(data.nextHearingDate)
        nextHearingDateTime.setHours(hours, minutes, 0, 0)
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

      toast.success('Saved!')
      reset()
      setOpen(false)
      onSuccess?.()
    } catch (err) {
      toast.error('Something went wrong. Try again.')
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
        <DialogTrigger render={<Button size="sm" />}>
          <Plus className="mr-2 h-4 w-4" />
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nextHearingDate" className="text-base">
                Next Hearing Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nextHearingDate"
                type="date"
                {...register('nextHearingDate')}
                className="text-base h-12"
              />
              {errors.nextHearingDate && (
                <p className="text-sm text-red-500">{errors.nextHearingDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nextHearingTime" className="text-base">
                Time <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nextHearingTime"
                type="time"
                {...register('nextHearingTime')}
                className="text-base h-12"
              />
              {errors.nextHearingTime && (
                <p className="text-sm text-red-500">{errors.nextHearingTime.message}</p>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-500 -mt-2">
            Court hours are typically 11 AM - 5 PM. You'll be asked to confirm unusual times.
          </p>

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
