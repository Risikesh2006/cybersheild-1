'use client'

import Waves from '../components/Waves'
import Navbar from '../components/layout/Navbar'
import ProfileCard from '../components/dashboard/ProfileCard'
import HeatmapCard from '../components/dashboard/HeatmapCard'
import ModeSplitCard from '../components/dashboard/ModeSplitCard'
import TopicTrackerCard from '../components/dashboard/TopicTrackerCard'
import ScenarioStatsCard from '../components/dashboard/ScenarioStatsCard'
import LeaderboardCard from '../components/dashboard/LeaderboardCard'

export default function Dashboard() {
  return (
    <div className="waves-page profile-dashboard">
      <Waves
        className="waves-background"
        lineColor="#ffffff"
        backgroundColor="rgba(255, 255, 255, 0.02)"
        waveSpeedX={0.01}
        waveSpeedY={0.01}
        waveAmpX={40}
        waveAmpY={20}
        friction={0.9}
        tension={0.01}
        maxCursorMove={120}
        xGap={12}
        yGap={36}
      />

      <div className="waves-content">
        <Navbar />
        <div className="mx-auto max-w-[1200px] px-5 pb-16">
          <div className="mb-4">
            <div className="text-[12px] text-white/60">Portal / Dashboard</div>
            <div className="profile-heading mt-1 text-[24px] font-semibold text-white">Good morning Jhon</div>
          </div>

          <div className="grid items-stretch gap-4 p-5" style={{ gridTemplateColumns: '240px 1fr' }}>
            <ProfileCard className="row-span-2 h-full" />

            <div className="grid items-stretch gap-4" style={{ gridTemplateColumns: '1.4fr 1fr', gridAutoRows: '1fr' }}>
              <HeatmapCard />
              <ModeSplitCard />
              <TopicTrackerCard />
              <ScenarioStatsCard />
            </div>
          </div>

          <div className="px-5 pb-5">
            <LeaderboardCard />
          </div>
        </div>
      </div>
    </div>
  )
}
