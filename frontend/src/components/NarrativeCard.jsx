/**
 * NarrativeCard — displays the post-session debrief from the ProgressNarratorAgent.
 * Props: headline, narrative, improvedTopics, regressedTopics, stableTopics, fallback
 */
export default function NarrativeCard({
  headline,
  narrative,
  improvedTopics = [],
  regressedTopics = [],
  stableTopics = [],
  fallback = 'Start your first training session to see your progress debrief here.',
}) {
  const hasContent = headline || narrative

  if (!hasContent) {
    return (
      <div className="card">
        <div className="section-label">Last Session</div>
        <p className="prose" style={{ fontSize: 14, color: '#6F6F6F' }}>{fallback}</p>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="section-label">Last Session Debrief</div>
      {headline && (
        <div style={{ fontSize: 16, fontWeight: 600, color: '#F3F1EF', marginBottom: 10 }}>
          {headline}
        </div>
      )}
      {narrative && (
        <p className="prose" style={{ fontSize: 14, marginBottom: 16, lineHeight: 1.7 }}>
          {narrative}
        </p>
      )}

      {/* Topic pills */}
      {(improvedTopics.length > 0 || regressedTopics.length > 0 || stableTopics.length > 0) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {improvedTopics.map(t => (
            <span key={t} className="badge badge-success">{t}</span>
          ))}
          {regressedTopics.map(t => (
            <span key={t} className="badge badge-danger">{t}</span>
          ))}
          {stableTopics.map(t => (
            <span key={t} className="badge badge-muted">{t}</span>
          ))}
        </div>
      )}
    </div>
  )
}
