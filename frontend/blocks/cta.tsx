'use client'

import { ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef } from 'react'
import { AnimatedGroup, AnimatedItem } from '@/components/ui/animated-group'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { VariableProximity } from '@/components/ui/variable-proximity'

export function CTA() {
  const router = useRouter()
  const headingContainerRef = useRef<HTMLHeadingElement | null>(null)

  return (
    <section className="saas-section" data-gsap="cta-section">
      <div className="saas-shell">
        <AnimatedGroup disableAnimation>
          <AnimatedItem>
            <Card className="relative overflow-hidden px-6 py-14 text-center sm:px-10 lg:px-16">
              <div className="hero-orb left-1/2 top-0 h-64 w-64 -translate-x-1/2 bg-primary/25" />
              <div className="relative mx-auto max-w-3xl">
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-primary" data-gsap-cta>Ready to begin?</p>
                <h2 ref={headingContainerRef} className="saas-heading mt-4" data-gsap="word-reveal" data-gsap-cta>
                  <VariableProximity
                    label="Bring a premium training experience to your security team."
                    fromFontVariationSettings="'wght' 400, 'opsz' 9"
                    toFontVariationSettings="'wght' 1000, 'opsz' 40"
                    containerRef={headingContainerRef}
                    radius={100}
                    falloff="linear"
                  />
                </h2>
                <p className="saas-subheading mx-auto mt-5" data-gsap-cta>Launch CyberShield and give your defenders a system that feels modern, focused, and easy to adopt.</p>
                <div className="mt-8 flex justify-center" data-gsap-cta>
                  <Button size="lg" onClick={() => router.push('/auth')}>
                    Start now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </AnimatedItem>
        </AnimatedGroup>
      </div>
    </section>
  )
}