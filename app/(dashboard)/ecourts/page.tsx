'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Calendar, Search, AlertCircle, CheckCircle2, User, Scale } from 'lucide-react'
import { format } from 'date-fns'

interface CauseListEntry {
  case_number: string | null
  case_type: string | null
  petitioner: string | null
  respondent: string | null
  advocate_petitioner: string | null
  advocate_respondent: string | null
  judge: string | null
  court_number: string | null
  item_number: string | null
  purpose: string | null
}

export default function ECourtsPage() {
  const { user } = useAuth()
  const [stateCode, setStateCode] = useState('KL')
  const [courtCode, setCourtCode] = useState('1')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [loading, setLoading] = useState(false)
  const [causeList, setCauseList] = useState<CauseListEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [setupChecked, setSetupChecked] = useState(false)
  const [setupInstalled, setSetupInstalled] = useState(false)

  const handleCheckSetup = async () => {
    try {
      const response = await fetch('/api/ecourts/setup-check')
      const data = await response.json()
      setSetupInstalled(data.installed)
      setSetupChecked(true)
      if (!data.installed) {
        setError(data.error || 'eCourts library not installed')
      }
    } catch (err) {
      setError('Failed to check setup')
      setSetupChecked(true)
    }
  }

  const handleFetchCauseList = async () => {
    if (!user?.email) return

    setLoading(true)
    setError(null)
    setCauseList([])

    try {
      const response = await fetch(
        `/api/ecourts/cause-list?email=${encodeURIComponent(user.email)}&stateCode=${stateCode}&courtCode=${courtCode}&date=${date}`
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch cause list')
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch cause list')
      }

      setCauseList(data.cases || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl px-4 md:px-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">eCourts Integration</h1>
        <p className="text-sm md:text-base text-slate-600 mt-1">
          Fetch daily cause lists from Indian High Courts
        </p>
      </div>

      {/* Setup Check */}
      {!setupChecked && (
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-purple-900 mb-2">Setup Required</h3>
                <p className="text-sm text-purple-700 mb-4">
                  Before using eCourts integration, we need to verify the Python library is installed.
                </p>
                <Button onClick={handleCheckSetup} size="sm">
                  Check Setup
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {setupChecked && !setupInstalled && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'eCourts library not installed'}
            <br />
            <br />
            <strong>Setup Instructions:</strong>
            <br />
            1. Install Python 3.8 or higher
            <br />
            2. Run: <code className="bg-red-100 px-2 py-1 rounded">pip3 install ecourts</code>
            <br />
            3. Restart the server and click "Check Setup" again
          </AlertDescription>
        </Alert>
      )}

      {setupChecked && setupInstalled && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            eCourts library is installed and ready to use!
          </AlertDescription>
        </Alert>
      )}

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Fetch Cause List
          </CardTitle>
          <CardDescription>
            Get the daily cause list for a specific High Court
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stateCode">State</Label>
              <Select value={stateCode} onValueChange={setStateCode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KL">Kerala</SelectItem>
                  <SelectItem value="TN">Tamil Nadu</SelectItem>
                  <SelectItem value="KA">Karnataka</SelectItem>
                  <SelectItem value="MH">Maharashtra</SelectItem>
                  <SelectItem value="DL">Delhi</SelectItem>
                  <SelectItem value="GJ">Gujarat</SelectItem>
                  <SelectItem value="RJ">Rajasthan</SelectItem>
                  <SelectItem value="AP">Andhra Pradesh</SelectItem>
                  <SelectItem value="TS">Telangana</SelectItem>
                  <SelectItem value="WB">West Bengal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="courtCode">Court Bench</Label>
              <Select value={courtCode} onValueChange={setCourtCode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Principal Bench</SelectItem>
                  <SelectItem value="2">Second Bench</SelectItem>
                  <SelectItem value="3">Third Bench</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-10"
              />
            </div>
          </div>

          <Button
            onClick={handleFetchCauseList}
            disabled={loading || !setupInstalled}
            className="w-full md:w-auto"
          >
            <Search className="h-4 w-4 mr-2" />
            {loading ? 'Fetching...' : 'Fetch Cause List'}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {causeList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cause List Results</CardTitle>
            <CardDescription>
              Found {causeList.length} case{causeList.length !== 1 ? 's' : ''} for {format(new Date(date), 'MMMM d, yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {causeList.map((entry, index) => (
                <Card key={index} className="border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{entry.case_number || 'N/A'}</h3>
                        {entry.case_type && (
                          <Badge variant="outline" className="mt-1">
                            {entry.case_type}
                          </Badge>
                        )}
                      </div>
                      {entry.item_number && (
                        <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                          Item #{entry.item_number}
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="flex items-start gap-2 mb-2">
                          <User className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-slate-500">Petitioner</p>
                            <p className="font-medium">{entry.petitioner || 'N/A'}</p>
                            {entry.advocate_petitioner && (
                              <p className="text-xs text-slate-600 mt-1">Adv: {entry.advocate_petitioner}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-start gap-2 mb-2">
                          <User className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-slate-500">Respondent</p>
                            <p className="font-medium">{entry.respondent || 'N/A'}</p>
                            {entry.advocate_respondent && (
                              <p className="text-xs text-slate-600 mt-1">Adv: {entry.advocate_respondent}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {(entry.judge || entry.court_number || entry.purpose) && (
                      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-4 text-sm">
                        {entry.judge && (
                          <div className="flex items-center gap-1.5">
                            <Scale className="h-4 w-4 text-slate-400" />
                            <span className="text-slate-600">Judge:</span>
                            <span className="font-medium">{entry.judge}</span>
                          </div>
                        )}
                        {entry.court_number && (
                          <div className="text-slate-600">
                            Court: <span className="font-medium">{entry.court_number}</span>
                          </div>
                        )}
                        {entry.purpose && (
                          <div className="text-slate-600">
                            Purpose: <span className="font-medium">{entry.purpose}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {causeList.length === 0 && !loading && !error && setupInstalled && (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-slate-400 mb-4" />
            <p className="text-lg font-medium text-slate-900">No Results Yet</p>
            <p className="text-sm text-slate-600 mt-1">
              Select a court and date to fetch the cause list
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
