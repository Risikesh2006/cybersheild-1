'use client'

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

const data = [
  { name: 'Onsite', value: 80, color: '#F3F1EF' },
  { name: 'Remote', value: 20, color: '#6F6F6F' },
]

export default function ModeSplitCard() {
  return (
    <div className="profile-card w-full">
      <div className="text-[12px] text-[#A3A3A3]">Team Mode</div>
      <div className="mt-2 h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} innerRadius={38} outerRadius={54} dataKey="value" paddingAngle={2}>
              {data.map(entry => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 space-y-1 text-[12px]">
        {data.map(item => (
          <div key={item.name} className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-[#A3A3A3]">
              <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
              {item.name}
            </span>
            <span className="font-semibold text-[#F3F1EF]">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
