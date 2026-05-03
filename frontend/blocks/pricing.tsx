'use client'

import { Check, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef } from 'react'
import { AnimatedGroup, AnimatedItem } from '@/components/ui/animated-group'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { VariableProximity } from '@/components/ui/variable-proximity'

const plans = [
  {
    name: 'Starter',
    price: '$49',
    description: 'For small teams getting serious about readiness.',
    features: ['Training workflows', 'Basic analytics', 'Email support'],
  },
  {
    name: 'Growth',
    price: '$99',
    description: 'The most balanced option for active security programs.',
    popular: true,
    features: ['Everything in Starter', 'Adaptive scenarios', 'Progress dashboards', 'Team debriefs'],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large programs with multiple stakeholders.',
    features: ['Role-based access', 'Custom scenario packs', 'Dedicated onboarding', 'Priority support'],
  },
]

export function Pricing() {
  const router = useRouter()
  const headingContainerRef = useRef<HTMLHeadingElement | null>(null)

  return (
    <section id="pricing" className="saas-section">
      <div className="saas-shell">
        <AnimatedGroup className="space-y-10" staggerChildren={0.12}>
          <AnimatedItem>
            <div className="max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-primary">Pricing</p>
              <h2 ref={headingContainerRef} className="saas-heading mt-4">
                <VariableProximity
                  label="Three plans, one consistent design language."
                  fromFontVariationSettings="'wght' 400, 'opsz' 9"
                  toFontVariationSettings="'wght' 1000, 'opsz' 40"
                  containerRef={headingContainerRef}
                  radius={100}
                  falloff="linear"
                />
              </h2>
              <p className="saas-subheading mt-5">The pricing section mirrors the rest of the product: clean hierarchy, soft glow, and a clear default choice.</p>
            </div>
          </AnimatedItem>

          <div className="grid gap-4 lg:grid-cols-3">
            {plans.map((plan) => (
              <AnimatedItem key={plan.name}>
                <Card className={plan.popular ? 'relative overflow-hidden border-primary/30 bg-card shadow-[0_28px_80px_-45px_rgba(255,96,68,0.45)]' : 'relative overflow-hidden'}>
                  {plan.popular ? <div className="absolute right-4 top-4"><Badge variant="accent">Popular</Badge></div> : null}
                  <CardContent className="p-6">
                    <div className="text-sm font-medium uppercase tracking-[0.26em] text-muted-foreground">{plan.name}</div>
                    <div className="mt-4 flex items-end gap-2">
                      <div className="font-display text-5xl font-semibold tracking-tight text-foreground">{plan.price}</div>
                      <div className="pb-1 text-sm text-muted-foreground">/ month</div>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">{plan.description}</p>
                    <ul className="mt-6 space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3 text-sm text-foreground">
                          <Check className="mt-0.5 h-4 w-4 text-primary" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button className="mt-8 w-full" variant={plan.popular ? 'primary' : 'outline'} onClick={() => router.push('/auth')}>
                      Choose {plan.name}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </AnimatedItem>
            ))}
          </div>
        </AnimatedGroup>
      </div>
    </section>
  )
}