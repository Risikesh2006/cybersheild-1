'use client'

import Link from 'next/link'
import { AnimatedGroup, AnimatedItem } from '@/components/ui/animated-group'

const links = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
]

export function Footer() {
  return (
    <footer className="border-t border-white/6 py-10">
      <div className="saas-shell">
        <AnimatedGroup className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between" staggerChildren={0.08}>
          <AnimatedItem>
            <div>
              <div className="font-display text-lg font-semibold text-foreground">Cyber<span className="text-primary">Shield</span></div>
              <div className="mt-2 text-sm text-muted-foreground">Agentic cybersecurity training for modern teams.</div>
            </div>
          </AnimatedItem>
          <AnimatedItem>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {links.map((link) => (
                <Link key={link.href} href={link.href} className="transition-colors hover:text-foreground">{link.label}</Link>
              ))}
            </div>
          </AnimatedItem>
        </AnimatedGroup>
      </div>
    </footer>
  )
}