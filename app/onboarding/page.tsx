import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import OnboardingForm from '@/components/onboarding/onboarding-form'

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user?.email) {
    redirect('/auth/signin')
  }

  // Check if user already has an organization
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { organization: true },
  })

  if (user?.organizationId) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <OnboardingForm userName={session.user.name || ''} userEmail={session.user.email} />
    </div>
  )
}
