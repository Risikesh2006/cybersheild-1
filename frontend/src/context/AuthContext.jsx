'use client'

import { createContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [token, setToken] = useState(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('cs_token') || null
  })
  const [loading, setLoading] = useState(true)

  // Restore session from stored token
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      api.get('/auth/me')
        .then(res => {
          setUser(res.data.user)
          setProfile(res.data.profile)
        })
        .catch(() => {
          // Token invalid — clear it
          localStorage.removeItem('cs_token')
          setToken(null)
          delete api.defaults.headers.common['Authorization']
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, []) // only on mount

  const login = useCallback((tokenStr, userData, profileData) => {
    localStorage.setItem('cs_token', tokenStr)
    api.defaults.headers.common['Authorization'] = `Bearer ${tokenStr}`
    setToken(tokenStr)
    setUser(userData)
    setProfile(profileData)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('cs_token')
    delete api.defaults.headers.common['Authorization']
    setToken(null)
    setUser(null)
    setProfile(null)
  }, [])

  const refreshProfile = useCallback(async () => {
    try {
      const res = await api.get('/auth/me')
      setUser(res.data.user)
      setProfile(res.data.profile)
    } catch {
      // silently fail
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, profile, token, loading, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}
