'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts'
import api from '@/src/services/api'

const DEFAULT_COLORS = ['#F3F1EF', '#D9D9D9', '#A3A3A3', '#4B4B4B', '#6F6F6F']

export default function TopicTrackerCard() {
  const [topics, setTopics] = useState([])

  useEffect(() => {
    let mounted = true
    api
      .get('/progress/dashboard')
      .then(res => {
        if (!mounted) return
        const list = res.data.topic_mastery_list || []
        // map into { name, count, color }
        const mapped = list.map((t, i) => ({
          name: t.topic,
          count: Math.round(t.completion_percentage || 0),
          color: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
        }))
        setTopics(mapped)
      })
      .catch(() => {})

    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="profile-card">
      <div className="text-[12px] text-[#A3A3A3]">Topic Tracker</div>
      <div className="mt-1 text-[16px] font-semibold text-[#F3F1EF]">Track your team</div>
      <div className="mt-3 h-[140px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={topics} layout="vertical" margin={{ left: 18, right: 10 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={90}
              tick={{ fontSize: 10, fill: '#A3A3A3' }}
              axisLine={false}
              tickLine={false}
            />
            <Bar dataKey="count" radius={[6, 6, 6, 6]}>
              {topics.map(topic => (
                <Cell key={topic.name} fill={topic.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
