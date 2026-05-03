'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '../hooks/useSession'
import Badge from '../components/Badge'
import { verdictClass, verdictColor, formatScore } from '../utils/helpers'

export default function Feedback() {
  const {
    lastEvaluation, currentScenario, sessionScore,
    scenarioIndex, totalScenarios, isLastScenario,
    sessionNarrative, advanceToNextScenario,
  } = useSession()

  const router = useRouter()

  useEffect(() => {
    if (!lastEvaluation) router.push('/scenario')
  }, [lastEvaluation, router])

  if (!lastEvaluation || !currentScenario) return null

  const ev = lastEvaluation
  const scenario = currentScenario
  const chosenOption = scenario.options?.find(o => o.key === ev.chosen_key)
  const optimalOption = scenario.options?.find(o => o.key === ev.optimal_key)
  const isCorrect = ev.chosen_key === ev.optimal_key
  const vColor = verdictColor(ev.verdict)

  function handleNext() {
    // Move pre-loaded next_scenario from context into currentScenario, clear evaluation
    advanceToNextScenario()
    router.push('/scenario')
  }

  function handleEnd() {
    router.push('/dashboard')
  }

  return (
    <div className="page-offset">
      <div className="page-container" style={{ maxWidth: 720 }}>

        {/* 1. Verdict block */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span className={`badge badge-${verdictClass(ev.verdict).replace('badge-', '')}`}
            style={{ fontSize: 14, padding: '6px 16px', marginBottom: 12, display: 'inline-flex' }}>
            {ev.verdict}
          </span>
          <div style={{
            fontSize: 28, fontWeight: 600,
            color: vColor, fontFamily: '"IBM Plex Mono"',
          }}>
            {formatScore(ev.score)}
          </div>
          <div style={{ color: '#A3A3A3', fontSize: 13, marginTop: 6 }}>
            Session total: {formatScore(sessionScore)}
          </div>
        </div>

        {/* 2. Comparison row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isCorrect ? '1fr' : '1fr 1fr',
          gap: 16, marginBottom: 24,
        }}>
          {/* Chosen action */}
          <div style={{
            padding: 20, borderRadius: 8,
            border: `1px solid ${vColor}`,
            background: '#181919',
          }}>
            <div style={{ fontSize: 11, color: '#A3A3A3', marginBottom: 10 }}>
              {isCorrect ? 'CORRECT CHOICE' : 'YOUR ACTION'}
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{
                width: 28, height: 28, borderRadius: 6, fontSize: 13, fontWeight: 600,
                background: vColor, color: '#F3F1EF',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {ev.chosen_key}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: '#F3F1EF', marginBottom: 4, fontSize: 14 }}>
                  {chosenOption?.label}
                </div>
                <div style={{ color: '#A3A3A3', fontSize: 13, fontFamily: '"IBM Plex Sans"', lineHeight: 1.55, marginBottom: chosenOption?.consequence ? 6 : 0 }}>
                  {chosenOption?.action_detail || chosenOption?.description}
                </div>
                {chosenOption?.consequence && (
                  <div style={{ color: '#6F6F6F', fontSize: 12, fontStyle: 'italic', lineHeight: 1.5 }}>
                    ↳ {chosenOption.consequence}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Optimal action — only shown if different */}
          {!isCorrect && (
            <div style={{
              padding: 20, borderRadius: 8,
              border: '1px solid #BFBFBF',
              background: '#181919',
            }}>
              <div style={{ fontSize: 11, color: '#A3A3A3', marginBottom: 10 }}>OPTIMAL ACTION</div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 6, fontSize: 13, fontWeight: 600,
                  background: '#BFBFBF', color: '#121313',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {ev.optimal_key}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: '#F3F1EF', marginBottom: 4, fontSize: 14 }}>
                    {optimalOption?.label}
                  </div>
                  <div style={{ color: '#A3A3A3', fontSize: 13, fontFamily: '"IBM Plex Sans"', lineHeight: 1.55, marginBottom: optimalOption?.consequence ? 6 : 0 }}>
                    {optimalOption?.action_detail || optimalOption?.description}
                  </div>
                  {optimalOption?.consequence && (
                    <div style={{ color: '#8A5F58', fontSize: 12, fontStyle: 'italic', lineHeight: 1.5 }}>
                      ↳ {optimalOption.consequence}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Analysis card */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="section-label">Analysis</div>
          <p className="prose" style={{ fontSize: 14, lineHeight: 1.7, marginBottom: ev.optimal_explanation ? 14 : 0 }}>
            {ev.explanation}
          </p>
          {ev.optimal_explanation && (
            <p className="prose" style={{ fontSize: 14, lineHeight: 1.7, color: '#6F6F6F' }}>
              {ev.optimal_explanation}
            </p>
          )}
        </div>

        {/* 4. Tip card */}
        {ev.tip && (
          <div className="tip-card" style={{ marginBottom: 16 }}>
            <div className="section-label" style={{ color: '#D9D9D9' }}>Takeaway</div>
            <p className="prose" style={{ fontSize: 14, lineHeight: 1.7 }}>
              {ev.tip}
            </p>
          </div>
        )}

        {/* Skills */}
        {(ev.skills_demonstrated?.length > 0 || ev.skills_missed?.length > 0) && (
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            {ev.skills_demonstrated?.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: '#6F6F6F', marginBottom: 6 }}>DEMONSTRATED</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {ev.skills_demonstrated.map(s => <span key={s} className="badge badge-success">{s}</span>)}
                </div>
              </div>
            )}
            {ev.skills_missed?.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: '#6F6F6F', marginBottom: 6 }}>MISSED</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {ev.skills_missed.map(s => <span key={s} className="badge badge-danger">{s}</span>)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. Progress row */}
        <div style={{
          padding: '12px 0', borderTop: '1px solid #343636', borderBottom: '1px solid #343636',
          marginBottom: 24, color: '#A3A3A3', fontSize: 13,
        }}>
          Scenario {scenarioIndex} of {totalScenarios} complete — Session score: {formatScore(sessionScore)}
        </div>

        {/* 6. Buttons */}
        <div style={{ display: 'flex', gap: 12 }}>
          {!isLastScenario ? (
            <button className="btn btn-primary" onClick={handleNext}>
              Next Scenario →
            </button>
          ) : (
            <>
              <button className="btn btn-primary" onClick={() => router.push('/progress')}>
                View Progress Report
              </button>
              <button className="btn btn-secondary" onClick={handleEnd}>
                Back to Dashboard
              </button>
            </>
          )}
          {!isLastScenario && (
            <button className="btn btn-secondary" onClick={handleEnd}>
              End Session
            </button>
          )}
        </div>

        {/* End-of-session narrative preview */}
        {isLastScenario && sessionNarrative && (
          <div className="card" style={{ marginTop: 24 }}>
            <div className="section-label">Session Debrief</div>
            <div style={{ fontWeight: 600, color: '#F3F1EF', marginBottom: 8, fontSize: 15 }}>
              {sessionNarrative.headline}
            </div>
            <p className="prose" style={{ fontSize: 14, lineHeight: 1.7 }}>
              {sessionNarrative.narrative}
            </p>
            {sessionNarrative.next_session_recommendation && (
              <div className="tip-card" style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, color: '#D9D9D9', marginBottom: 4 }}>NEXT SESSION</div>
                <p className="prose" style={{ fontSize: 13 }}>{sessionNarrative.next_session_recommendation}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
