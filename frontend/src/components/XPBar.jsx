import { xpProgress, xpToNextLevel } from '../utils/helpers'

/**
 * XPBar — shows XP progress toward next level.
 * Props: xp (number), level (string)
 */
export default function XPBar({ xp = 0, level = 'Beginner' }) {
  const progress = xpProgress(xp)
  const toNext = xpToNextLevel(xp)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ color: '#F3F1EF', fontSize: 13, fontWeight: 600 }}>{level}</span>
        <span style={{ color: '#A3A3A3', fontSize: 12 }}>
          {toNext > 0 ? `${toNext} XP to next level` : 'Max level'}
        </span>
      </div>
      <div className="xp-bar-track">
        <div
          className="xp-bar-fill"
          style={{ width: `${Math.min(100, progress * 100).toFixed(1)}%` }}
        />
      </div>
      <div style={{ marginTop: 4, color: '#6F6F6F', fontSize: 11 }}>
        {xp.toFixed(0)} XP total
      </div>
    </div>
  )
}
