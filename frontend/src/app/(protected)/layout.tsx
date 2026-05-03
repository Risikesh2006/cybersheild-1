'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Navbar from '@/src/components/Navbar'
import Waves from '@/src/components/Waves'
import { useAuth } from '@/src/hooks/useAuth'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const currentUser = user as { onboarding_done?: boolean } | null
  const router = useRouter()
  const pathname = usePathname()
  const hideNavbar = pathname === '/profile'
  const isScenarioPage = pathname === '/scenario'

  useEffect(() => {
    if (loading) return
    if (!currentUser) {
      router.push('/auth')
      return
    }
    if (!currentUser.onboarding_done) {
      router.push('/onboarding')
    }
  }, [loading, currentUser, router])

  if (loading || !currentUser || !currentUser.onboarding_done) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6F6F6F' }}>
        Loading...
      </div>
    )
  }

  return (
    <div className={isScenarioPage ? 'protected-shell protected-shell-scenario' : 'protected-shell'}>
      {!isScenarioPage && (
        <Waves
          className="waves-background"
          lineColor="#ffffff"
          backgroundColor="rgba(255, 255, 255, 0.02)"
          waveSpeedX={0.01}
          waveSpeedY={0.01}
          waveAmpX={40}
          waveAmpY={20}
          friction={0.9}
          tension={0.01}
          maxCursorMove={120}
          xGap={12}
          yGap={36}
        />
      )}
      <div className="protected-shell-content">
        {!hideNavbar && <Navbar />}
        {children}
      </div>
    </div>
  )
}
