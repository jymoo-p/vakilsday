'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Search, AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface CaseDetails {
  caseNumber?: string
  year?: number
  petitioner?: string
  respondent?: string
  advocate?: string
  courtName?: string
  caseType?: string
  filingDate?: string
  actSection?: string
  status?: string
  rawData?: Record<string, any>
}

interface CNRLookupProps {
  onDetailsFound?: (details: CaseDetails) => void
  onCaseNumberFound?: (caseNumber: string) => void
  onError?: (error: string) => void
}

export function CNRLookup({ onDetailsFound, onCaseNumberFound, onError }: CNRLookupProps) {
  const [cnr, setCnr] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [fetchedDetails, setFetchedDetails] = useState<CaseDetails | null>(null)

  const handleLookup = async () => {
    if (!cnr.trim()) {
      setError('Please enter a CNR number')
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(false)
    setFetchedDetails(null)

    try {
      const response = await fetch('/api/cases/lookup-cnr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cnr: cnr.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMsg = data.error || 'Failed to fetch case details'
        setError(errorMsg)
        if (onError) onError(errorMsg)
        toast.error(errorMsg)
        return
      }

      if (data.success && data.caseDetails) {
        const details = data.caseDetails
        setFetchedDetails(details)
        setSuccess(true)
        
        if (onDetailsFound) {
          onDetailsFound(details)
        }
        
        if (onCaseNumberFound && details.caseNumber) {
          onCaseNumberFound(details.caseNumber)
        }

        toast.success('Case details fetched successfully!')
        setCnr('') // Clear input after successful lookup
      } else {
        const errorMsg = 'No case found with this CNR number'
        setError(errorMsg)
        if (onError) onError(errorMsg)
        toast.error(errorMsg)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Network error occurred'
      setError(errorMsg)
      if (onError) onError(errorMsg)
      toast.error(errorMsg)
      console.error('[CNR-LOOKUP] Error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleLookup()
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          Fetch Case Details from eCourts
        </CardTitle>
        <CardDescription>
          Enter CNR number to auto-populate case details (16-digit alphanumeric)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">CNR Number</label>
          <div className="flex gap-2">
            <Input
              placeholder="e.g., MHAU019999992015"
              value={cnr}
              onChange={(e) => {
                setCnr(e.target.value.toUpperCase())
                setError(null)
                setSuccess(false)
              }}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              maxLength={16}
            />
            <Button
              onClick={handleLookup}
              disabled={isLoading || !cnr.trim()}
              className="whitespace-nowrap"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Fetching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Lookup
                </>
              )}
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && fetchedDetails && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Case details loaded! Review the populated fields below.
            </AlertDescription>
          </Alert>
        )}

        {fetchedDetails && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg text-sm">
            {fetchedDetails.caseNumber && (
              <div>
                <span className="font-medium text-gray-600">Case Number:</span>
                <p className="text-gray-900">{fetchedDetails.caseNumber}</p>
              </div>
            )}
            {fetchedDetails.year && (
              <div>
                <span className="font-medium text-gray-600">Year:</span>
                <p className="text-gray-900">{fetchedDetails.year}</p>
              </div>
            )}
            {fetchedDetails.petitioner && (
              <div>
                <span className="font-medium text-gray-600">Petitioner:</span>
                <p className="text-gray-900">{fetchedDetails.petitioner}</p>
              </div>
            )}
            {fetchedDetails.respondent && (
              <div>
                <span className="font-medium text-gray-600">Respondent:</span>
                <p className="text-gray-900">{fetchedDetails.respondent}</p>
              </div>
            )}
            {fetchedDetails.advocate && (
              <div>
                <span className="font-medium text-gray-600">Advocate:</span>
                <p className="text-gray-900">{fetchedDetails.advocate}</p>
              </div>
            )}
            {fetchedDetails.courtName && (
              <div>
                <span className="font-medium text-gray-600">Court:</span>
                <p className="text-gray-900">{fetchedDetails.courtName}</p>
              </div>
            )}
            {fetchedDetails.caseType && (
              <div>
                <span className="font-medium text-gray-600">Case Type:</span>
                <p className="text-gray-900">{fetchedDetails.caseType}</p>
              </div>
            )}
            {fetchedDetails.filingDate && (
              <div>
                <span className="font-medium text-gray-600">Filing Date:</span>
                <p className="text-gray-900">{fetchedDetails.filingDate}</p>
              </div>
            )}
            {fetchedDetails.actSection && (
              <div>
                <span className="font-medium text-gray-600">Act & Section:</span>
                <p className="text-gray-900">{fetchedDetails.actSection}</p>
              </div>
            )}
            {fetchedDetails.status && (
              <div>
                <span className="font-medium text-gray-600">Status:</span>
                <p className="text-gray-900">{fetchedDetails.status}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
