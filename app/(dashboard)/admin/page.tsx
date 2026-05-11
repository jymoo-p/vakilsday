'use client'

import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Scale, Shield, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'

export default function AdminPage() {
  const { user } = useAuth()
  const [userRole, setUserRole] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserRole()
  }, [user])

  async function fetchUserRole() {
    if (!user?.email) return

    try {
      const response = await fetch(`/api/users/${encodeURIComponent(user.email)}`)
      if (response.ok) {
        const data = await response.json()
        setUserRole(data.user?.role || '')
      }
    } catch (err) {
      console.error('Error fetching user role:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-600">Loading...</p>
      </div>
    )
  }

  if (userRole !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center py-12">
        <Card>
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-slate-400" />
            <p className="text-lg text-slate-600">Admin access required</p>
            <p className="text-base text-slate-500 mt-2">Only admins can access this section</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Admin</h2>
          <p className="text-lg text-slate-600">Manage system settings and configurations</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/courts">
          <Card className="hover:bg-slate-50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Courts</CardTitle>
              </div>
              <CardDescription className="mt-3">
                Manage court names used in case creation
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/case-types">
          <Card className="hover:bg-slate-50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Scale className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Case Types</CardTitle>
              </div>
              <CardDescription className="mt-3">
                Manage case type categories for organization
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/roles">
          <Card className="hover:bg-slate-50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Custom Roles</CardTitle>
              </div>
              <CardDescription className="mt-3">
                Create and manage custom access roles
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  )
}
