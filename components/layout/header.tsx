'use client'

import { useState, useEffect } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { LogOut, User } from 'lucide-react'

export function Header() {
  const { user } = useAuth()
  const router = useRouter()
  const [userRole, setUserRole] = useState<string>('ASSOCIATE')

  useEffect(() => {
    async function fetchUserRole() {
      if (user?.email) {
        const response = await fetch(`/api/users/${encodeURIComponent(user.email)}`)
        if (response.ok) {
          const data = await response.json()
          setUserRole(data.user?.role || 'ASSOCIATE')
        }
      }
    }
    fetchUserRole()
  }, [user])

  async function handleSignOut() {
    await signOutGoogle()
    router.push('/signin')
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-500 hover:bg-red-600'
      case 'ASSOCIATE':
        return 'bg-blue-500 hover:bg-blue-600'
      case 'CLERK':
        return 'bg-green-500 hover:bg-green-600'
      default:
        return 'bg-gray-500 hover:bg-gray-600'
    }
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
    <header className="bg-card border-b border-border sticky top-0 z-10">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          {user && (
            <>
              <Badge className={getRoleBadgeColor(userRole)}>
                {userRole}
              </Badge>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full" />
                  }
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(user.displayName)}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.displayName}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    Profile
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
            </>
          )}
        </div>
      </div>
    </header>
  )
}
