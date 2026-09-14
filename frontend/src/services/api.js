'use client'

import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
  timeout: 60000, // 60s for Claude API calls which can take time
  headers: { 'Content-Type': 'application/json' },
})

// Restore token from storage only in browser environments.
if (typeof window !== 'undefined') {
  const storedToken = localStorage.getItem('cs_token')
  if (storedToken) {
    api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
  }
}

// Response interceptor — surface backend error messages cleanly
api.interceptors.response.use(
  res => res,
  err => {
    const message =
      err.response?.data?.detail ||
      err.response?.data?.message ||
      err.message ||
      'An unexpected error occurred'
    return Promise.reject(new Error(message))
  }
)

export default api
