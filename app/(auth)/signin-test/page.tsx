'use client'

import { useState } from 'react'
import { signInWithGoogle } from '@/lib/firebase-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Scale } from 'lucide-react'

export default function SignInTestPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>('')

  async function handleSignIn() {
    setLoading(true)
    setResult('')

    try {
      const res = await signInWithGoogle()

      if (res.ok) {
        setResult(`✅ SUCCESS!

Email: ${res.email}
Name: ${res.name}
UID: ${res.uid}

Firebase authentication works! Next step: Save to Prisma database.`)
      } else {
        setResult(`❌ ERROR: ${res.error}`)
      }
    } catch (error) {
      setResult(`❌ EXCEPTION: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Scale className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Firebase Auth Test</CardTitle>
            <CardDescription className="mt-2">
              Testing Firebase Google Sign-In for VakilsDay
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? 'Signing in...' : 'Sign In with Google (Firebase)'}
          </Button>

          {result && (
            <div className="p-4 rounded-lg bg-slate-100 border border-slate-200">
              <pre className="text-sm whitespace-pre-wrap">{result}</pre>
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <p>• This uses Firebase Authentication (like apartment_maintenance)</p>
            <p>• Completely separate Firebase project</p>
            <p>• No NextAuth, no OAuth callback issues</p>
            <p>• Client-side popup authentication</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
