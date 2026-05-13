'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Scale, Building2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

export default function OnboardingWorkspacePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    firmName: '',
    slug: '',
  })
  const [loading, setLoading] = useState(false)

  function handleFirmNameChange(value: string) {
    setFormData({
      firmName: value,
      slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!user?.email) {
      toast.error('User not authenticated')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firmName: formData.firmName,
          userName: user.displayName || user.email,
          userEmail: user.email,
        }),
      })

      if (response.ok) {
        toast.success('Sustained!', {
          description: 'Your workspace has been created successfully',
        })
        router.push('/onboarding/team')
      } else {
        const data = await response.json()
        console.error('API error response:', data)
        toast.error(data.error || 'Failed to create workspace')
      }
    } catch (error) {
      console.error('Error creating workspace:', error)
      toast.error('Failed to create workspace. Check console for details.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-xl border-0">
        <CardContent className="p-8 md:p-12">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 shadow-lg">
              <Scale className="h-8 w-8 text-white" />
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              Establish your practice
            </h1>
            <p className="text-lg text-slate-600">
              Let's set up your law firm workspace
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="firmName" className="text-base font-semibold">
                Law Firm Name *
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="firmName"
                  value={formData.firmName}
                  onChange={(e) => handleFirmNameChange(e.target.value)}
                  placeholder="e.g., Sharma & Associates"
                  required
                  className="pl-11 h-12 text-base"
                />
              </div>
              <p className="text-sm text-slate-500">
                This will be the name of your workspace
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug" className="text-base font-semibold">
                Workspace URL
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-sm">vakilsday.com/</span>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="sharma-associates"
                  required
                  pattern="[a-z0-9-]+"
                  className="h-12 text-base"
                />
              </div>
              <p className="text-sm text-slate-500">
                Only lowercase letters, numbers, and hyphens
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading || !formData.firmName || !formData.slug}
              className="w-full gap-2 bg-slate-900 hover:bg-slate-800 text-base py-6 h-auto"
              size="lg"
            >
              {loading ? 'Creating...' : 'Create My Workspace'}
              <ArrowRight className="h-5 w-5" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
