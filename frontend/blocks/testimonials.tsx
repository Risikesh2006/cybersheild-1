'use client'

import Image from 'next/image'
import { useRef } from 'react'
import { AnimatedGroup, AnimatedItem } from '@/components/ui/animated-group'
import { Card, CardContent } from '@/components/ui/card'
import { VariableProximity } from '@/components/ui/variable-proximity'

const testimonials = [
  {
    name: 'Avery Chen',
    role: 'Security Lead, Northstar',
    quote: 'CyberShield gave our team a training flow that feels polished enough for a premium SaaS rollout, but still serious enough for security readiness.',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Marcus Reed',
    role: 'Director of SecOps, Apex Security',
    quote: 'The adaptive scenarios and debriefs made our tabletop exercises much more useful than static slide decks ever did.',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Priya Nair',
    role: 'Enterprise Security Program Manager',
    quote: 'It is one of the few training products that feels beautiful, focused, and operationally valuable at the same time.',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80',
  },
]

export function Testimonials() {
  const headingContainerRef = useRef<HTMLHeadingElement | null>(null)

  return (
    <section className="saas-section" data-gsap="testimonials-section">
      <div className="saas-shell">
        <AnimatedGroup className="space-y-10" staggerChildren={0.12} disableAnimation>
          <AnimatedItem>
            <div className="max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-primary">Testimonials</p>
              <h2 ref={headingContainerRef} className="saas-heading mt-4" data-gsap="word-reveal">
                <VariableProximity
                  label="Loved by security teams that care about quality."
                  fromFontVariationSettings="'wght' 400, 'opsz' 9"
                  toFontVariationSettings="'wght' 1000, 'opsz' 40"
                  containerRef={headingContainerRef}
                  radius={100}
                  falloff="linear"
                />
              </h2>
              <p className="saas-subheading mt-5">The same design rules carry through every card, every surface, and every interaction.</p>
            </div>
          </AnimatedItem>

          <div className="grid gap-4 lg:grid-cols-3">
            {testimonials.map((item) => (
              <AnimatedItem key={item.name}>
                <Card className="group h-full transition-transform duration-300 hover:-translate-y-1" data-gsap="testimonial-card">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="relative h-12 w-12 overflow-hidden rounded-full border border-white/10">
                        <Image src={item.image} alt={item.name} fill sizes="48px" className="object-cover" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{item.name}</div>
                        <div className="text-sm text-muted-foreground">{item.role}</div>
                      </div>
                    </div>
                    <p className="mt-5 text-sm leading-7 text-muted-foreground sm:text-base">“{item.quote}”</p>
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