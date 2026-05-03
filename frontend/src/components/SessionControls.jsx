import { useState } from 'react'
import Button from './Button'

/**
 * SessionControls — Pause and Call Off buttons with confirmation modals.
 * Props: onPause (fn, async), onCalloff (fn, async)
 */
export default function SessionControls({ onPause, onCalloff }) {
  const [showPause, setShowPause] = useState(false)
  const [showCalloff, setShowCalloff] = useState(false)
  const [pauseReason, setPauseReason] = useState('')
  const [loading, setLoading] = useState(false)

  async function handlePause() {
    setLoading(true)
    try { await onPause(pauseReason) } finally { setLoading(false) }
    setShowPause(false)
    setPauseReason('')
  }

  async function handleCalloff() {
    setLoading(true)
    try { await onCalloff() } finally { setLoading(false) }
    setShowCalloff(false)
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 10 }}>
        <Button variant="secondary" size="sm" onClick={() => setShowPause(true)} full>
          ⏸ Pause Session
        </Button>
        <Button variant="danger" size="sm" onClick={() => setShowCalloff(true)} full>
          ✕ Call Off
        </Button>
      </div>

      {/* Pause Modal */}
      {showPause && (
        <div className="modal-overlay" onClick={() => setShowPause(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 8 }}>Pause Session</h3>
            <p className="prose" style={{ marginBottom: 16, fontSize: 13 }}>
              Your progress will be saved. You can resume this session anytime from your dashboard.
            </p>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Reason (optional)</label>
              <input
                className="input"
                placeholder="e.g. Taking a break..."
                value={pauseReason}
                onChange={e => setPauseReason(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="primary" onClick={handlePause} disabled={loading} full>
                {loading ? 'Pausing…' : 'Confirm Pause'}
              </Button>
              <Button variant="secondary" onClick={() => setShowPause(false)} full>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Call Off Modal */}
      {showCalloff && (
        <div className="modal-overlay" onClick={() => setShowCalloff(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 8 }}>End Session</h3>
            <p className="prose" style={{ marginBottom: 20, fontSize: 13 }}>
              Partial progress will be saved and this session will be marked as called off.
              No XP will be deducted for ending early.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="danger" onClick={handleCalloff} disabled={loading} full>
                {loading ? 'Ending…' : 'End Session'}
              </Button>
              <Button variant="secondary" onClick={() => setShowCalloff(false)} full>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
