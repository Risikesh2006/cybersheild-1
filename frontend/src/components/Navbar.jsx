'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Atom } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import Badge from './Badge'

export default function Navbar() {
  const { user, logout } = useAuth()
  const router = useRouter()

  function handleLogout() {
    logout()
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-4 sm:pt-4">
      <div className="mx-auto flex w-full max-w-[1160px] items-center justify-between gap-4 rounded-full border border-white/10 bg-[#171818]/92 px-4 py-3 shadow-[0_20px_80px_-30px_rgba(0,0,0,0.9)] backdrop-blur-2xl sm:px-5">
        <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-3 text-foreground">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-foreground shadow-[0_10px_30px_-18px_rgba(255,255,255,0.45)]">
            <Atom className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <span className="font-semibold tracking-tight text-[1.05rem] sm:text-[1.15rem]">
            Cyber<span className="text-primary">Shield</span>
          </span>
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Link href="/progress" className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground">Progress</Link>
              <Link href="/topics" className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground">Topics</Link>
              <Link href="/profile" className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground">Profile</Link>
              {user.user_type === 'enterprise' && user.is_admin && (
                <Link href="/enterprise" className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground">Admin</Link>
              )}
              <Badge variant="muted">{user.user_type}</Badge>
              <span className="px-2 text-sm text-muted-foreground">{user.name}</span>
              <button
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-white/10"
                onClick={handleLogout}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth" className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground">Sign in</Link>
              <Link href="/" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-white/10">Get started</Link>
            </>
          )}
        </div>

        {user ? (
          <div className="flex items-center gap-2 md:hidden">
            <Badge variant="muted">{user.user_type}</Badge>
            <button
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-white/10"
              onClick={handleLogout}
            >
              Sign out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 md:hidden">
            <Link href="/auth" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-white/10">Sign in</Link>
          </div>
        )}
      </div>
    </header>
  )
}
