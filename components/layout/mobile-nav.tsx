'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import {
  LayoutDashboard,
  FolderOpen,
  UserCircle,
  Calendar,
  MoreHorizontal,
  Search,
  Users,
  Shield,
  Settings,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

const primaryNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Cases', href: '/cases', icon: FolderOpen },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Clients', href: '/clients', icon: UserCircle },
]

const moreNavigation = [
  { name: 'Research', href: '/research', icon: Search },
  { name: 'My Team', href: '/team', icon: Users },
  { name: 'Admin', href: '/admin', icon: Shield },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  return (
    <>
      {/* Bottom Navigation Bar - Fixed at bottom on mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-lg">
        <nav className="flex items-center justify-around px-2 py-2">
          {primaryNavigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-all min-w-[64px]',
                  isActive
                    ? 'text-slate-900'
                    : 'text-slate-500'
                )}
              >
                <item.icon
                  className={cn(
                    'h-6 w-6 mb-1',
                    isActive ? 'text-slate-900' : 'text-slate-500'
                  )}
                />
                <span className={cn(
                  'text-xs font-medium',
                  isActive ? 'text-slate-900' : 'text-slate-500'
                )}>
                  {item.name}
                </span>
              </Link>
            )
          })}

          {/* More Button */}
          <button
            onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-all min-w-[64px] text-slate-500"
          >
            <MoreHorizontal className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">More</span>
          </button>
        </nav>
      </div>

      {/* More Menu Sheet */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[80vh]">
          <SheetHeader>
            <SheetTitle>More Options</SheetTitle>
          </SheetHeader>
          <nav className="mt-6 space-y-2">
            {moreNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    'flex items-center px-4 py-3 rounded-lg transition-all',
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  )}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  )
}
