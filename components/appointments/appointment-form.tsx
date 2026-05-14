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
import { Plus, Edit, Calendar } from 'lucide-react'
import { format } from 'date-fns'

const appointmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  clientId: z.string().optional(),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
})

type AppointmentFormData = z.infer<typeof appointmentSchema>

interface Client {
  id: string
  firstName: string
  lastName: string
}

interface Appointment {
  id: string
  title: string
  clientId: string | null
  startTime: string
  endTime: string | null
  location: string | null
  notes: string | null
}

interface AppointmentFormProps {
  onSuccess?: () => void
  appointment?: Appointment | null
  mode?: 'create' | 'edit'
  clients?: Client[]
  trigger?: React.ReactNode
}

export function AppointmentForm({
  onSuccess,
  appointment,
  mode = 'create',
  clients = [],
  trigger,
}: AppointmentFormProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      title: appointment?.title || '',
      clientId: appointment?.clientId || '',
      startTime: appointment?.startTime
        ? format(new Date(appointment.startTime), "yyyy-MM-dd'T'HH:mm")
        : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      endTime: appointment?.endTime
        ? format(new Date(appointment.endTime), "yyyy-MM-dd'T'HH:mm")
        : '',
      location: appointment?.location || '',
      notes: appointment?.notes || '',
    },
  })

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && appointment) {
        setValue('title', appointment.title)
        setValue('clientId', appointment.clientId || '')
        setValue(
          'startTime',
          format(new Date(appointment.startTime), "yyyy-MM-dd'T'HH:mm")
        )
        setValue(
          'endTime',
          appointment.endTime
            ? format(new Date(appointment.endTime), "yyyy-MM-dd'T'HH:mm")
            : ''
        )
        setValue('location', appointment.location || '')
        setValue('notes', appointment.notes || '')
      } else {
        setValue('title', '')
        setValue('clientId', '')
        setValue('startTime', format(new Date(), "yyyy-MM-dd'T'HH:mm"))
        setValue('endTime', '')
        setValue('location', '')
        setValue('notes', '')
      }
    }
  }, [open, setValue, mode, appointment])

  const onSubmit = async (data: AppointmentFormData) => {
    setError(null)
    setIsSubmitting(true)

    try {
      const url =
        mode === 'edit' && appointment
          ? `/api/appointments/${appointment.id}`
          : '/api/appointments'
      const method = mode === 'edit' ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: data.title,
          clientId: data.clientId || null,
          startTime: new Date(data.startTime).toISOString(),
          endTime: data.endTime ? new Date(data.endTime).toISOString() : null,
          location: data.location || null,
          notes: data.notes || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to ${mode} appointment`)
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
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : mode === 'edit' ? (
        <DialogTrigger
          render={
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" />
          }
        >
          <Edit className="h-4 w-4" />
        </DialogTrigger>
      ) : (
        <DialogTrigger
          render={<Button size="lg" className="text-base" />}
        >
          <Plus className="mr-2 h-5 w-5" />
          New Appointment
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {mode === 'edit' ? 'Edit Appointment' : 'New Appointment'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit'
              ? 'Update appointment details'
              : 'Schedule a new appointment'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {error && (
            <Alert variant="destructive" className="text-base">
              {error}
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="title" className="text-base">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g., Client Meeting, Consultation"
              {...register('title')}
              className="text-base h-12"
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientId" className="text-base">
              Client
            </Label>
            <select
              id="clientId"
              {...register('clientId')}
              className="w-full h-12 px-3 rounded-md border border-slate-200 text-base bg-white"
            >
              <option value="">Select a client (optional)</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.firstName} {client.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime" className="text-base">
                Start Time <span className="text-destructive">*</span>
              </Label>
              <Input
                id="startTime"
                type="datetime-local"
                {...register('startTime')}
                className="text-base h-12"
              />
              {errors.startTime && (
                <p className="text-sm text-destructive">
                  {errors.startTime.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime" className="text-base">
                End Time
              </Label>
              <Input
                id="endTime"
                type="datetime-local"
                {...register('endTime')}
                className="text-base h-12"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="text-base">
              Location
            </Label>
            <Input
              id="location"
              placeholder="e.g., Office, Court, Online"
              {...register('location')}
              className="text-base h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-base">
              Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Additional notes or agenda..."
              rows={4}
              {...register('notes')}
              className="text-base resize-none"
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
            <Button type="submit" disabled={isSubmitting} className="text-base h-11">
              {isSubmitting
                ? mode === 'edit'
                  ? 'Updating...'
                  : 'Creating...'
                : mode === 'edit'
                ? 'Update Appointment'
                : 'Create Appointment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
