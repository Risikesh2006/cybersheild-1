'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Atom, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { label: 'Home', href: '#' },
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'How it works', href: '#how-it-works' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-4 sm:pt-4">
      <div
        className={cn(
          'mx-auto w-full max-w-[1160px] rounded-full border border-white/10 px-4 py-3 backdrop-blur-2xl transition-all duration-300 sm:px-5',
          scrolled ? 'bg-[#171818]/92 shadow-[0_20px_80px_-30px_rgba(0,0,0,0.9)]' : 'bg-[#1a1b1c]/82 shadow-[0_20px_80px_-34px_rgba(0,0,0,0.75)]',
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 text-foreground">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-foreground shadow-[0_10px_30px_-18px_rgba(255,255,255,0.45)]">
              <Atom className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <span className="font-display text-[1.05rem] font-semibold tracking-tight sm:text-[1.15rem]">
              Cyber<span className="text-primary">Shield</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/auth"
              className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-white/10"
            >
              Sign in
            </Link>
          </div>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-foreground md:hidden"
            aria-label="Toggle navigation menu"
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0, filter: 'blur(8px)' }}
              animate={{ height: 'auto', opacity: 1, filter: 'blur(0px)' }}
              exit={{ height: 0, opacity: 0, filter: 'blur(8px)' }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden md:hidden"
            >
              <div className="pt-4">
                <div className="rounded-[1.75rem] border border-white/10 bg-[#171818]/95 p-3 shadow-[0_18px_60px_-30px_rgba(0,0,0,0.9)]">
                  <div className="flex flex-col gap-2">
                    {links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="rounded-2xl px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                        onClick={() => setMenuOpen(false)}
                      >
                        {link.label}
                      </Link>
                    ))}
                    <Link
                      href="/auth"
                      className="mt-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-medium text-foreground transition-colors hover:bg-white/10"
                      onClick={() => setMenuOpen(false)}
                    >
                      Sign in
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}