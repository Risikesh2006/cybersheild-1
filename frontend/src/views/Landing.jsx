'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import LineWaves from '../components/LineWaves'

const USER_TYPES = [
  {
    id: 'student',
    icon: '🎓',
    label: 'Student',
    desc: 'Learning cybersecurity fundamentals. Foundational scenarios with educational feedback.',
  },
  {
    id: 'professional',
    icon: '💼',
    label: 'Professional',
    desc: 'Working in tech or IT. Operational scenarios with expert-level analysis.',
  },
  {
    id: 'enterprise',
    icon: '🏢',
    label: 'Enterprise Team',
    desc: 'Training a security team. Complex scenarios with process and communication evaluation.',
  },
]

const FEATURES = [
  { icon: '🤖', title: 'Agentic AI', desc: '5 specialized AI agents adapt every session to your skill level.' },
  { icon: '📊', title: 'Progress Tracking', desc: 'Cross-session analysis shows patterns, not just scores.' },
  { icon: '🎯', title: 'Scenario Depth', desc: 'All 4 options are defensible. The challenge is finding the optimal one.' },
  { icon: '🛡️', title: 'Blue Team Focus', desc: 'Real-world incident response scenarios across 10 security domains.' },
]

export default function Landing() {
  const [selectedType, setSelectedType] = useState(null)
  const router = useRouter()

  function handleGetStarted() {
    if (!selectedType) return
    sessionStorage.setItem('cs_selected_type', selectedType)
    router.push('/auth')
  }

  function handleLearnMore() {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="relative min-h-screen" style={{ background: '#121313' }}>
      <LineWaves
        speed={0.3}
        innerLineCount={32}
        outerLineCount={36}
        warpIntensity={1}
        rotation={-45}
        edgeFadeWidth={0}
        colorCycleSpeed={1}
        brightness={0.2}
        color1="#FFFFFF"
        color2="#D9D9D9"
        color3="#BFBFBF"
        enableMouseInteraction={true}
        mouseInfluence={2}
      />

      <div className="relative z-10">
      {/* Minimal Landing Navbar */}
      <nav style={{
        height: 56, display: 'flex', alignItems: 'center',
        padding: '0 24px', borderBottom: '1px solid #343636',
        position: 'sticky', top: 0, background: '#121313', zIndex: 100,
      }}>
        <span style={{ fontFamily: '"IBM Plex Mono"', fontSize: 15, fontWeight: 600, color: '#F3F1EF' }}>
          Cyber<span style={{ color: '#FFFFFF' }}>Shield</span>
        </span>
        <div style={{ flex: 1 }} />
        <Link href="/auth" className="btn btn-secondary btn-sm">Login</Link>
      </nav>

      {/* Hero Section */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '64px 24px 40px', textAlign: 'center', maxWidth: 640, margin: '0 auto',
      }}>
        <span className="badge badge-accent" style={{ marginBottom: 20 }}>
          Cybersecurity Training Platform
        </span>

        <h1 style={{ fontSize: 40, fontWeight: 600, color: '#F3F1EF', marginBottom: 12, letterSpacing: '-0.02em' }}>
          CyberShield
        </h1>

        <p style={{ fontSize: 18, color: '#A3A3A3', marginBottom: 12, fontFamily: '"IBM Plex Sans"' }}>
          AI-powered Blue Team training for real-world defense
        </p>

        <p className="prose" style={{ fontSize: 14, marginBottom: 40 }}>
          Practice incident response decisions across 10 security domains,
          guided by 5 specialized AI agents that adapt to your skill level and learning patterns.
        </p>

        {/* User Type Cards */}
        <div style={{ width: '100%', display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
          {USER_TYPES.map(ut => (
            <div
              key={ut.id}
              onClick={() => setSelectedType(ut.id)}
              style={{
                flex: '1 1 160px',
                padding: '20px 16px',
                borderRadius: 8,
                border: `1px solid ${selectedType === ut.id ? '#FFFFFF' : '#343636'}`,
                background: selectedType === ut.id ? '#232424' : '#181919',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'border-color 150ms ease, background 150ms ease',
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>{ut.icon}</div>
              <div style={{ fontWeight: 600, color: '#F3F1EF', marginBottom: 6, fontSize: 14 }}>{ut.label}</div>
              <div style={{ fontSize: 12, color: '#A3A3A3', lineHeight: 1.5, fontFamily: '"IBM Plex Sans"' }}>{ut.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, width: '100%' }}>
          <button
            className="btn btn-primary btn-full"
            disabled={!selectedType}
            onClick={handleGetStarted}
          >
            Get Started
          </button>
          <button
            className="btn btn-secondary btn-full"
            onClick={handleLearnMore}
          >
            Learn More
          </button>
        </div>
      </div>

      {/* Features Grid */}
      <div id="features" style={{ padding: '48px 24px', maxWidth: 640, margin: '0 auto' }}>
        <div className="divider" style={{ marginBottom: 48 }} />
        <div className="section-label" style={{ textAlign: 'center', marginBottom: 24 }}>
          Platform Features
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {FEATURES.map(f => (
            <div key={f.title} className="card-sm">
              <div style={{ fontSize: 22, marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontWeight: 600, color: '#F3F1EF', marginBottom: 4, fontSize: 13 }}>{f.title}</div>
              <div style={{ fontSize: 12, color: '#A3A3A3', fontFamily: '"IBM Plex Sans"', lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  )
}
