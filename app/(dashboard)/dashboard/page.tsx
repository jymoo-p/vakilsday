import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canViewAllCases } from '@/lib/utils/rbac'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Calendar, Users, FileText } from 'lucide-react'
import { format } from 'date-fns'

type CaseWithDetails = {
  id: string
  caseNumber: string
  courtName: string
  courtNumber: string | null
  petitionerName: string
  respondentName: string
  judgeName: string | null
  status: string
  nextHearingDate: Date | null
  assignments: Array<{
    user: {
      name: string | null
      role: string
    }
  }>
  hearings: Array<{
    id: string
    hearingDate: Date
    itemNumber: string | null
  }>
}

async function getTodaysCases(userId: string, isAdmin: boolean) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  let whereClause: any = {
    nextHearingDate: {
      gte: today,
      lt: tomorrow,
    },
    status: 'ACTIVE',
  }

  if (!isAdmin) {
    whereClause.assignments = {
      some: {
        userId: userId,
      },
    }
  }

  const cases = await prisma.case.findMany({
    where: whereClause,
    include: {
      assignments: {
        include: {
          user: {
            select: {
              name: true,
              role: true,
            },
          },
        },
      },
      hearings: {
        orderBy: {
          hearingDate: 'desc',
        },
        take: 1,
      },
    },
    orderBy: {
      courtNumber: 'asc',
    },
  })

  return cases
}

async function getUpcomingCases(userId: string, isAdmin: boolean) {
  const tomorrow = new Date()
  tomorrow.setHours(0, 0, 0, 0)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const nextWeek = new Date(tomorrow)
  nextWeek.setDate(nextWeek.getDate() + 7)

  let whereClause: any = {
    nextHearingDate: {
      gte: tomorrow,
      lt: nextWeek,
    },
    status: 'ACTIVE',
  }

  if (!isAdmin) {
    whereClause.assignments = {
      some: {
        userId: userId,
      },
    }
  }

  const cases = await prisma.case.findMany({
    where: whereClause,
    orderBy: {
      nextHearingDate: 'asc',
    },
    take: 5,
  })

  return cases
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    return null
  }

  const isAdmin = canViewAllCases(user.role)
  const todaysCases = await getTodaysCases(user.id, isAdmin)
  const upcomingCases = await getUpcomingCases(user.id, isAdmin)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Today's Schedule</h2>
        <p className="text-muted-foreground">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {todaysCases.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No hearings today</h3>
              <p className="text-sm text-muted-foreground mt-2">
                You have no scheduled hearings for today. Enjoy your day!
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {todaysCases.map((caseItem: CaseWithDetails) => (
            <Link key={caseItem.id} href={`/cases/${caseItem.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{caseItem.caseNumber}</CardTitle>
                      <CardDescription className="text-base">
                        {caseItem.petitionerName} vs {caseItem.respondentName}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="ml-4">
                      {caseItem.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Court</p>
                      <p className="font-medium">{caseItem.courtName}</p>
                    </div>
                    {caseItem.courtNumber && (
                      <div>
                        <p className="text-sm text-muted-foreground">Court No.</p>
                        <p className="font-medium">{caseItem.courtNumber}</p>
                      </div>
                    )}
                    {caseItem.hearings[0]?.itemNumber && (
                      <div>
                        <p className="text-sm text-muted-foreground">Item No.</p>
                        <p className="font-medium">{caseItem.hearings[0].itemNumber}</p>
                      </div>
                    )}
                    {caseItem.judgeName && (
                      <div>
                        <p className="text-sm text-muted-foreground">Judge</p>
                        <p className="font-medium">{caseItem.judgeName}</p>
                      </div>
                    )}
                  </div>
                  {caseItem.assignments.length > 0 && (
                    <div className="mt-4 flex items-center text-sm text-muted-foreground">
                      <Users className="h-4 w-4 mr-2" />
                      {caseItem.assignments.map((a) => a.user.name).join(', ')}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8">
        <h3 className="text-2xl font-bold tracking-tight mb-4">Upcoming This Week</h3>
        {upcomingCases.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground py-8">
                No upcoming hearings in the next 7 days
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {upcomingCases.map((caseItem) => (
              <Link key={caseItem.id} href={`/cases/${caseItem.id}`}>
                <Card className="hover:bg-accent transition-colors cursor-pointer">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{caseItem.caseNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {caseItem.petitionerName} vs {caseItem.respondentName}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm font-medium">
                          {caseItem.nextHearingDate && format(new Date(caseItem.nextHearingDate), 'MMM d, yyyy')}
                        </p>
                        <p className="text-sm text-muted-foreground">{caseItem.courtName}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
