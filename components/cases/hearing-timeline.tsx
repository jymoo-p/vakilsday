'use client'

import { format } from 'date-fns'
import { Calendar, FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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
}

export function HearingTimeline({ hearings }: HearingTimelineProps) {
  if (hearings.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground text-lg">No hearings recorded yet</p>
        <p className="text-sm text-muted-foreground">Add your first hearing to start tracking</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {hearings.map((hearing, index) => (
        <div key={hearing.id} className="relative">
          {/* Timeline line */}
          {index !== hearings.length - 1 && (
            <div className="absolute left-4 top-12 bottom-0 w-0.5 bg-border -translate-x-1/2" />
          )}

          <Card className="relative">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {/* Timeline dot */}
                <div className="relative flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                    <Calendar className="h-4 w-4" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-3">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h3 className="text-xl font-semibold">
                        {format(new Date(hearing.hearingDate), 'MMMM d, yyyy')}
                      </h3>
                      <p className="text-base text-muted-foreground">
                        {format(new Date(hearing.hearingDate), 'EEEE, h:mm a')}
                      </p>
                    </div>
                    {hearing.itemNumber && (
                      <Badge variant="outline" className="text-base px-3 py-1">
                        Item #{hearing.itemNumber}
                      </Badge>
                    )}
                  </div>

                  {/* Outcome */}
                  {hearing.outcome && (
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <FileText className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-muted-foreground mb-1">
                            Outcome
                          </p>
                          <p className="text-base leading-relaxed whitespace-pre-wrap">
                            {hearing.outcome}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Next hearing date */}
                  {hearing.nextHearingDate && (
                    <div className="flex items-center gap-2 text-base">
                      <Calendar className="h-5 w-5 text-primary" />
                      <span className="text-muted-foreground">Next hearing:</span>
                      <span className="font-medium">
                        {format(new Date(hearing.nextHearingDate), 'MMMM d, yyyy')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  )
}
