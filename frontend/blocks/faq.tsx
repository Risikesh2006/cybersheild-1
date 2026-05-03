'use client'

import { useRef } from 'react'
import { AnimatedGroup, AnimatedItem } from '@/components/ui/animated-group'
import { Accordion } from '@/components/ui/accordion'
import { VariableProximity } from '@/components/ui/variable-proximity'

const items = [
  {
    value: 'q1',
    title: 'Is the hero section redesigned?',
    content: 'No. The new landing page keeps the hero as the visual anchor and builds every other section to match its spacing, typography, and motion language.',
  },
  {
    value: 'q2',
    title: 'Does this use Tailwind and strict TypeScript?',
    content: 'Yes. The landing page and new primitives are written in strict TypeScript and styled with Tailwind utilities and semantic theme tokens.',
  },
  {
    value: 'q3',
    title: 'Will the page work well on mobile?',
    content: 'Yes. Every section uses a mobile-first layout and collapses into a stacked presentation where needed, including the navbar menu.',
  },
  {
    value: 'q4',
    title: 'Are images optimized?',
    content: 'Yes. Preview and testimonial imagery use next/image with remote patterns configured for Unsplash delivery.',
  },
]

export function FAQ() {
  const headingContainerRef = useRef<HTMLHeadingElement | null>(null)

  return (
    <section id="faq" className="saas-section">
      <div className="saas-shell">
        <AnimatedGroup className="space-y-10" staggerChildren={0.12}>
          <AnimatedItem>
            <div className="max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-primary">FAQ</p>
              <h2 ref={headingContainerRef} className="saas-heading mt-4">
                <VariableProximity
                  label="Everything stays clean, fast, and consistent."
                  fromFontVariationSettings="'wght' 400, 'opsz' 9"
                  toFontVariationSettings="'wght' 1000, 'opsz' 40"
                  containerRef={headingContainerRef}
                  radius={100}
                  falloff="linear"
                />
              </h2>
              <p className="saas-subheading mt-5">The FAQ uses the same surfaces, spacing, and motion tempo as the rest of the experience.</p>
            </div>
          </AnimatedItem>
          <AnimatedItem>
            <Accordion items={items} />
          </AnimatedItem>
        </AnimatedGroup>
      </div>
    </section>
  )
}