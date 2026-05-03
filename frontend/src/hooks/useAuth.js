'use client'

import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

/**
 * Hook to access authentication state and actions.
 * Returns: { user, profile, token, loading, login, logout, refreshProfile }
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export default useAuth
