'use client'

import Image from 'next/image'
import { CircleCheckBig, ShieldCheck, TimerReset } from 'lucide-react'
import { useRef } from 'react'
import { AnimatedGroup, AnimatedItem } from '@/components/ui/animated-group'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { VariableProximity } from '@/components/ui/variable-proximity'

const highlights = [
  { icon: ShieldCheck, label: 'Risk signals', value: '22 active' },
  { icon: CircleCheckBig, label: 'Successful responses', value: '94%' },
  { icon: TimerReset, label: 'Median response', value: '4m 12s' },
]

export function ProductPreview() {
  const headingContainerRef = useRef<HTMLHeadingElement | null>(null)

  return (
    <section className="saas-section">
      <div className="saas-shell">
        <AnimatedGroup className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center" staggerChildren={0.12}>
          <AnimatedItem>
            <div className="max-w-xl">
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-primary">Product preview</p>
              <h2 ref={headingContainerRef} className="saas-heading mt-4">
                <VariableProximity
                  label="A polished dashboard preview that feels like a real SaaS product."
                  fromFontVariationSettings="'wght' 400, 'opsz' 9"
                  toFontVariationSettings="'wght' 1000, 'opsz' 40"
                  containerRef={headingContainerRef}
                  radius={100}
                  falloff="linear"
                />
              </h2>
              <p className="saas-subheading mt-5">A calm surface, clear information hierarchy, and a dashboard-style image reinforce the same visual language used across the rest of the page.</p>

              <div className="mt-8 space-y-3">
                {highlights.map((item) => (
                  <div key={item.label} className="flex items-center gap-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/15">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">{item.label}</div>
                      <div className="text-sm text-muted-foreground">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedItem>

          <AnimatedItem>
            <div className="relative">
              <div className="hero-orb left-16 top-10 h-56 w-56 bg-primary/20" />
              <Card className="relative overflow-hidden p-4 sm:p-5">
                <div className="rounded-2xl border border-white/8 bg-background/80 p-3 shadow-[0_18px_55px_-30px_rgba(0,0,0,0.75)]">
                  <div className="relative aspect-[16/11] overflow-hidden rounded-2xl border border-white/8">
                    <Image
                      src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=80"
                      alt="CyberShield dashboard preview"
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover"
                      priority={false}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/15 to-transparent" />
                    <div className="absolute left-4 top-4 flex gap-2">
                      <Badge variant="accent">Live</Badge>
                      <Badge variant="outline">Training</Badge>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/10 bg-background/75 p-4 backdrop-blur-xl">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Team readiness</span>
                        <span className="font-medium text-foreground">82%</span>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-white/8">
                        <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-primary to-[#ff8c78]" />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </AnimatedItem>
        </AnimatedGroup>
      </div>
    </section>
  )
}