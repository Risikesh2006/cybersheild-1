'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from 'recharts'
import api from '@/src/services/api'

export default function ScenarioStatsCard() {
  const [summary, setSummary] = useState({ attempted: 0, passed: 0, critical: 0, byTopic: [] })

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        const [dashRes, historyRes] = await Promise.all([api.get('/progress/dashboard'), api.get('/progress/history')])
        if (!mounted) return

        // compute attempted/passed/critical from history
        const sessions = historyRes.data || []
        let attempted = 0
        let passed = 0
        let critical = 0
        sessions.forEach(s => {
          const vc = s.verdict_counts || {}
          const total = Object.values(vc).reduce((a, b) => a + b, 0)
          attempted += total
          passed += (vc['Optimal'] || 0) + (vc['Suboptimal'] || 0)
          critical += (vc['Critical'] || 0)
        })

        // byTopic — use dashboard topic_mastery_list attempts if available
        const topics = (dashRes.data.topic_mastery_list || []).map(t => ({
          topic: t.topic.slice(0, 6),
          attempted: t.attempts || 0,
          passed: Math.round(((t.score || 0) * (t.attempts || 0)) || 0),
        }))

        setSummary({ attempted, passed, critical, byTopic: topics })
      } catch (err) {
        // ignore — keep initial
      }
    }

    load()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="profile-card">
      <div className="text-[12px] text-[#A3A3A3]">Scenario Stats</div>
      <div className="mt-1 text-[16px] font-semibold text-[#F3F1EF]">Talent recruitment</div>
      <div className="mt-3 flex items-center gap-4 text-[12px]">
        <div>
          <div className="text-[#A3A3A3]">Attempted</div>
          <div className="font-semibold text-[#F3F1EF]">{summary.attempted}</div>
        </div>
        <div>
          <div className="text-[#A3A3A3]">Passed</div>
          <div className="font-semibold text-[#F3F1EF]">{summary.passed}</div>
        </div>
        <div>
          <div className="text-[#A3A3A3]">Critical</div>
          <div className="font-semibold text-[#F3F1EF]">{summary.critical}</div>
        </div>
      </div>
      <div className="mt-4 h-[140px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={summary.byTopic} margin={{ top: 8, left: 0, right: 0, bottom: 0 }}>
            <XAxis dataKey="topic" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6F6F6F' }} />
            <Tooltip contentStyle={{ background: '#181919', borderRadius: 8, border: '1px solid #343636', color: '#F3F1EF' }} />
            <Bar dataKey="attempted" fill="#6F6F6F" radius={[6, 6, 0, 0]} />
            <Bar dataKey="passed" fill="#BFBFBF" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
