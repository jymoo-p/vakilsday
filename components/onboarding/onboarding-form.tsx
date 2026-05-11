'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Scale } from 'lucide-react'

interface OnboardingFormProps {
  userName: string
  userEmail: string
}

export default function OnboardingForm({ userName, userEmail }: OnboardingFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    firmName: '',
    yourName: userName,
    city: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firmName: formData.firmName,
          userName: formData.yourName,
          userEmail: userEmail,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create organization')
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-lg shadow-xl">
      <CardHeader className="space-y-4 text-center">
        <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
          <Scale className="w-8 h-8 text-primary-foreground" />
        </div>
        <div>
          <CardTitle className="text-3xl font-bold">Welcome to VakilsDay</CardTitle>
          <CardDescription className="mt-2 text-base">
            Let's set up your law firm workspace
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="firmName">Law Firm Name *</Label>
            <Input
              id="firmName"
              placeholder="e.g., Shah & Associates"
              value={formData.firmName}
              onChange={(e) => setFormData({ ...formData, firmName: e.target.value })}
              required
            />
            <p className="text-sm text-muted-foreground">
              This will be visible to your team members
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="yourName">Your Name *</Label>
            <Input
              id="yourName"
              placeholder="Your full name"
              value={formData.yourName}
              onChange={(e) => setFormData({ ...formData, yourName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City (Optional)</Label>
            <Input
              id="city"
              placeholder="e.g., Mumbai"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> You will be set as the Admin of this workspace.
              You can invite associates and clerks later from Settings.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-900">{error}</p>
            </div>
          )}

          <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
            {loading ? 'Creating workspace...' : 'Create My Workspace'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Signed in as <strong>{userEmail}</strong>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
