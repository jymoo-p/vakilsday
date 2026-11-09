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
      <div className="min-h-screen flex items-center justify-center bg-[#faf8ff]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004ac6] mx-auto"></div>
          <p className="mt-4 text-[#545f73] text-sm font-medium">Loading workspace...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#131b2e]">
      <Sidebar />
      <div className="md:pl-64">
        <Header />
        <main className="w-full pt-20 bg-[#faf8ff] min-h-screen pb-20 md:pb-12">
          <div className="w-full max-w-[1600px] mx-auto px-6 md:px-10 py-8">
            {children}
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
