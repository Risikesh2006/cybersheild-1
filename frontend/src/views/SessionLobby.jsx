'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '../hooks/useSession'
import api from '../services/api'

export default function SessionLobby() {
  const { startSession, continueExistingSession, calloffSession } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [existing, setExisting] = useState(null)
  const [loadingExisting, setLoadingExisting] = useState(true)
  const [continuing, setContinuing] = useState(false)
  const [ending, setEnding] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const r = await api.get('/session/active')
        if (!cancelled) setExisting(r.data?.session || null)
      } catch {
        if (!cancelled) setExisting(null)
      } finally {
        if (!cancelled) setLoadingExisting(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  async function handleBegin() {
    setLoading(true)
    setError('')
    try {
      await startSession()
      router.push('/scenario')
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  async function handleContinue() {
    setContinuing(true)
    setError('')
    try {
      const s = await continueExistingSession()
      if (s?.error === 'no_scenario') {
        setError('Could not load your current scenario. Try ending this session and starting a new one.')
        setContinuing(false)
        return
      }
      router.push('/scenario')
    } catch (err) {
      setError(err.message)
      setContinuing(false)
    }
  }

  async function handleEndSession() {
    if (!existing?.id) return
    if (!window.confirm('End this session? You can start a new one anytime. Partial progress may generate a short summary.')) return
    setEnding(true)
    setError('')
    try {
      await calloffSession(existing.id)
      setExisting(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setEnding(false)
    }
  }

  const hasInProgress = existing && ['active', 'paused'].includes(existing.status)

  return (
    <div className="page-offset">
      <div className="page-container" style={{ maxWidth: 600 }}>
        <h2 style={{ marginBottom: 8 }}>Session Preview</h2>
        <p className="prose" style={{ marginBottom: 32, fontSize: 14 }}>
          The AI curriculum planner has prepared a personalised session based on your skill profile.
          Review the plan below and begin when ready.
        </p>

        {error && <div className="form-error" style={{ marginBottom: 20 }}>{error}</div>}

        {loadingExisting ? (
          <div style={{ marginBottom: 24, color: '#A3A3A3', fontSize: 13 }}>Checking for an open session…</div>
        ) : hasInProgress ? (
          <div
            className="card"
            style={{
              marginBottom: 24,
              border: `1px solid ${existing.status === 'paused' ? '#D9D9D9' : '#FFFFFF'}`,
              background: 'rgba(79,142,247,0.06)',
            }}
          >
            <div className="section-label" style={{ marginBottom: 8 }}>
              {existing.status === 'paused' ? 'Paused session' : 'Session in progress'}
            </div>
            <p className="prose" style={{ fontSize: 14, marginBottom: 12 }}>
              <strong style={{ color: '#F3F1EF' }}>{existing.topic_focus}</strong>
              {typeof existing.scenarios_completed === 'number' && (
                <span style={{ color: '#A3A3A3' }}>
                  {' '}
                  · {existing.scenarios_completed} scenario(s) completed
                  {typeof existing.scenarios_remaining === 'number'
                    ? ` · ${existing.scenarios_remaining} remaining`
                    : ''}
                </span>
              )}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <button
                type="button"
                className="btn btn-primary"
                disabled={continuing || ending}
                onClick={handleContinue}
              >
                {continuing ? 'Loading…' : 'Continue session'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={continuing || ending}
                onClick={handleEndSession}
              >
                {ending ? 'Ending…' : 'End session'}
              </button>
            </div>
            <p className="prose" style={{ fontSize: 12, color: '#A3A3A3', marginTop: 14, marginBottom: 0 }}>
              Start a brand-new session only after you end this one (or finish all scenarios).
            </p>
          </div>
        ) : null}

        {/* Placeholder card while we haven't started */}
        <div className="card" style={{ marginBottom: 32 }}>
          <div className="section-label">What to Expect</div>
          <p className="prose" style={{ fontSize: 13, marginBottom: 16 }}>
            Your session will include 4–6 scenarios chosen from your selected topics, prioritising
            areas where your AI profile shows room for improvement.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <span className="badge badge-info">Adaptive Difficulty</span>
            <span className="badge badge-info">4 Options Per Scenario</span>
            <span className="badge badge-info">Instant AI Feedback</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={handleBegin}
            disabled={loading || continuing || ending || hasInProgress || loadingExisting}
            title={hasInProgress ? 'Continue or end your current session first' : undefined}
          >
            {loading ? 'Generating Session…' : 'Begin new session'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => router.push('/dashboard')}
            disabled={loading || continuing}
          >
            Back to Dashboard
          </button>
        </div>

        {loading && (
          <div style={{ marginTop: 20, color: '#A3A3A3', fontSize: 13 }}>
            ⏳ The AI is building your personalised curriculum. This may take 10–20 seconds…
          </div>
        )}
      </div>
    </div>
  )
}
