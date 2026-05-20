'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Calendar, FileText, Clock, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { HearingForm } from './hearing-form'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

// WhatsApp SVG Icon
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
)

interface Hearing {
  id: string
  hearingDate: string
  itemNumber: string | null
  outcome: string | null
  nextHearingDate: string | null
  createdAt: string
}

interface Client {
  id: string
  firstName: string
  lastName: string | null
  phone: string
}

interface HearingTimelineProps {
  hearings: Hearing[]
  userEmail: string
  caseId: string
  caseNumber: string
  client: Client | null
  onUpdate?: () => void
}

export function HearingTimeline({ hearings, userEmail, caseId, caseNumber, client, onUpdate }: HearingTimelineProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [hearingToDelete, setHearingToDelete] = useState<Hearing | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleDeleteClick = (hearing: Hearing) => {
    setHearingToDelete(hearing)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!hearingToDelete) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/hearings/${hearingToDelete.id}?email=${encodeURIComponent(userEmail)}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete hearing')
      }

      toast.success('Hearing deleted successfully')
      setDeleteDialogOpen(false)
      setHearingToDelete(null)
      onUpdate?.()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete hearing')
    } finally {
      setDeleting(false)
    }
  }

  const handleWhatsAppShare = (hearing: Hearing) => {
    if (!client || !client.phone) {
      alert('Client phone number not available')
      return
    }

    // Format the message
    const hearingDate = new Date(hearing.hearingDate)
    const clientName = client.firstName

    let message = `Dear ${clientName},\n\n`
    message += `This is to inform you about the hearing details for your case ${caseNumber}:\n\n`
    message += `📅 Hearing Date: ${format(hearingDate, 'EEEE, MMMM d, yyyy')}\n`
    message += `🕐 Time: ${format(hearingDate, 'h:mm a')}\n`

    if (hearing.itemNumber) {
      message += `📋 Item Number: ${hearing.itemNumber}\n`
    }

    if (hearing.outcome) {
      // Strip HTML tags from outcome for WhatsApp
      const outcomeText = hearing.outcome.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
      message += `\n📝 Outcome:\n${outcomeText}\n`
    }

    if (hearing.nextHearingDate) {
      message += `\n⏭️ Next Hearing: ${format(new Date(hearing.nextHearingDate), 'MMMM d, yyyy')}\n`
    }

    message += `\nPlease let us know if you have any questions.\n\nRegards`

    // Clean phone number (remove spaces, dashes, etc.)
    const cleanPhone = client.phone.replace(/\D/g, '')

    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`

    // Open in new tab
    window.open(whatsappUrl, '_blank')
  }

  if (hearings.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="p-4 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full w-fit mx-auto mb-4">
          <Calendar className="h-12 w-12 text-primary" />
        </div>
        <p className="text-slate-900 text-lg font-medium">No hearings recorded yet</p>
        <p className="text-sm text-slate-600 mt-1">Add your first hearing to start tracking</p>
      </div>
    )
  }

  // Sort hearings by date (newest first)
  const sortedHearings = [...hearings].sort(
    (a, b) => new Date(b.hearingDate).getTime() - new Date(a.hearingDate).getTime()
  )

  return (
    <div className="relative">
      {/* Timeline vertical line */}
      <div className="absolute left-[23px] md:left-[27px] top-0 bottom-0 w-[2px] md:w-[3px] bg-gradient-to-b from-purple-600 via-purple-500 to-purple-400" />

      <div className="space-y-4 md:space-y-6">
        {sortedHearings.map((hearing) => {
          const hearingDate = new Date(hearing.hearingDate)

          return (
            <div key={hearing.id} className="relative pl-16 md:pl-20">
              {/* Date button with calendar look */}
              <div className="absolute left-0 top-0 flex flex-col items-center">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex flex-col items-center justify-center text-white font-bold shadow-md border-2 border-white bg-gradient-to-br from-slate-400 to-slate-500">
                  <span className="text-[9px] md:text-[10px] font-semibold uppercase tracking-wide opacity-90">{format(hearingDate, 'MMM')}</span>
                  <span className="text-lg md:text-xl font-bold leading-tight">{format(hearingDate, 'd')}</span>
                </div>
              </div>

              {/* Card */}
              <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                <CardContent className="p-3 md:p-4">
                  {/* Header with time, item number, and action buttons */}
                  <div className="flex items-start justify-between gap-2 mb-2 md:mb-3">
                    <div className="flex items-center gap-1.5 md:gap-2 text-slate-600">
                      <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
                      <span className="text-xs md:text-sm font-medium">
                        {format(hearingDate, 'h:mm a')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-2">
                      {hearing.itemNumber && (
                        <Badge className="bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200 text-[10px] md:text-xs">
                          Item #{hearing.itemNumber}
                        </Badge>
                      )}
                      {client && client.phone && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleWhatsAppShare(hearing)}
                          className="h-7 w-7 md:h-8 md:w-8 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50 transition-colors"
                          title="Share via WhatsApp"
                        >
                          <WhatsAppIcon className="h-4 w-4 md:h-5 md:w-5" />
                        </Button>
                      )}
                      <HearingForm
                        caseId={caseId}
                        userEmail={userEmail}
                        hearing={hearing}
                        mode="edit"
                        onSuccess={() => onUpdate?.()}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(hearing)}
                        className="h-7 w-7 md:h-8 md:w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                        title="Delete hearing"
                      >
                        <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Hearing title */}
                  <h3 className="text-base md:text-lg font-semibold text-slate-900 mb-0.5 md:mb-1">
                    Hearing - {format(hearingDate, 'MMM d, yyyy')}
                  </h3>
                  <p className="text-xs md:text-sm text-slate-500 mb-2 md:mb-3">
                    {format(hearingDate, 'EEEE')}
                  </p>

                  {/* Outcome */}
                  {hearing.outcome && (
                    <div className="bg-slate-50 rounded-lg p-2.5 md:p-3 mb-2 md:mb-3">
                      <div className="flex items-start gap-2">
                        <FileText className="h-3.5 w-3.5 md:h-4 md:w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] md:text-xs font-medium text-slate-500 mb-1">Outcome</p>
                          <div
                            className="text-xs md:text-sm text-slate-700 leading-relaxed prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-4 md:[&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-4 md:[&_ol]:pl-6 [&_li]:my-0.5 md:[&_li]:my-1"
                            dangerouslySetInnerHTML={{ __html: hearing.outcome }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Next hearing date */}
                  {hearing.nextHearingDate && (
                    <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm pt-2 md:pt-3 border-t border-slate-100">
                      <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4 text-purple-600 flex-shrink-0" />
                      <span className="text-slate-600">Next:</span>
                      <span className="font-medium text-slate-900">
                        {format(new Date(hearing.nextHearingDate), 'MMM d, yyyy')}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Hearing?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this hearing record?
              {hearingToDelete && (
                <span className="block mt-2 font-medium text-slate-900">
                  {format(new Date(hearingToDelete.hearingDate), 'MMMM d, yyyy')} at {format(new Date(hearingToDelete.hearingDate), 'h:mm a')}
                </span>
              )}
              <span className="block mt-2 text-red-600">
                This action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
