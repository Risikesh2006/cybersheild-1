'use client'

import { useEffect, useState, useContext } from 'react'
import api from '@/src/services/api'
import { AuthContext } from '@/src/context/AuthContext'
import AnimatedList from '../AnimatedList'
import '../AnimatedList.css'

export default function LeaderboardCard({ className = '' }) {
  const [rows, setRows] = useState([])
  const { user } = useContext(AuthContext)

  useEffect(() => {
    let mounted = true
    api
      .get('/users/leaderboard')
      .then(res => {
        if (!mounted) return
        setRows(res.data)
      })
      .catch(() => {})

    return () => {
      mounted = false
    }
  }, [])

  const maxXp = rows.reduce((m, r) => Math.max(m, r.xp || 0), 0) || 1

  return (
    <div className={`profile-card ${className}`}>
      <div className="text-[12px] text-[#A3A3A3]">Leaderboard</div>
      <div className="mt-1 text-[16px] font-semibold text-[#F3F1EF]">Top performers</div>

      <div className="mt-4">
        <div>
          <AnimatedList
            items={rows.map(item => (
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                  style={{ background: '#2F3131' }}
                >
                  {item.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-[#F3F1EF]">{item.name}</div>
                  <div className="text-[11px] text-[#A3A3A3]">{item.role}</div>
                  <div className="mt-2 h-2 w-full rounded-full bg-[#232424] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.round((item.xp / maxXp) * 100)}%`, background: '#BFBFBF' }}
                    />
                  </div>
                </div>
                <div className="text-right text-[11px]">
                  <div className="font-semibold text-[#F3F1EF]">{item.xp} XP</div>
                  <div className="rounded-full bg-[#232424] px-2 py-0.5 text-[10px] text-[#A3A3A3]">
                    {user?.id === item.id ? user.name : ''}
                  </div>
                </div>
              </div>
            ))}
            showGradients={false}
            enableArrowNavigation={false}
            displayScrollbar={true}
          />
        </div>
      </div>
    </div>
  )
}
