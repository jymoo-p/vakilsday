'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import OnboardingForm from '@/components/onboarding/onboarding-form'

export default function OnboardingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [checkingOrg, setCheckingOrg] = useState(true)

  useEffect(() => {
    async function checkUser() {
      if (loading) return

      if (!user) {
        router.push('/signin')
        return
      }

      // Check if user already has an organization
      try {
        const response = await fetch(`/api/users/${user.email}`)
        if (response.ok) {
          const data = await response.json()
          if (data.user?.organizationId) {
            router.push('/dashboard')
            return
          }
        }
      } catch (error) {
        console.error('Error checking user organization:', error)
      }

      setCheckingOrg(false)
    }

    checkUser()
  }, [user, loading, router])

  if (loading || checkingOrg) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to signin
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <OnboardingForm
        userName={user.displayName || user.email || ''}
        userEmail={user.email || ''}
      />
    </div>
  )
}
