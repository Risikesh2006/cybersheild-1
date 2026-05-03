'use client'

import { createContext, useState, useCallback } from 'react'
import api from '../services/api'

export const SessionContext = createContext(null)

export function SessionProvider({ children }) {
  const [activeSession, setActiveSession] = useState(null)   // {id, status, topic_focus}
  const [currentScenario, setCurrentScenario] = useState(null)
  const [nextScenario, setNextScenario] = useState(null)     // pre-loaded next scenario from API
  const [sessionScore, setSessionScore] = useState(0)
  const [scenarioIndex, setScenarioIndex] = useState(0)      // how many scenarios answered so far
  const [totalScenarios, setTotalScenarios] = useState(0)
  const [planSummary, setPlanSummary] = useState(null)
  const [lastEvaluation, setLastEvaluation] = useState(null)
  const [isLastScenario, setIsLastScenario] = useState(false)
  const [sessionNarrative, setSessionNarrative] = useState(null)

  const startSession = useCallback(async () => {
    const res = await api.post('/session/start')
    const data = res.data
    setActiveSession({ id: data.session_id, status: 'active' })
    setCurrentScenario(data.scenario)
    setNextScenario(null)
    setPlanSummary(data.plan_summary)
    setTotalScenarios(data.plan_summary?.total_scenarios || 5)
    setSessionScore(0)
    setScenarioIndex(0)
    setLastEvaluation(null)
    setIsLastScenario(false)
    setSessionNarrative(null)
    return data
  }, [])

  const submitAnswer = useCallback(async (scenarioId, chosenKey, timeTakenSec) => {
    const res = await api.post('/scenario/submit', {
      session_id: activeSession.id,
      scenario_id: scenarioId,
      chosen_key: chosenKey,
      time_taken_sec: timeTakenSec,
    })
    const data = res.data
    // Store evaluation for Feedback page
    setLastEvaluation(data.evaluation)
    setSessionScore(data.session_score)
    setScenarioIndex(prev => prev + 1)
    setIsLastScenario(data.is_last)
    if (data.narrative) setSessionNarrative(data.narrative)
    // Pre-load the next scenario returned by the orchestrator
    if (data.next_scenario) setNextScenario(data.next_scenario)
    return data
  }, [activeSession])

  // Called from Feedback page when user clicks "Next Scenario"
  // Moves the pre-loaded next scenario into currentScenario and clears evaluation state
  const advanceToNextScenario = useCallback(() => {
    setCurrentScenario(nextScenario)
    setNextScenario(null)
    setLastEvaluation(null)
  }, [nextScenario])

  const pauseSession = useCallback(async (reason) => {
    if (!activeSession) return
    const res = await api.post('/session/pause', { session_id: activeSession.id, reason })
    setActiveSession(prev => ({ ...prev, status: 'paused' }))
    return res.data
  }, [activeSession])

  const resumeSession = useCallback(async (sessionId) => {
    const res = await api.post('/session/resume', { session_id: sessionId })
    const data = res.data
    setActiveSession({ id: sessionId, status: 'active' })
    setCurrentScenario(data.current_scenario)
    setNextScenario(null)
    setSessionScore(data.session_score)
    setScenarioIndex(data.scenarios_completed)
    setTotalScenarios(data.scenarios_completed + data.scenarios_remaining)
    setLastEvaluation(null)
    setIsLastScenario(false)
    return data
  }, [])

  /** Hydrate from server: resume paused → active, then load full /session/active payload. */
  const continueExistingSession = useCallback(async () => {
    let res = await api.get('/session/active')
    let s = res.data?.session
    if (!s) return null
    if (s.status === 'paused') {
      await api.post('/session/resume', { session_id: s.id })
      res = await api.get('/session/active')
      s = res.data?.session
    }
    if (!s?.current_scenario) return { ...s, error: 'no_scenario' }

    setActiveSession({ id: s.id, status: 'active' })
    setCurrentScenario(s.current_scenario)
    setNextScenario(null)
    setSessionScore(s.session_score ?? 0)
    setScenarioIndex(s.scenarios_completed ?? 0)
    const total =
      s.plan_summary?.total_scenarios ??
      (s.scenarios_completed ?? 0) + (s.scenarios_remaining ?? 0)
    setTotalScenarios(total || 1)
    setPlanSummary(s.plan_summary ?? null)
    setLastEvaluation(null)
    setIsLastScenario((s.scenarios_remaining ?? 0) <= 0)
    setSessionNarrative(null)
    return s
  }, [])

  const calloffSession = useCallback(async (sessionId) => {
    const sid = sessionId ?? activeSession?.id
    if (!sid) return null
    const res = await api.post('/session/calloff', { session_id: sid })
    setActiveSession(null)
    setCurrentScenario(null)
    setNextScenario(null)
    setPlanSummary(null)
    setSessionScore(0)
    setScenarioIndex(0)
    setTotalScenarios(0)
    setLastEvaluation(null)
    setIsLastScenario(false)
    setSessionNarrative(null)
    return res.data
  }, [activeSession])

  const clearSession = useCallback(() => {
    setActiveSession(null)
    setCurrentScenario(null)
    setNextScenario(null)
    setSessionScore(0)
    setScenarioIndex(0)
    setTotalScenarios(0)
    setPlanSummary(null)
    setLastEvaluation(null)
    setIsLastScenario(false)
    setSessionNarrative(null)
  }, [])

  return (
    <SessionContext.Provider value={{
      activeSession, currentScenario, nextScenario, sessionScore,
      scenarioIndex, totalScenarios, planSummary,
      lastEvaluation, isLastScenario, sessionNarrative,
      startSession, submitAnswer, advanceToNextScenario,
      pauseSession, resumeSession, continueExistingSession, calloffSession, clearSession,
    }}>
      {children}
    </SessionContext.Provider>
  )
}
