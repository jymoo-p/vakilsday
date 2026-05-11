'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Calendar, Users } from 'lucide-react'
import { format } from 'date-fns'

interface Case {
  id: string
  caseNumber: string
  courtName: string
  courtNumber: string | null
  petitionerName: string
  respondentName: string
  status: string
  nextHearingDate: string | null
  assignments: Array<{
    user: {
      name: string
      role: string
    }
  }>
  _count: {
    hearings: number
    documents: number
  }
}

export default function CasesPage() {
  const { user } = useAuth()
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [userRole, setUserRole] = useState<string>('ASSOCIATE')

  useEffect(() => {
    async function fetchUserData() {
      if (user?.email) {
        const response = await fetch(`/api/users/${encodeURIComponent(user.email)}`)
        if (response.ok) {
          const data = await response.json()
          setUserRole(data.user?.role || 'ASSOCIATE')
        }
      }
    }
    fetchUserData()
    fetchCases()
  }, [user])

  const fetchCases = async () => {
    if (!user?.email) return

    try {
      const res = await fetch(`/api/cases?email=${encodeURIComponent(user.email)}`)
      const data = await res.json()
      setCases(data.cases || [])
    } catch (error) {
      console.error('Error fetching cases:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCases = cases.filter(
    (c) =>
      c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.petitionerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.respondentName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const canCreateCase = userRole !== 'CLERK'

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Cases</h2>
          <p className="text-lg text-muted-foreground">Manage your legal cases</p>
        </div>
        {canCreateCase && (
          <Button
            render={<Link href="/cases/new" />}
            size="lg"
            className="text-base w-full sm:w-auto"
          >
            <Plus className="mr-2 h-5 w-5" />
            New Case
          </Button>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search cases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 text-base h-12"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">Loading cases...</p>
          </div>
        </div>
      ) : filteredCases.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">No cases found</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredCases.map((caseItem) => (
            <Link key={caseItem.id} href={`/cases/${caseItem.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <CardTitle className="text-xl sm:text-2xl">{caseItem.caseNumber}</CardTitle>
                      <CardDescription className="text-base sm:text-lg">
                        {caseItem.petitionerName} vs {caseItem.respondentName}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={
                        caseItem.status === 'ACTIVE'
                          ? 'default'
                          : caseItem.status === 'CLOSED'
                          ? 'secondary'
                          : 'outline'
                      }
                      className="text-sm px-2.5 py-1 flex-shrink-0"
                    >
                      {caseItem.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Court</p>
                      <p className="text-base font-medium truncate">{caseItem.courtName}</p>
                    </div>
                    {caseItem.courtNumber && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Court No.</p>
                        <p className="text-base font-medium">{caseItem.courtNumber}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Next Hearing</p>
                      <p className="text-base font-medium flex items-center">
                        <Calendar className="h-4 w-4 mr-1.5" />
                        {caseItem.nextHearingDate
                          ? format(new Date(caseItem.nextHearingDate), 'MMM d, yyyy')
                          : 'Not set'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Hearings</p>
                      <p className="text-base font-medium">{caseItem._count.hearings}</p>
                    </div>
                  </div>
                  {caseItem.assignments.length > 0 && (
                    <div className="mt-4 flex items-center text-base text-muted-foreground">
                      <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">
                        {caseItem.assignments.map((a) => a.user.name).join(', ')}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
