'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import api from '../services/api'
import { formatDate, trendArrow, verdictColor } from '../utils/helpers'
import InfiniteMenu from '@/components/InfiniteMenu'
import ScrollStack, { ScrollStackItem } from '@/components/ScrollStack'

function buildTopicProgressImage(name, percent) {
  const safeName = String(name ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const safePercent = Number.isFinite(percent) ? `${Math.max(0, Math.min(100, Math.round(percent)))}%` : '—'
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0f1112" />
          <stop offset="100%" stop-color="#1b1c1d" />
        </linearGradient>
      </defs>
      <rect width="600" height="600" rx="36" fill="url(#bg)" />
      <rect x="28" y="28" width="544" height="544" rx="28" fill="none" stroke="#2f3131" stroke-width="2" />
      <text x="50%" y="48%" fill="#f3f1ef" font-family="IBM Plex Mono, monospace" font-size="40" text-anchor="middle" dominant-baseline="middle">${safeName}</text>
      <text x="50%" y="58%" fill="#a3a3a3" font-family="IBM Plex Mono, monospace" font-size="28" text-anchor="middle" dominant-baseline="middle">${safePercent}</text>
    </svg>
  `.trim()
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export default function ProgressDashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [history, setHistory] = useState([])
  const [latestNarrative, setLatestNarrative] = useState(null)
  const [selectedSession, setSelectedSession] = useState(null)
  const [sessionNarrative, setSessionNarrative] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      try {
        const [dashRes, histRes] = await Promise.all([
          api.get('/progress/dashboard'),
          api.get('/progress/history'),
        ])
        setDashboard(dashRes.data)
        setHistory(histRes.data || [])

        const completed = histRes.data?.filter(s => s.status === 'completed' || s.status === 'called_off')
        if (completed?.length > 0) {
          api.get(`/progress/narrative?session_id=${completed[0].session_id}`)
            .then(r => setLatestNarrative(r.data))
            .catch(() => {})
        }
      } catch {}
      finally { setLoading(false) }
    }
    load()
  }, [])

  async function loadSessionNarrative(sessionId) {
    setSelectedSession(sessionId)
    try {
      const r = await api.get(`/progress/narrative?session_id=${sessionId}`)
      setSessionNarrative(r.data)
    } catch { setSessionNarrative(null) }
  }

  // Build chart data from history (reversed to show oldest first)
  const chartData = [...history].reverse().map((s, i) => ({
    session: i + 1,
    score: s.session_score,
  }))

  const topicMastery = dashboard?.topic_mastery_list || []
  const topicMenuItems = useMemo(() => (
    topicMastery.map((t) => ({
      image: buildTopicProgressImage(t.topic, t.score),
      link: '#',
      title: t.topic,
      description: `${Number.isFinite(t.score) ? `${Math.round(t.score)}%` : '—'}`,
    }))
  ), [topicMastery])
  const patterns = dashboard?.decision_patterns || []

  return (
    <div className="page-container waves-content">

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 22, marginBottom: 4 }}>Progress</h1>
            {latestNarrative && (
              <div style={{ color: '#A3A3A3', fontSize: 13 }}>
                Last session: {formatDate(latestNarrative.taken_at)}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ color: '#6F6F6F', fontSize: 14 }}>Loading progress data…</div>
        ) : (
          <>
            {/* 2. Narrative card */}
            {latestNarrative && (
              <div className="card" style={{ marginBottom: 24 }}>
                <div style={{ fontWeight: 600, color: '#F3F1EF', fontSize: 16, marginBottom: 8 }}>
                  {latestNarrative.headline}
                </div>
                <p className="prose" style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>
                  {latestNarrative.narrative}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {latestNarrative.improved_topics?.map(t => <span key={t} className="badge badge-success">{t}</span>)}
                  {latestNarrative.regressed_topics?.map(t => <span key={t} className="badge badge-danger">{t}</span>)}
                  {latestNarrative.stable_topics?.map(t => <span key={t} className="badge badge-muted">{t}</span>)}
                </div>
                {latestNarrative.next_session_recommendation && (
                  <div className="tip-card" style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 11, color: '#D9D9D9', marginBottom: 4 }}>NEXT SESSION</div>
                    <p className="prose" style={{ fontSize: 13 }}>{latestNarrative.next_session_recommendation}</p>
                  </div>
                )}
              </div>
            )}

            {/* 3. Performance chart */}
            {chartData.length > 1 && (
              <div className="card" style={{ marginBottom: 24 }}>
                <div className="section-label">Session Score History</div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <XAxis
                      dataKey="session"
                      label={{ value: 'Session', position: 'insideBottom', offset: -4 }}
                      tick={{ fill: '#A3A3A3', fontSize: 12 }}
                      axisLine={{ stroke: '#343636' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#A3A3A3', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <CartesianGrid vertical={false} stroke="#343636" />
                    <Tooltip
                      contentStyle={{ background: '#181919', border: '1px solid #343636', borderRadius: 6 }}
                      labelStyle={{ color: '#A3A3A3' }}
                      itemStyle={{ color: '#FFFFFF' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#FFFFFF"
                      strokeWidth={2}
                      dot={{ fill: '#FFFFFF', r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* 4. Topic mastery globe */}
            {topicMastery.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div className="section-label">Topic Mastery</div>
                <div style={{ height: 520, position: 'relative' }}>
                  <InfiniteMenu items={topicMenuItems} scale={1} />
                </div>
              </div>
            )}

            {/* 5. Decision patterns */}
            {patterns.length > 0 && (
              <div className="card" style={{ marginBottom: 24 }}>
                <div className="section-label">Decision Patterns</div>
                {patterns.map((p, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '10px 0', borderBottom: i < patterns.length - 1 ? '1px solid #343636' : 'none',
                  }}>
                    <span style={{ color: '#A3A3A3', fontSize: 13, fontFamily: '"IBM Plex Sans"' }}>
                      {p.pattern}
                    </span>
                    <span style={{ color: '#6F6F6F', fontSize: 12, whiteSpace: 'nowrap', marginLeft: 16 }}>
                      ×{p.frequency}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* 6. Session history stack */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #343636' }}>
                <div className="section-label" style={{ marginBottom: 0 }}>All Sessions</div>
              </div>
              {history.length === 0 ? (
                <div style={{ padding: 20, color: '#6F6F6F', fontSize: 13 }}>No sessions yet.</div>
              ) : (
                <div style={{ height: 520 }}>
                  <ScrollStack
                    className="progress-scroll-stack"
                    itemDistance={70}
                    itemStackDistance={22}
                    stackPosition="22%"
                    scaleEndPosition="8%"
                    baseScale={0.88}
                    itemScale={0.025}
                    rotationAmount={0}
                    blurAmount={0}
                  >
                    {history.map((sess) => (
                      <ScrollStackItem key={sess.session_id} itemClassName="progress-session-card">
                        <div className="progress-session-row">
                          <div className="progress-session-date">{formatDate(sess.started_at)}</div>
                          <div className="progress-session-topics">
                            {sess.topics_covered.slice(0, 2).join(', ')}
                            {sess.topics_covered.length > 2 && ` +${sess.topics_covered.length - 2}`}
                          </div>
                          <div className="progress-session-score">
                            {sess.session_score > 0 ? '+' : ''}{sess.session_score}
                          </div>
                          <div className="progress-session-accuracy">{sess.accuracy}%</div>
                          <div className="progress-session-verdicts">
                            <span>{sess.verdict_counts?.Optimal || 0}O</span>
                            <span>{sess.verdict_counts?.Suboptimal || 0}S</span>
                            <span>{(sess.verdict_counts?.Risky || 0) + (sess.verdict_counts?.Critical || 0)}R</span>
                          </div>
                          <div className="progress-session-status">
                            <span className={`badge ${
                              sess.status === 'completed' ? 'badge-success' :
                              sess.status === 'paused' ? 'badge-warning' : 'badge-danger'
                            }`}>
                              {sess.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </ScrollStackItem>
                    ))}
                  </ScrollStack>
                </div>
              )}
            </div>

            {/* Session narrative drawer */}
            {selectedSession && sessionNarrative && (
              <div style={{
                position: 'fixed', inset: 0, background: 'rgba(15,17,23,0.7)',
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                zIndex: 200,
              }}
                onClick={() => { setSelectedSession(null); setSessionNarrative(null) }}
              >
                <div
                  style={{
                    background: '#181919', border: '1px solid #343636', borderRadius: '8px 8px 0 0',
                    padding: 28, width: '100%', maxWidth: 720, maxHeight: '70vh', overflowY: 'auto',
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <div style={{ fontWeight: 600, fontSize: 15, color: '#F3F1EF', marginBottom: 12 }}>
                    {sessionNarrative.headline}
                  </div>
                  <p className="prose" style={{ fontSize: 14, lineHeight: 1.7 }}>
                    {sessionNarrative.narrative}
                  </p>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ marginTop: 20 }}
                    onClick={() => { setSelectedSession(null); setSessionNarrative(null) }}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </>
        )}
    </div>
  )
}
