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
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Cases', href: '/cases', icon: FolderOpen },
  { name: 'Research', href: '/research', icon: Search },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0">
      <div className="flex flex-col flex-grow border-r border-white/10 bg-black/40 backdrop-blur-xl pt-8 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-8 mb-12">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
            <Scale className="h-7 w-7 text-white" />
          </div>
          <span className="ml-4 text-2xl font-bold text-white tracking-tight">VakilsDay</span>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center px-5 py-4 text-base font-semibold rounded-2xl transition-all',
                  isActive
                    ? 'bg-white text-black shadow-lg scale-[1.02]'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                )}
              >
                <item.icon
                  className={cn(
                    'mr-4 flex-shrink-0 h-6 w-6',
                    isActive ? 'text-black' : 'text-white/70 group-hover:text-white'
                  )}
                />
                {item.name}
              </Link>
            )
          })}
        </nav>
        <div className="flex-shrink-0 px-8 py-6 border-t border-white/10">
          <p className="text-sm text-white/50 font-medium">
            Built for Indian Lawyers
          </p>
        </div>
      </div>
    </div>
  )
}
