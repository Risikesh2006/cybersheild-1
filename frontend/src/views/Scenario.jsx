'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useSession } from '../hooks/useSession'
import LogFeed from '../components/LogFeed'
import OptionSelector from '../components/OptionSelector'
import SessionControls from '../components/SessionControls'
import Badge from '../components/Badge'
import { formatScore, verdictClass } from '../utils/helpers'
const TargetCursor = dynamic(() => import('@/components/TargetCursor'), { ssr: false })

export default function Scenario() {
  const {
    activeSession, currentScenario, sessionScore,
    scenarioIndex, totalScenarios,
    submitAnswer, advanceToNextScenario,
    pauseSession, calloffSession,
    lastEvaluation, isLastScenario, sessionNarrative,
  } = useSession()

  const router = useRouter()
  const [selected, setSelected] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const startTimeRef = useRef(Date.now())
  const containerRef = useRef(null)

  // If no active session, redirect
  useEffect(() => {
    if (!activeSession && !currentScenario) {
      router.push('/dashboard')
    }
  }, [activeSession, currentScenario, router])

  // Reset selection when scenario changes
  useEffect(() => {
    setSelected(null)
    setError('')
    startTimeRef.current = Date.now()
  }, [currentScenario?.id])

  // Navigate to feedback after submission
  useEffect(() => {
    if (lastEvaluation) {
      router.push('/feedback')
    }
  }, [lastEvaluation, router])

  if (!currentScenario) {
    return (
      <div className="page-offset">
        <div className="page-container" style={{ textAlign: 'center', paddingTop: 80 }}>
          <div style={{ color: '#A3A3A3', fontSize: 14 }}>Loading scenario…</div>
        </div>
      </div>
    )
  }

  async function handleSubmit() {
    if (!selected) return
    const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000)
    setSubmitting(true)
    setError('')
    try {
      await submitAnswer(currentScenario._db_id, selected, timeTaken)
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  async function handlePause(reason) {
    await pauseSession(reason)
    router.push('/dashboard')
  }

  async function handleCalloff() {
    await calloffSession()
    router.push('/dashboard')
  }

  const scenarioCompleted = scenarioIndex + 1
  const scenarioData = currentScenario

  return (
    <div className="page-offset">
      <div className="page-container" ref={containerRef} style={{ position: 'relative' }}>
        <TargetCursor
          targetSelector=".cursor-target, .card, .option-card"
          spinDuration={2}
          hideDefaultCursor
          hoverDuration={0.2}
          parallaxOn
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 28 }}>

          {/* ── Left: Scenario Content ───────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Top bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{
                color: sessionScore >= 0 ? '#BFBFBF' : '#FFFFFF',
                fontSize: 16, fontWeight: 600,
              }}>
                {formatScore(sessionScore)}
              </span>
              <span style={{ color: '#6F6F6F' }}>|</span>
              <span style={{ color: '#A3A3A3', fontSize: 13 }}>
                Scenario {scenarioCompleted} of {totalScenarios}
              </span>
              <Badge variant="accent">{scenarioData.topic}</Badge>
            </div>

            {/* Incident brief */}
            <div className="card cursor-target">
              <div style={{
                fontSize: 18, fontWeight: 600, color: '#F3F1EF',
                marginBottom: 12, fontFamily: '"IBM Plex Mono"',
              }}>
                {scenarioData.title}
              </div>
              <p className="prose" style={{ fontSize: 15, lineHeight: 1.7 }}>
                {scenarioData.description}
              </p>
            </div>

            {/* SIEM Log Feed */}
            <div>
              <div className="section-label">SIEM / EDR Logs</div>
              <LogFeed logs={scenarioData.logs || []} />
            </div>
            {/* Question prompt */}
            {scenarioData.question && (
              <div style={{
                padding: '14px 18px',
                borderRadius: 8,
                border: '1px solid #3A3A3A',
                background: 'rgba(79,142,247,0.05)',
                color: '#c0c8e8',
                fontSize: 14,
                lineHeight: 1.65,
                fontStyle: 'italic',
              }}>
                <span style={{ color: '#FFFFFF', fontWeight: 700, fontStyle: 'normal', marginRight: 6 }}>❯</span>
                {scenarioData.question}
              </div>
            )}
          </div>

          {/* ── Right: Options & Controls ────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="section-label" style={{ marginBottom: 0 }}>Choose Optimal Response</div>

            <OptionSelector
              options={scenarioData.options || []}
              selected={selected}
              onSelect={setSelected}
            />

            {error && <div className="form-error">{error}</div>}

            <button
              className="btn btn-primary btn-full cursor-target"
              disabled={!selected || submitting}
              onClick={handleSubmit}
            >
              {submitting ? 'Submitting…' : 'Submit Response'}
            </button>

            <div className="divider" />

            <SessionControls onPause={handlePause} onCalloff={handleCalloff} />
          </div>
        </div>
      </div>
    </div>
  )
}
