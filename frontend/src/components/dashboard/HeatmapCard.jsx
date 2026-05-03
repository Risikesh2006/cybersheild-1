'use client'

import { BarChart, Bar, XAxis, ResponsiveContainer } from 'recharts'
import { mockWeeklyActivity } from './mockData'

const data = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label, i) => ({
  label,
  value: mockWeeklyActivity[i] || 0,
}))

export default function HeatmapCard() {
  return (
    <div className="profile-card">
      <div className="text-[12px] text-[#A3A3A3]">Weekly Activity</div>
      <div className="mt-2 text-[20px] font-semibold text-[#F3F1EF]">46.5</div>
      <div className="text-[11px] text-[#6F6F6F]">avg hours / week</div>
      <div className="mt-4 h-[92px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 0, right: 0, top: 4, bottom: 4 }}>
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6F6F6F' }} />
            <Bar dataKey="value" fill="#BFBFBF" barSize={8} radius={[6, 6, 6, 6]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
