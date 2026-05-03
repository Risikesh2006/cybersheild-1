'use client'

import { ArrowRight, BrainCircuit, PlayCircle, ShieldAlert, Sparkles } from 'lucide-react'
import { useRef } from 'react'
import { AnimatedGroup, AnimatedItem } from '@/components/ui/animated-group'
import { Card, CardContent } from '@/components/ui/card'
import { VariableProximity } from '@/components/ui/variable-proximity'

const steps = [
  { icon: PlayCircle, title: 'Start a session', description: 'Pick a training path or let the system suggest the best next challenge.' },
  { icon: BrainCircuit, title: 'Analyze the situation', description: 'Read the scenario, understand the tradeoffs, and evaluate every defensible option.' },
  { icon: ShieldAlert, title: 'Respond decisively', description: 'Choose the response that protects the environment without compromising the investigation.' },
  { icon: Sparkles, title: 'Review and improve', description: 'See AI-generated debriefs that explain the why behind each decision.' },
]

export function HowItWorks() {
  const headingContainerRef = useRef<HTMLHeadingElement | null>(null)

  return (
    <section id="how-it-works" className="saas-section">
      <div className="saas-shell">
        <AnimatedGroup className="space-y-10" staggerChildren={0.12}>
          <AnimatedItem>
            <div className="max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-primary">How it works</p>
              <h2 ref={headingContainerRef} className="saas-heading mt-4">
                <VariableProximity
                  label="A clear flow from onboarding to better decisions."
                  fromFontVariationSettings="'wght' 400, 'opsz' 9"
                  toFontVariationSettings="'wght' 1000, 'opsz' 40"
                  containerRef={headingContainerRef}
                  radius={100}
                  falloff="linear"
                />
              </h2>
              <p className="saas-subheading mt-5">The journey stays simple: start, assess, respond, debrief. The experience feels structured and calm even when the scenario is not.</p>
            </div>
          </AnimatedItem>

          <div className="grid gap-4 lg:grid-cols-4">
            {steps.map((step, index) => (
              <AnimatedItem key={step.title}>
                <Card className="relative h-full overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/15">
                        <step.icon className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">0{index + 1}</span>
                    </div>
                    <h3 className="mt-6 text-lg font-semibold text-foreground">{step.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">{step.description}</p>
                    {index < steps.length - 1 ? <ArrowRight className="mt-5 h-4 w-4 text-primary/80" /> : null}
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