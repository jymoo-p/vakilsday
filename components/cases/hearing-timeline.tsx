'use client'

import { format } from 'date-fns'
import { Calendar, FileText, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { HearingForm } from './hearing-form'

interface Hearing {
  id: string
  hearingDate: string
  itemNumber: string | null
  outcome: string | null
  nextHearingDate: string | null
  createdAt: string
}

interface HearingTimelineProps {
  hearings: Hearing[]
  userEmail: string
  caseId: string
  onUpdate?: () => void
}

export function HearingTimeline({ hearings, userEmail, caseId, onUpdate }: HearingTimelineProps) {
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
      <div className="absolute left-[19px] md:left-[23px] top-0 bottom-0 w-[2px] md:w-[3px] bg-gradient-to-b from-purple-400 via-purple-300 to-purple-200" />

      <div className="space-y-4 md:space-y-6">
        {sortedHearings.map((hearing) => {
          const hearingDate = new Date(hearing.hearingDate)
          const isUpcoming = hearingDate > new Date()

          return (
            <div key={hearing.id} className="relative pl-12 md:pl-16">
              {/* Date circle */}
              <div className="absolute left-0 top-0 flex flex-col items-center">
                <div
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex flex-col items-center justify-center text-white font-bold shadow-md ${
                    isUpcoming ? 'bg-gradient-to-br from-purple-500 to-purple-600' : 'bg-gradient-to-br from-green-500 to-green-600'
                  }`}
                >
                  <span className="text-[9px] md:text-xs font-medium uppercase">{format(hearingDate, 'MMM')}</span>
                  <span className="text-base md:text-lg">{format(hearingDate, 'd')}</span>
                </div>
              </div>

              {/* Card */}
              <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                <CardContent className="p-3 md:p-4">
                  {/* Header with time, item number, and edit button */}
                  <div className="flex items-start justify-between gap-2 mb-2 md:mb-3">
                    <div className="flex items-center gap-1.5 md:gap-2 text-slate-600">
                      <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
                      <span className="text-xs md:text-sm font-medium">
                        {format(hearingDate, 'h:mm a')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {hearing.itemNumber && (
                        <Badge className="bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200 text-[10px] md:text-xs">
                          Item #{hearing.itemNumber}
                        </Badge>
                      )}
                      <HearingForm
                        caseId={caseId}
                        userEmail={userEmail}
                        hearing={hearing}
                        mode="edit"
                        onSuccess={() => onUpdate?.()}
                      />
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
    </div>
  )
}
