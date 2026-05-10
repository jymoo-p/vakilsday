'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'Configuration':
        return 'There is a problem with the server configuration.'
      case 'AccessDenied':
        return 'You do not have permission to sign in.'
      case 'Verification':
        return 'The verification link may have expired or already been used.'
      default:
        return 'An error occurred during authentication.'
    }
  }

  return (
    <Card className="shadow-xl border-destructive">
      <CardHeader className="space-y-4 text-center">
        <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <div>
          <CardTitle className="text-2xl font-bold">Authentication Error</CardTitle>
          <CardDescription className="mt-2 text-base">
            {getErrorMessage(error)}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button render={<Link href="/signin" />} className="w-full" size="lg">
          Try Again
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          If the problem persists, please contact support.
        </p>
      </CardContent>
    </Card>
  )
}

export default function ErrorPage() {
  return (
    <Suspense fallback={
      <Card className="shadow-xl border-destructive">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">Loading...</CardTitle>
        </CardHeader>
      </Card>
    }>
      <ErrorContent />
    </Suspense>
  )
}
