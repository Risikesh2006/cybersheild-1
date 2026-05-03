'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Navbar from '@/src/components/Navbar'
import { useAuth } from '@/src/hooks/useAuth'

export default function AuthedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !user) router.push('/auth')
  }, [loading, user, router])

  if (loading || !user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6F6F6F' }}>
        Loading...
      </div>
    )
  }

  return (
    <>
      {pathname !== '/onboarding' && <Navbar />}
      {children}
    </>
  )
}
