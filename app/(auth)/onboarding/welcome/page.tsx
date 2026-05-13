'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Scale, ArrowRight } from 'lucide-react'

export default function OnboardingWelcomePage() {
  const { user } = useAuth()
  const router = useRouter()

  const firstName = user?.displayName?.split(' ')[0] || 'Counselor'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-xl border-0">
        <CardContent className="p-8 md:p-12">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-900 shadow-lg">
              <Scale className="h-10 w-10 text-white" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 text-center mb-4">
            No Objections, {firstName}.
          </h1>

          {/* Message */}
          <p className="text-lg md:text-xl text-slate-600 text-center leading-relaxed mb-8">
            We have a deep respect for the work you do in service of justice.
            While you handle the heavy lifting in the courtroom, we'll be your{' '}
            <span className="font-semibold text-slate-900">
              'Friend of the Court'
            </span>{' '}
            behind the scenes.
          </p>

          {/* Proceed Button */}
          <div className="flex justify-center">
            <Button
              onClick={() => router.push('/onboarding/workspace')}
              className="gap-2 bg-slate-900 hover:bg-slate-800 text-base px-8 py-6 h-auto"
              size="lg"
            >
              Proceed
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Footer */}
          <p className="text-sm text-slate-500 text-center mt-8">
            Let's set up your practice in just a few steps
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
