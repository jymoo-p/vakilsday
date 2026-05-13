'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { MobileNav } from '@/components/layout/mobile-nav'

export default function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [checkingOnboarding, setCheckingOnboarding] = useState(true)

  useEffect(() => {
    async function checkOnboardingStatus() {
      if (!loading && !user) {
        router.push('/signin')
        return
      }

      if (!loading && user?.email) {
        try {
          const response = await fetch(`/api/onboarding/status?email=${encodeURIComponent(user.email)}`)
          if (response.ok) {
            const data = await response.json()
            if (data.needsOnboarding) {
              router.push('/onboarding/welcome')
              return
            }
          }
        } catch (error) {
          console.error('Error checking onboarding:', error)
        } finally {
          setCheckingOnboarding(false)
        }
      }
    }

    checkOnboardingStatus()
  }, [user, loading, router])

  if (loading || checkingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-slate-900 mx-auto"></div>
          <p className="mt-6 text-slate-600 text-lg font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="md:pl-72 flex flex-col flex-1">
        <Header />
        <main className="flex-1 pb-20 md:pb-0">
          <div className="py-8 px-6 sm:px-8 lg:px-12">
            {children}
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
