'use client'

import { useContext } from 'react'
import { SessionContext } from '../context/SessionContext'

/**
 * Hook to access active training session state and actions.
 */
export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within SessionProvider')
  return ctx
}

export default useSession
