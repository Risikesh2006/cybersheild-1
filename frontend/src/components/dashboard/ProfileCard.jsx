'use client'

import { useContext, useEffect, useState } from 'react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import api from '@/src/services/api'
import { AuthContext } from '@/src/context/AuthContext'

function buildChartData(hoursByDay) {
  // expect array length 7 (Sun..Sat) — convert to simple series
  return hoursByDay.map((v, i) => ({ day: i, value: v }))
}

export default function ProfileCard({ className = '' }) {
  const { user } = useContext(AuthContext)
  const [dashboard, setDashboard] = useState(null)
  const [weeklyHours, setWeeklyHours] = useState([0, 0, 0, 0, 0, 0, 0])

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        const [dashRes, historyRes] = await Promise.all([
          api.get('/progress/dashboard'),
          api.get('/progress/history'),
        ])

        if (!mounted) return

        setDashboard(dashRes.data)

        // compute last 7 days activity (hours) from sessions durations (minutes)
        const sessions = historyRes.data || []
        const now = new Date()
        const dayBuckets = [0, 0, 0, 0, 0, 0, 0] // Sun..Sat
        sessions.forEach(s => {
          if (!s.started_at) return
          const d = new Date(s.started_at)
          // sessions currently return duration_minutes
          const mins = s.duration_minutes || 0
          const day = d.getDay()
          dayBuckets[day] += mins / 60
        })
        setWeeklyHours(dayBuckets)
      } catch (err) {
        // silent — UI unchanged, but real app should surface
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  const profileName = user?.name || (dashboard && dashboard.name) || 'User'
  const role = user?.user_type || 'Analyst'

  const avgSessionHrs = (() => {
    // average from weeklyHours
    const total = weeklyHours.reduce((a, b) => a + b, 0)
    const daysWith = weeklyHours.filter(h => h > 0).length || 1
    return Math.round((total / daysWith) * 10) / 10
  })()

  const chartData = buildChartData(weeklyHours)

  return (
    <div className={`profile-card ${className}`}>
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 rounded-2xl bg-[#232424]" />
        <div className="min-w-0">
          <div className="text-[15px] font-semibold text-[#F3F1EF]">{profileName}</div>
          <div className="text-[12px] text-[#A3A3A3]">{role}</div>
        </div>
      </div>

      <div className="profile-subcard mt-4">
        <div className="text-[12px] text-[#A3A3A3]">Average session time</div>
        <div className="mt-1 flex items-baseline gap-2">
          <div className="text-[20px] font-semibold text-[#F3F1EF]">{avgSessionHrs} hrs</div>
          <span className="text-[12px] font-semibold text-[#BFBFBF]">&nbsp;</span>
        </div>
        <div className="mt-2 h-[56px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <Line type="monotone" dataKey="value" stroke="#F3F1EF" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-[12px]">
        <div className="profile-subcard">
          <div className="text-[#A3A3A3]">Level</div>
          <div className="mt-1 font-semibold text-[#F3F1EF]">{dashboard?.level || '—'}</div>
        </div>
        <div className="profile-subcard">
          <div className="text-[#A3A3A3]">XP</div>
          <div className="mt-1 font-semibold text-[#F3F1EF]">{dashboard?.xp ?? '—'}</div>
        </div>
        <div className="profile-subcard">
          <div className="text-[#A3A3A3]">Scenarios</div>
          <div className="mt-1 font-semibold text-[#F3F1EF]">{dashboard?.total_scenarios ?? '—'}</div>
        </div>
        <div className="profile-subcard">
          <div className="text-[#A3A3A3]">Streak</div>
          <div className="mt-1 font-semibold text-[#F3F1EF]">{dashboard?.current_streak ?? '—'} days</div>
        </div>
      </div>
    </div>
  )
}
