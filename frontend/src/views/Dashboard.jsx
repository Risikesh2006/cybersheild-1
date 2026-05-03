'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '../hooks/useAuth'
import { useSession } from '../hooks/useSession'
import NarrativeCard from '../components/NarrativeCard'
import XPBar from '../components/XPBar'
import ProgressRing from '../components/ProgressRing'
import api from '../services/api'
import { formatDate, formatScore } from '../utils/helpers'

export default function Dashboard() {
  const { user, profile } = useAuth()
  const { continueExistingSession, calloffSession } = useSession()
  const router = useRouter()
  const [dashData, setDashData] = useState(null)
  const [history, setHistory] = useState([])
  const [narrative, setNarrative] = useState(null)
  const [activeSession, setActiveSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [resuming, setResuming] = useState(false)
  const [ending, setEnding] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [dashRes, histRes, sessionRes] = await Promise.all([
          api.get('/progress/dashboard'),
          api.get('/progress/history'),
          api.get('/session/active'),
        ])
        setDashData(dashRes.data)
        setHistory(histRes.data || [])
        setActiveSession(sessionRes.data?.session || null)

        // Load latest narrative
        const completedSessions = histRes.data?.filter(s =>
          s.status === 'completed' || s.status === 'called_off'
        )
        if (completedSessions?.length > 0) {
          const lastSessionId = completedSessions[0].session_id
          try {
            const narRes = await api.get(`/progress/narrative?session_id=${lastSessionId}`)
            setNarrative(narRes.data)
          } catch { /* no narrative yet */ }
        }
      } catch { /* silently fail */ }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const topicMastery = dashData?.topic_mastery_list || []
  const overallCompletion = topicMastery.length > 0
    ? Math.round(topicMastery.reduce((sum, t) => sum + t.completion_percentage, 0) / topicMastery.length)
    : 0

  const weakAreas = dashData?.weak_areas || []

  return (
    <div className="dashboard-page">
      <div className="page-container dashboard-container dashboard-content">

        {/* In-progress session (active or paused) */}
        {(activeSession?.status === 'paused' || activeSession?.status === 'active') && (
          <div style={{
            background: '#181919',
            border: `1px solid ${activeSession.status === 'paused' ? '#D9D9D9' : '#FFFFFF'}`,
            borderRadius: 8,
            padding: '14px 20px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}>
            <div style={{
              color: activeSession.status === 'paused' ? '#D9D9D9' : '#BFBFBF',
              fontSize: 13,
            }}>
              {activeSession.status === 'paused' ? '⏸ Paused session' : '▶ Session in progress'}
              {' — '}
              <span style={{ color: '#F3F1EF' }}>{activeSession.topic_focus}</span>
              {typeof activeSession.scenarios_completed === 'number' && (
                <span style={{ color: '#A3A3A3', marginLeft: 8 }}>
                  ({activeSession.scenarios_completed} answered
                  {typeof activeSession.scenarios_remaining === 'number'
                    ? `, ${activeSession.scenarios_remaining} left`
                    : ''})
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary btn-sm"
                disabled={resuming || ending}
                onClick={async () => {
                  setResuming(true)
                  try {
                    const s = await continueExistingSession()
                    if (s?.error === 'no_scenario') {
                      alert('Could not load the current scenario. Try “End session” and start fresh, or return to the session lobby.')
                      setResuming(false)
                      return
                    }
                    router.push('/scenario')
                  } catch {
                    setResuming(false)
                  }
                }}
              >
                {resuming ? 'Loading…' : 'Continue session'}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                disabled={resuming || ending}
                onClick={async () => {
                  if (!window.confirm('End this session? Progress is saved; you’ll get a partial summary if you answered at least one scenario.')) return
                  setEnding(true)
                  try {
                    await calloffSession(activeSession.id)
                    setActiveSession(null)
                  } catch { /* ignore */ }
                  finally { setEnding(false) }
                }}
              >
                {ending ? 'Ending…' : 'End session'}
              </button>
            </div>
          </div>
        )}

        <div className="dashboard-main-grid">
          {/* ── Left Column ─────────────────────────────── */}
          <div className="dashboard-left">
            {/* Narrative card */}
            <NarrativeCard
              headline={narrative?.headline}
              narrative={narrative?.narrative}
              improvedTopics={narrative?.improved_topics || []}
              regressedTopics={narrative?.regressed_topics || []}
              stableTopics={narrative?.stable_topics || []}
            />

            {/* Session History */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #343636' }}>
                <div className="section-label" style={{ marginBottom: 0 }}>Recent Sessions</div>
              </div>
              {loading ? (
                <div style={{ padding: 20, color: '#6F6F6F', fontSize: 13 }}>Loading…</div>
              ) : history.length === 0 ? (
                <div style={{ padding: 20, color: '#6F6F6F', fontSize: 13 }}>No sessions yet.</div>
              ) : (
                <table className="cs-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Topics</th>
                      <th>Score</th>
                      <th>Accuracy</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.slice(0, 5).map(sess => (
                      <tr key={sess.session_id}>
                        <td>{formatDate(sess.started_at)}</td>
                        <td style={{ fontSize: 12, color: '#A3A3A3' }}>
                          {sess.topics_covered.slice(0, 2).join(', ')}
                          {sess.topics_covered.length > 2 && ` +${sess.topics_covered.length - 2}`}
                        </td>
                        <td>
                          <span style={{ color: sess.session_score >= 0 ? '#BFBFBF' : '#FFFFFF' }}>
                            {formatScore(sess.session_score)}
                          </span>
                        </td>
                        <td>{sess.accuracy}%</td>
                        <td>
                          <span className={`badge ${
                            sess.status === 'completed' ? 'badge-success' :
                            sess.status === 'paused' ? 'badge-warning' :
                            sess.status === 'called_off' ? 'badge-danger' : 'badge-info'
                          }`}>
                            {sess.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {history.length > 5 && (
                <div style={{ padding: '12px 20px', borderTop: '1px solid #343636' }}>
                  <Link href="/progress" style={{ color: '#FFFFFF', fontSize: 13 }}>View full history →</Link>
                </div>
              )}
            </div>
          </div>

          {/* ── Right Column ─────────────────────────────── */}
          <div className="dashboard-right">
            {/* Profile block */}
            <div className="card">
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#F3F1EF', marginBottom: 6 }}>
                  {user?.name}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span className="badge badge-accent">{user?.user_type}</span>
                  <span className="badge badge-info">{profile?.level || 'Beginner'}</span>
                </div>
              </div>
              <XPBar xp={profile?.xp || 0} level={profile?.level || 'Beginner'} />
            </div>

            {/* Stats block */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Total XP', value: Math.floor(profile?.xp || 0) },
                { label: 'Sessions', value: dashData?.total_sessions || 0 },
                { label: 'Scenarios', value: dashData?.total_scenarios || 0 },
                { label: 'Streak', value: dashData?.current_streak || 0 },
              ].map(s => (
                <div key={s.label} className="stat-cell">
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Topic coverage */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <ProgressRing percentage={overallCompletion} size={72} label="Coverage" />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#F3F1EF', marginBottom: 4 }}>
                    Topic Coverage
                  </div>
                  <div style={{ fontSize: 12, color: '#A3A3A3' }}>
                    {topicMastery.length} topics tracked
                  </div>
                </div>
              </div>
              {weakAreas.length > 0 && (
                <>
                  <div className="section-label">Needs Attention</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {weakAreas.slice(0, 3).map(topic => (
                      <div key={topic} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ color: '#FFFFFF', fontSize: 12 }}>↓</span>
                        <span style={{ fontSize: 13, color: '#A3A3A3' }}>{topic}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Start CTA */}
        <div style={{ marginTop: 32 }}>
          <button
            className="btn btn-primary btn-full"
            onClick={() => router.push('/session-lobby')}
          >
            Start New Session
          </button>
        </div>
      </div>
    </div>
  )
}
