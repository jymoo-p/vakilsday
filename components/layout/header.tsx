'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { signOutGoogle } from '@/lib/firebase-auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, User, Settings } from 'lucide-react'
import { useEffect, useState } from 'react'

export function Header() {
  const { user } = useAuth()
  const router = useRouter()
  const [organizationName, setOrganizationName] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOrganizationName() {
      if (!user?.email) return

      try {
        const response = await fetch(`/api/onboarding/status?email=${encodeURIComponent(user.email)}`)
        if (response.ok) {
          const data = await response.json()
          if (data.organizationName) {
            setOrganizationName(data.organizationName)
          }
        }
      } catch (error) {
        console.error('Failed to fetch organization name:', error)
      }
    }

    fetchOrganizationName()
  }, [user])

  async function handleSignOut() {
    await signOutGoogle()
    router.push('/signin')
  }

  function goToProfile() {
    router.push('/profile')
  }

  function goToSettings() {
    router.push('/settings')
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="flex items-center justify-between h-16 px-8">
        {/* Law Firm Name */}
        <div className="flex-1 min-w-0">
          {organizationName && (
            <h2 className="text-lg font-semibold text-slate-900 truncate max-w-xs line-clamp-2">
              {organizationName}
            </h2>
          )}
        </div>

        {/* User Profile */}
        <div className="flex items-center space-x-4">
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 hover:bg-slate-100">
                  <Avatar className="h-10 w-10 ring-2 ring-slate-200">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                    <AvatarFallback className="bg-slate-100 text-slate-900 font-semibold text-sm">
                      {getInitials(user.displayName)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={goToProfile}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={goToSettings}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  )
}
