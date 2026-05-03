'use client'

import { ChartColumnIncreasing, BrainCircuit, ShieldCheck, Sparkles, Workflow, Radar } from 'lucide-react'
import { useRef } from 'react'
import { AnimatedGroup, AnimatedItem } from '@/components/ui/animated-group'
import MagicBento from '@/components/ui/MagicBento'
import { VariableProximity } from '@/components/ui/variable-proximity'

const features = [
  { icon: ShieldCheck, title: 'Defender-first scenarios', description: 'Adaptive attack simulations built for blue-team judgment, triage, and containment.' },
  { icon: BrainCircuit, title: 'AI-guided feedback', description: 'Every action receives calibrated feedback that explains risk, tradeoffs, and consequences.' },
  { icon: ChartColumnIncreasing, title: 'Progress that compounds', description: 'Track readiness trends over time, not just isolated scores from a single session.' },
  { icon: Workflow, title: 'Structured training flow', description: 'From onboarding to debrief, the journey feels like a premium SaaS product.' },
  { icon: Radar, title: 'Coverage across domains', description: 'Practice network, cloud, endpoint, identity, and incident-response thinking in one place.' },
  { icon: Sparkles, title: 'Polished team experience', description: 'Glassy surfaces, confident typography, and frictionless navigation keep teams engaged.' },
]

export function Features() {
  const headingContainerRef = useRef<HTMLHeadingElement | null>(null)

  return (
    <section id="features" className="saas-section" data-gsap="features-section">
      <div className="saas-shell">
        <AnimatedGroup className="space-y-10" staggerChildren={0.12} disableAnimation>
          <AnimatedItem>
            <div className="max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-primary">Features</p>
              <h2 ref={headingContainerRef} className="saas-heading mt-4" data-gsap="word-reveal">
                <VariableProximity
                  label="A unified system for security training that feels premium."
                  fromFontVariationSettings="'wght' 400, 'opsz' 9"
                  toFontVariationSettings="'wght' 1000, 'opsz' 40"
                  containerRef={headingContainerRef}
                  radius={100}
                  falloff="linear"
                />
              </h2>
              <p className="saas-subheading mt-5">Everything here follows the same visual language: bold type, soft glow, rounded surfaces, and motion that supports the narrative instead of distracting from it.</p>
            </div>
          </AnimatedItem>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <AnimatedItem className="md:col-span-2 xl:col-span-3">
              <MagicBento
                className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
                items={features.map((feature) => ({
                  title: feature.title,
                  description: feature.description,
                  icon: <feature.icon className="h-5 w-5" />,
                }))}
                textAutoHide={true}
                enableStars
                enableSpotlight
                enableBorderGlow={true}
                enableTilt={false}
                enableMagnetism={false}
                clickEffect
                spotlightRadius={400}
                particleCount={12}
                glowColor="132, 0, 255"
                disableAnimations={false}
              />
            </AnimatedItem>
          </div>
        </AnimatedGroup>
      </div>
    </section>
  )
}