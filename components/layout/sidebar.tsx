'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/hooks/useAuth'
import { useEffect, useState } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: 'grid_view' },
  { name: 'Cases', href: '/cases', icon: 'gavel' },
  { name: 'Clients', href: '/clients', icon: 'person_outline' },
  { name: 'Calendar', href: '/calendar', icon: 'calendar_today' },
  { name: 'Tasks', href: '/tasks', icon: 'task_alt' },
  { name: 'AI Assistant', href: '/ai-assistant', icon: 'neurology' },
  { name: 'Research', href: '/research', icon: 'menu_book' },
  { name: 'My Team', href: '/team', icon: 'groups' },
  { name: 'Admin', href: '/admin', icon: 'tune' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [organizationName, setOrganizationName] = useState<string>('Jai Associates')

  useEffect(() => {
    async function fetchOrg() {
      if (!user?.email) return
      try {
        const res = await fetch(`/api/onboarding/status?email=${encodeURIComponent(user.email)}`)
        if (res.ok) {
          const data = await res.json()
          if (data.organizationName) {
            setOrganizationName(data.organizationName)
          }
        }
      } catch {
        // ignore
      }
    }
    fetchOrg()
  }, [user])

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-white border-r border-[#c3c6d7]/30 z-50 flex-col justify-between">
      <div className="flex flex-col">
        {/* Top Brand Row */}
        <div className="h-20 px-6 flex items-center gap-3.5 border-b border-[#c3c6d7]/20">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563eb] to-[#004ac6] flex items-center justify-center shadow-xs shrink-0">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-white"
            >
              <path
                d="M6 4.5H18"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M12 19.5V8M12 8L8.5 11.5M12 8L15.5 11.5"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-lg font-bold text-[#131b2e] tracking-tight leading-none">
              VakilsDay
            </span>
            <span className="text-xs md:text-sm font-medium text-[#545f73] leading-none mt-1.5 truncate">
              {organizationName}
            </span>
          </div>
        </div>

        {/* Workspace Section Header */}
        <div className="px-6 pt-6 pb-2">
          <div className="text-xs font-bold tracking-wider uppercase text-[#737686]">
            Workspace
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 px-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3.5 px-4 py-2.5 rounded-lg transition-colors text-base',
                  isActive
                    ? 'bg-[#f2f3ff] text-[#004ac6] font-semibold'
                    : 'text-[#545f73] font-medium hover:bg-[#f2f3ff] hover:text-[#131b2e]'
                )}
              >
                <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Bottom Live Status */}
      <div className="p-4 border-t border-[#c3c6d7]/20">
        <div className="px-3.5 py-2.5 rounded-lg bg-[#f2f3ff]/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-sm font-medium text-[#545f73]">Indian Courts Online</span>
          </div>
          <span className="text-xs text-[#737686] font-semibold">Live</span>
        </div>
      </div>
    </aside>
  )
}
