'use client'

import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef } from 'react'
import { AnimatedGroup, AnimatedItem } from '@/components/ui/animated-group'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { VariableProximity } from '@/components/ui/variable-proximity'

const metrics = [
  { value: '5+', label: 'AI agents' },
  { value: '10', label: 'security domains' },
  { value: '24/7', label: 'training available' },
]

export function HeroSection1() {
  const router = useRouter()
  const headingContainerRef = useRef<HTMLHeadingElement | null>(null)

  return (
    <section className="relative overflow-hidden pt-12 sm:pt-16 lg:pt-20" data-gsap="hero-section">
      <div className="hero-orb left-[-10rem] top-[-8rem] h-80 w-80 bg-primary/20" />
      <div className="hero-orb right-[-6rem] top-0 h-72 w-72 bg-white/5" />
      <div className="saas-shell relative z-10">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          <AnimatedGroup className="max-w-2xl" staggerChildren={0.12} disableAnimation>
            <AnimatedItem>
              <Badge variant="default" className="mb-6" data-gsap-hero>
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                Agentic training for modern defenders
              </Badge>
            </AnimatedItem>

            <AnimatedItem>
              <h1
                ref={headingContainerRef}
                className="font-display text-5xl font-semibold tracking-tight text-foreground sm:text-6xl lg:text-7xl"
                data-gsap-hero
              >
                <VariableProximity
                  label="Train your team to think like elite defenders."
                  className="leading-[1.02]"
                  fromFontVariationSettings="'wght' 400, 'opsz' 9"
                  toFontVariationSettings="'wght' 1000, 'opsz' 40"
                  containerRef={headingContainerRef}
                  radius={100}
                  falloff="linear"
                />
              </h1>
            </AnimatedItem>

            <AnimatedItem>
              <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground sm:text-xl" data-gsap-hero>
                CyberShield turns incident response into a premium SaaS learning experience with adaptive AI scenarios, measurable progress, and a workflow your security team will actually use.
              </p>
            </AnimatedItem>

            <AnimatedItem>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row" data-gsap-hero>
                <Button size="lg" onClick={() => router.push('/auth')}>
                  Start training
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" size="lg" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                  Explore features
                </Button>
              </div>
            </AnimatedItem>

            <AnimatedItem>
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {metrics.map((metric) => (
                  <Card key={metric.label} className="p-5">
                    <div className="text-3xl font-semibold tracking-tight text-foreground" data-gsap="counter" data-value={metric.value}>{metric.value}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{metric.label}</div>
                  </Card>
                ))}
              </div>
            </AnimatedItem>
          </AnimatedGroup>

          <AnimatedGroup className="relative" disableAnimation>
            <AnimatedItem>
              <Card className="relative overflow-hidden p-5 sm:p-6">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,96,68,0.22),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_35%)]" />
                <div className="relative rounded-2xl border border-white/8 bg-background/75 p-4 backdrop-blur-xl sm:p-5">
                  <div className="flex items-center justify-between border-b border-white/8 pb-4">
                    <div>
                      <div className="text-sm font-medium text-foreground">Live training snapshot</div>
                      <div className="text-xs text-muted-foreground">Session progress and team readiness</div>
                    </div>
                    <Badge variant="accent" className="gap-2">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Secure
                    </Badge>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-border bg-surface-elevated p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Detection score</div>
                      <div className="mt-3 text-4xl font-semibold tracking-tight text-foreground" data-gsap="counter" data-value="92%">92%</div>
                      <div className="mt-2 text-sm text-muted-foreground">Improving across every scenario family.</div>
                    </div>
                    <div className="rounded-2xl border border-border bg-surface-elevated p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Active scenarios</div>
                      <div className="mt-3 text-4xl font-semibold tracking-tight text-foreground" data-gsap="counter" data-value="18">18</div>
                      <div className="mt-2 text-sm text-muted-foreground">From phishing to cloud incidents.</div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Scenario confidence</span>
                      <span className="text-foreground">High</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/6">
                      <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-primary to-[#ff8c78]" />
                    </div>
                  </div>
                </div>
              </Card>
            </AnimatedItem>
          </AnimatedGroup>
        </div>
      </div>
    </section>
  )
}