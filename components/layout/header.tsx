'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { signOutGoogle } from '@/lib/firebase-auth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu'
import { LogOut, User, Settings, CheckSquare } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'

export function Header() {
  const { user } = useAuth()
  const router = useRouter()
  const [organizationName, setOrganizationName] = useState<string | null>(null)
  const [primaryCourt, setPrimaryCourt] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchHeaderMeta() {
      if (!user?.email) return

      try {
        const [onboardingRes, courtsRes] = await Promise.all([
          fetch(`/api/onboarding/status?email=${encodeURIComponent(user.email)}`),
          fetch(`/api/courts?email=${encodeURIComponent(user.email)}`),
        ])
        if (onboardingRes.ok) {
          const data = await onboardingRes.json()
          if (data.organizationName) {
            setOrganizationName(data.organizationName)
          }
        }
        if (courtsRes.ok) {
          const courtsData = await courtsRes.json()
          if (courtsData.courts?.length > 0) {
            setPrimaryCourt(courtsData.courts[0].name)
          }
        }
      } catch (error) {
        console.error('Failed to fetch header metadata:', error)
      }
    }

    fetchHeaderMeta()
  }, [user])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!searchQuery.trim() || !user?.email) {
        setSearchResults([])
        return
      }
      try {
        const res = await fetch(
          `/api/cases?email=${encodeURIComponent(user.email)}&search=${encodeURIComponent(searchQuery.trim())}`
        )
        if (res.ok) {
          const data = await res.json()
          setSearchResults((data.cases || []).slice(0, 5))
        }
      } catch {
        // ignore
      }
    }, 220)

    return () => clearTimeout(timer)
  }, [searchQuery, user?.email])

  async function handleSignOut() {
    await signOutGoogle()
    router.push('/signin')
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'JS'
    return name
      .replace(/^Adv\.?\s*/i, '')
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatAdvocateName = (name: string | null | undefined) => {
    if (!name) return 'Advocate'
    if (/^adv\.?\s/i.test(name)) return name
    return `Adv. ${name}`
  }

  return (
    <header className="fixed top-0 left-0 md:left-64 right-0 h-20 bg-[#faf8ff]/80 backdrop-blur-md border-b border-[#c3c6d7]/30 z-40">
      <div className="w-full max-w-[1600px] mx-auto h-full flex items-center justify-between px-6 md:px-10">
      {/* Search Bar */}
      <div ref={searchRef} className="relative flex items-center gap-4">
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-3.5 text-[#737686] text-[20px] pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setShowSearchDropdown(true)
            }}
            onFocus={() => setShowSearchDropdown(true)}
            placeholder="Search CNR, case title, court hall..."
            className="w-64 sm:w-96 lg:w-[30rem] h-11 pl-11 pr-4 bg-white text-[#131b2e] placeholder:text-[#737686] text-sm md:text-base rounded-lg border border-[#c3c6d7]/40 focus:border-[#2563eb] focus:outline-none transition-colors"
          />
        </div>

        {showSearchDropdown && searchQuery.trim().length > 0 && (
          <div className="absolute left-0 top-12 w-full sm:w-96 bg-white rounded-xl border border-[#c3c6d7]/40 shadow-lg py-2 z-50">
            {searchResults.length > 0 ? (
              searchResults.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setShowSearchDropdown(false)
                    setSearchQuery('')
                    router.push(`/cases/${c.id}`)
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#f2f3ff] flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#131b2e] truncate">{c.caseNumber}</p>
                    <p className="text-xs text-[#545f73] truncate">
                      {c.client ? `${c.client.firstName} ${c.client.lastName || ''}` : 'Client'} v.{' '}
                      {c.opponentMainParty}
                    </p>
                  </div>
                  {c.court?.name && (
                    <span className="text-[11px] font-medium text-[#545f73] bg-[#f2f3ff] px-2 py-0.5 rounded shrink-0">
                      {c.court.name}
                    </span>
                  )}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-xs text-[#545f73] text-center">
                No matching cases found.{' '}
                <Link
                  href="/cases"
                  onClick={() => setShowSearchDropdown(false)}
                  className="text-[#004ac6] font-semibold hover:underline"
                >
                  Browse all cases
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Side: Notifications + User Profile */}
      <div className="flex items-center gap-5">
        <Link
          href="/tasks"
          className="relative p-2 rounded-lg text-[#545f73] hover:bg-[#f2f3ff] hover:text-[#131b2e] transition-colors"
          title="Notifications & Deadlines"
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#2563eb]"></span>
        </Link>

        <div className="h-6 w-[1px] bg-[#c3c6d7]/40 hidden sm:block"></div>

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={(props) => (
                <button
                  {...props}
                  className="flex items-center gap-3 rounded-lg py-1 px-1.5 hover:bg-[#f2f3ff]/60 focus:outline-none transition-colors cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-[#2563eb]/10 text-[#2563eb] font-semibold flex items-center justify-center text-sm">
                    {getInitials(user.displayName)}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-sm md:text-base font-semibold text-[#131b2e] leading-tight">
                      {formatAdvocateName(user.displayName)}
                    </span>
                    <span className="text-xs md:text-sm text-[#545f73] leading-none mt-0.5 truncate max-w-[180px]">
                      {primaryCourt || organizationName || 'High Court of Delhi'}
                    </span>
                  </div>
                </button>
              )}
            />
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/profile')}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/tasks')}>
                <CheckSquare className="mr-2 h-4 w-4" />
                Tasks & Deadlines
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/settings')}>
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
