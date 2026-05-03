'use client'

import { AnimatedGroup, AnimatedItem } from '@/components/ui/animated-group'
import StarBorder from '@/components/ui/StarBorder'

const logos = ['Apex Security', 'Northstar', 'BlueCore', 'Sentinel Ops', 'Vertex One', 'Cloud Harbor']

export function TrustedBy() {
  return (
    <section className="saas-section pt-8">
      <div className="saas-shell">
        <AnimatedGroup className="space-y-8" staggerChildren={0.08}>
          <AnimatedItem>
            <p className="text-center text-xs uppercase tracking-[0.3em] text-muted-foreground">Trusted by teams that ship security programs</p>
          </AnimatedItem>
          <AnimatedItem>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {logos.map((logo) => (
                <StarBorder
                  key={logo}
                  as="div"
                  className="w-full rounded-full"
                  color="cyan"
                  speed="5s"
                  thickness={1.5}
                >
                  <div className="group rounded-2xl rounded-full border border-white/8 bg-white/[0.03] px-4 py-5 text-center text-sm font-medium text-muted-foreground transition-all duration-300 hover:border-primary/25 hover:bg-white/[0.05] hover:text-foreground">
                    {logo}
                  </div>
                </StarBorder>
              ))}
            </div>
          </AnimatedItem>
        </AnimatedGroup>
      </div>
    </section>
  )
}