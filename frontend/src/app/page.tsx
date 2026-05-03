import { Navbar } from '@/blocks/navbar'
import { HeroSection1 } from '@/blocks/hero-section-1'
import { TrustedBy } from '@/blocks/trusted-by'
import { Features } from '@/blocks/features'
import { HowItWorks } from '@/blocks/how-it-works'
import { ProductPreview } from '@/blocks/product-preview'
import { Testimonials } from '@/blocks/testimonials'
import { Pricing } from '@/blocks/pricing'
import { FAQ } from '@/blocks/faq'
import { CTA } from '@/blocks/cta'
import { Footer } from '@/blocks/footer'
import LineWaves from '@/src/components/LineWaves'
import { LandingAnimations } from '@/src/components/LandingAnimations'

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <LineWaves
        speed={0.3}
        innerLineCount={32}
        outerLineCount={36}
        warpIntensity={1}
        rotation={-45}
        edgeFadeWidth={0}
        colorCycleSpeed={1}
        brightness={0.2}
        color1="#00d4ff"
        color2="#00ffff"
        color3="#8b5cf6"
        enableMouseInteraction={true}
        mouseInfluence={2}
      />

      <main className="relative z-10 min-h-screen">
        <Navbar />
        <HeroSection1 />
        <TrustedBy />
        <Features />
        <HowItWorks />
        <ProductPreview />
        <Testimonials />
        <Pricing />
        <FAQ />
        <CTA />
        <Footer />
        <LandingAnimations />
      </main>
    </div>
  )
}
