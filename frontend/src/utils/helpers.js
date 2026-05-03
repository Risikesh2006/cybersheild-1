/**
 * Shared utility helpers for CyberShield frontend.
 */

/** Map a verdict string to a CSS class name */
export function verdictClass(verdict) {
  switch (verdict) {
    case 'Optimal':    return 'badge-success'
    case 'Suboptimal': return 'badge-warning'
    case 'Risky':      return 'badge-danger'
    case 'Critical':   return 'badge-danger'
    default:           return 'badge-muted'
  }
}

/** Map a verdict to its colour hex */
export function verdictColor(verdict) {
  switch (verdict) {
    case 'Optimal':    return '#BFBFBF'
    case 'Suboptimal': return '#D9D9D9'
    case 'Risky':      return '#FFFFFF'
    case 'Critical':   return '#FFFFFF'
    default:           return '#A3A3A3'
  }
}

/** Format score delta as e.g. "+10 XP" or "-5 XP" */
export function formatScore(delta) {
  if (delta == null) return '—'
  return delta >= 0 ? `+${delta} XP` : `${delta} XP`
}

/** Format a date string as "Apr 9, 2026" */
export function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

/** Format a date string as "Apr 9, 2026 at 2:34 PM" */
export function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

/** XP level thresholds */
export const LEVEL_THRESHOLDS = {
  Beginner:     { min: 0,   max: 79  },
  Intermediate: { min: 80,  max: 199 },
  Advanced:     { min: 200, max: Infinity },
}

/** Return progress to next level as 0.0 – 1.0 */
export function xpProgress(xp) {
  if (xp < 80)  return xp / 80
  if (xp < 200) return (xp - 80) / 120
  return 1.0
}

/** XP needed to reach next level */
export function xpToNextLevel(xp) {
  if (xp < 80)  return 80  - xp
  if (xp < 200) return 200 - xp
  return 0
}

/** Map trend string to display arrow */
export function trendArrow(trend) {
  switch (trend) {
    case 'improving': return '↑'
    case 'declining': return '↓'
    case 'stable':    return '→'
    default:          return '—'
  }
}

/** Map mastery score (0-100) to a status string */
export function masteryStatus(score, attempts) {
  if (attempts === 0) return 'untested'
  if (score >= 75)   return 'mastered'
  if (score >= 40)   return 'in_progress'
  return 'needs_revisit'
}

/** Map mastery status to badge class */
export function masteryBadgeClass(status) {
  switch (status) {
    case 'mastered':     return 'badge-success'
    case 'in_progress':  return 'badge-warning'
    case 'needs_revisit':return 'badge-danger'
    default:             return 'badge-muted'
  }
}

/** Clamp a value between min and max */
export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val))
}

/** Truncate a string to maxLen characters */
export function truncate(str, maxLen = 80) {
  if (!str) return ''
  return str.length > maxLen ? str.slice(0, maxLen).trimEnd() + '…' : str
}
