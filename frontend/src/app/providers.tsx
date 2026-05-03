'use client'

import { AuthProvider } from '@/src/context/AuthContext'
import { SessionProvider } from '@/src/context/SessionContext'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SessionProvider>{children}</SessionProvider>
    </AuthProvider>
  )
}
