'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FolderOpen,
  Search,
  Settings,
  Scale,
  Users,
  Shield,
  UserCircle,
  Calendar,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Cases', href: '/cases', icon: FolderOpen },
  { name: 'Clients', href: '/clients', icon: UserCircle },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Research', href: '/research', icon: Search },
  { name: 'My Team', href: '/team', icon: Users },
  { name: 'Admin', href: '/admin', icon: Shield },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0">
      <div className="flex flex-col flex-grow border-r border-slate-200 bg-white pt-8 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-8 mb-12">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-900 shadow-lg">
            <Scale className="h-7 w-7 text-white" />
          </div>
          <span className="ml-4 text-2xl font-bold text-slate-900 tracking-tight">VakilsDay</span>
        </div>
        <nav className="flex-1 px-4 space-y-1.5">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center px-5 py-4 text-base font-medium rounded-xl transition-all',
                  isActive
                    ? 'bg-slate-100 text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <item.icon
                  className={cn(
                    'mr-4 flex-shrink-0 h-6 w-6',
                    isActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'
                  )}
                />
                {item.name}
              </Link>
            )
          })}
        </nav>
        <div className="flex-shrink-0 px-8 py-6 border-t border-slate-200">
          <p className="text-sm text-slate-500 font-medium">
            Built for Indian Lawyers
          </p>
        </div>
      </div>
    </div>
  )
}
