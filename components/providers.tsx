'use client'

import { AuthProvider } from '@/lib/hooks/useAuth'
import { Toaster } from 'sonner'
import { CheckCheck } from 'lucide-react'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster
        position="top-center"
        richColors
        icons={{
          success: <CheckCheck className="h-5 w-5" />,
        }}
      />
    </AuthProvider>
  )
}
