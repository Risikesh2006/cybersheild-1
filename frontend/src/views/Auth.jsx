'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'
import Particles from '@/components/ui/Particles'
import RoleCard from '@/components/RoleCard'

const USER_TYPES = [
  { id: 'student', label: 'Student', icon: '🎓' },
  { id: 'professional', label: 'Professional', icon: '💼' },
  { id: 'enterprise', label: 'Enterprise Team', icon: '🏢' },
]

export default function Auth() {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [userType, setUserType] = useState('student')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const { login, user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Redirect if already logged in
  useEffect(() => {
    if (user) router.push(user.onboarding_done ? '/dashboard' : '/onboarding')
  }, [user, router])

  // Complete Google OAuth callback on this page, persist the token, then continue to onboarding.
  useEffect(() => {
    const token = searchParams.get('token')
    const nextPath = searchParams.get('next') || '/onboarding'
    if (!token) return

    let cancelled = false
    async function finishGoogleLogin() {
      setGoogleLoading(true)
      try {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        const res = await api.get('/auth/me')
        if (cancelled) return
        login(token, res.data.user, res.data.profile)
        router.replace(nextPath)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setGoogleLoading(false)
      }
    }

    finishGoogleLogin()
    return () => {
      cancelled = true
    }
  }, [searchParams, login, router])

  useEffect(() => {
    const stored = sessionStorage.getItem('cs_selected_type')
    if (stored) setUserType(stored)
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'signup') {
        const res = await api.post('/auth/signup', { name, email, password, user_type: userType })
        login(res.data.access_token, res.data.user, res.data.profile)
        router.push('/onboarding')
      } else {
        const res = await api.post('/auth/login', { email, password })
        login(res.data.access_token, res.data.user, res.data.profile)
        router.push(res.data.user.onboarding_done ? '/dashboard' : '/onboarding')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleGoogleSignIn() {
    setError('')
    const nextPath = '/onboarding'
    window.location.href = `${api.defaults.baseURL}/auth/google/start?next=${encodeURIComponent(nextPath)}`
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0 z-0">
        <Particles
          particleColors={["#ffffff"]}
          particleCount={200}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={150}
          moveParticlesOnHover={true}
          alphaParticles={false}
          disableRotation={false}
          pixelRatio={1}
          particleHoverFactor={1.35}
          cameraDistance={16}
          sizeRandomness={0.7}
          className="h-full w-full"
        />
        <div className="pointer-events-none absolute inset-0 bg-black/15 backdrop-blur-[0.4px]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.42)_0%,rgba(0,0,0,0.84)_100%)]" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="fixed left-1/2 top-4 z-20 w-[calc(100%-1.5rem)] max-w-5xl -translate-x-1/2 rounded-full border border-white/15 bg-[#171818]/75 px-4 py-3 backdrop-blur-xl sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="text-lg font-semibold tracking-tight text-white">
              Cyber<span className="text-white/80">Shield</span>
            </Link>
            <nav className="hidden items-center gap-2 md:flex">
              <Link href="/" className="rounded-full px-4 py-2 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white">Home</Link>
              <Link href="/#features" className="rounded-full px-4 py-2 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white">Features</Link>
              <Link href="/#pricing" className="rounded-full px-4 py-2 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white">Pricing</Link>
              <Link href="/#how-it-works" className="rounded-full px-4 py-2 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white">How it works</Link>
            </nav>
            <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white">
              Sign in
            </span>
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center px-4 pb-10 pt-28 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="w-full max-w-xl rounded-[2rem] border border-white/15 bg-black/55 p-6 shadow-[0_30px_120px_-50px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:p-8"
          >
            <div className="mb-6 space-y-2 text-center">
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-white/50">
                Welcome users
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {mode === 'login' ? 'Sign in to continue' : 'Create your account to get started'}
              </h1>
              <p className="text-sm leading-6 text-white/65">
                {mode === 'login'
                  ? 'Use your account to keep your learning workflow moving.'
                  : 'Join the platform and select your role to begin.'}
              </p>
            </div>

            <div className="mb-6 flex gap-2 rounded-full border border-white/10 bg-white/5 p-1">
              {['login', 'signup'].map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setMode(m); setError('') }}
                  className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    mode === m
                      ? 'bg-white text-black'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {m === 'login' ? 'Login' : 'Sign Up'}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.form
                key={mode}
                initial={{ opacity: 0, x: mode === 'signup' ? 16 : -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: mode === 'signup' ? -16 : 16 }}
                transition={{ duration: 0.22 }}
                onSubmit={handleSubmit}
                className="flex flex-col gap-4"
              >
                {mode === 'signup' && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.08em] text-white/70">Name</label>
                    <input
                      className="w-full rounded-full border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/45 focus:border-white/45 focus:outline-none"
                      placeholder="Full name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="flex w-full items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
                  disabled={googleLoading}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-black">
                    G
                  </span>
                  {googleLoading ? 'Continuing with Google…' : 'Continue with Google'}
                </button>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.08em] text-white/70">Email</label>
                  <input
                    className="w-full rounded-full border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/45 focus:border-white/45 focus:outline-none"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.08em] text-white/70">Password</label>
                  <input
                    className="w-full rounded-full border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/45 focus:border-white/45 focus:outline-none"
                    type="password"
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>

                {mode === 'signup' && (
                  <div className="space-y-2">
                    <label className="flex items-center text-xs font-semibold uppercase tracking-[0.08em] text-white/70">
                      User Type
                      <Link href="/" className="ml-2 text-[11px] normal-case tracking-normal text-white underline underline-offset-2">change</Link>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {USER_TYPES.map(ut => (
                        <RoleCard
                          key={ut.id}
                          id={ut.id}
                          icon={ut.icon}
                          label={ut.label}
                          isSelected={userType === ut.id}
                          onSelect={setUserType}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {error && <div className="rounded-2xl border border-white/25 bg-white/10 px-4 py-3 text-sm text-white">{error}</div>}

                <button
                  type="submit"
                  className="mt-1 w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition-colors hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={loading}
                >
                  {loading
                    ? (mode === 'login' ? 'Signing in…' : 'Creating account…')
                    : (mode === 'login' ? 'Sign In' : 'Create Account')}
                </button>
              </motion.form>
            </AnimatePresence>
          </motion.div>
        </main>
      </div>
    </div>
  )
}
