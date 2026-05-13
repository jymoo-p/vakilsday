'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Scale, Plus, Trash2, ArrowRight, Building2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface Court {
  name: string
}

export default function OnboardingCourtsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [courts, setCourts] = useState<Court[]>([])
  const [showForm, setShowForm] = useState(false)
  const [courtName, setCourtName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleAddCourt(e: React.FormEvent) {
    e.preventDefault()

    if (!user?.email) {
      toast.error('User not authenticated')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/courts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: courtName,
          userEmail: user.email,
        }),
      })

      if (response.ok) {
        setCourts([...courts, { name: courtName }])
        setCourtName('')
        setShowForm(false)
        toast.success('Court added')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to add court')
      }
    } catch (error) {
      console.error('Error adding court:', error)
      toast.error('Failed to add court')
    } finally {
      setLoading(false)
    }
  }

  function handleRemoveCourt(index: number) {
    setCourts(courts.filter((_, i) => i !== index))
  }

  function handleFinish() {
    toast.success('Welcome to VakilsDay!', {
      description: 'Your workspace is ready',
    })
    router.push('/cases')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="max-w-3xl w-full shadow-xl border-0">
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
              Map Your Jurisdiction!
            </h1>
            <p className="text-lg text-slate-600">
              Add the courts where you practice
            </p>
          </div>

          {/* Courts List */}
          {courts.length > 0 && (
            <div className="space-y-3 mb-6">
              {courts.map((court, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <p className="font-semibold text-slate-900">{court.name}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveCourt(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add Court Form */}
          {showForm ? (
            <form onSubmit={handleAddCourt} className="space-y-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="courtName">Court Name *</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="courtName"
                    value={courtName}
                    onChange={(e) => setCourtName(e.target.value)}
                    placeholder="e.g., Delhi High Court"
                    required
                    className="pl-11 h-12"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={loading}
                  className="gap-2 bg-slate-900 hover:bg-slate-800"
                >
                  <Plus className="h-4 w-4" />
                  {loading ? 'Adding...' : 'Add Court'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setCourtName('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <Button
              onClick={() => setShowForm(true)}
              variant="outline"
              className="w-full gap-2 mb-6 border-dashed border-2 h-12"
            >
              <Plus className="h-5 w-5" />
              Add Court
            </Button>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleFinish}
              className="flex-1 gap-2 bg-slate-900 hover:bg-slate-800 text-base py-6 h-auto"
              size="lg"
            >
              {courts.length > 0 ? 'Finish Setup' : 'Skip for Now'}
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>

          <p className="text-sm text-slate-500 text-center mt-4">
            You can add more courts anytime from Settings
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
