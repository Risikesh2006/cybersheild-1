'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'
import { formatDate } from '../utils/helpers'

const TOPICS = [
  'Network Security','Endpoint Security','Cloud Security',
  'Identity & Access Management','Incident Response','Threat Intelligence',
  'Malware Analysis','Social Engineering','Secure Coding','Compliance & GRC',
]

export default function EnterpriseAdmin() {
  const { user } = useAuth()
  const router = useRouter()
  const [team, setTeam] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMember, setSelectedMember] = useState(null)
  const [showAssign, setShowAssign] = useState(false)
  const [assignUserIds, setAssignUserIds] = useState([])
  const [assignTopics, setAssignTopics] = useState([])
  const [assigning, setAssigning] = useState(false)
  const [assignError, setAssignError] = useState('')

  useEffect(() => {
    if (!user || user.user_type !== 'enterprise' || !user.is_admin) {
      router.push('/dashboard')
      return
    }
    api.get('/enterprise/team')
      .then(r => setTeam(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user, router])

  async function handleAssign() {
    if (!assignUserIds.length || !assignTopics.length) return
    setAssigning(true)
    setAssignError('')
    try {
      await api.post('/enterprise/assign', { user_ids: assignUserIds, topics: assignTopics })
      const r = await api.get('/enterprise/team')
      setTeam(r.data || [])
      setShowAssign(false)
    } catch (err) {
      setAssignError(err.message)
    } finally {
      setAssigning(false) }
  }

  function toggleUserId(id) {
    setAssignUserIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function toggleTopic(t) {
    setAssignTopics(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  const drawer = selectedMember ? team.find(m => m.id === selectedMember) : null

  return (
    <div className="page-offset">
      <div className="page-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <h1 style={{ fontSize: 22 }}>Enterprise Admin</h1>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAssign(true)}>
            + Assign Topics
          </button>
        </div>

        {loading ? (
          <div style={{ color: '#6F6F6F', fontSize: 14 }}>Loading team data…</div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="cs-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Level</th>
                  <th>XP</th>
                  <th>Topics</th>
                  <th>Last Active</th>
                  <th>Scenarios</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {team.map(member => (
                  <tr key={member.id}>
                    <td>{member.name}</td>
                    <td style={{ color: '#A3A3A3', fontSize: 12 }}>{member.email}</td>
                    <td><span className="badge badge-info">{member.level}</span></td>
                    <td>{Math.floor(member.xp)}</td>
                    <td style={{ fontSize: 12, color: '#A3A3A3' }}>{member.topics_assigned?.length || 0}</td>
                    <td style={{ fontSize: 12, color: '#A3A3A3' }}>{formatDate(member.last_active)}</td>
                    <td>{member.total_scenarios}</td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedMember(member.id)}
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Member profile drawer */}
        {drawer && (
          <div className="side-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 600, color: '#F3F1EF', fontSize: 15 }}>{drawer.name}</div>
                <div style={{ color: '#A3A3A3', fontSize: 12 }}>{drawer.email}</div>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                style={{ background: 'none', border: 'none', color: '#A3A3A3', cursor: 'pointer', fontSize: 18 }}
              >✕</button>
            </div>
            <div className="divider" style={{ marginBottom: 16 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Level', value: drawer.level },
                { label: 'XP', value: Math.floor(drawer.xp) },
                { label: 'Sessions', value: drawer.total_sessions },
                { label: 'Scenarios', value: drawer.total_scenarios },
                { label: 'Accuracy', value: `${(drawer.overall_accuracy * 100).toFixed(0)}%` },
                { label: 'Readiness', value: drawer.readiness_level },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6F6F6F', fontSize: 12 }}>{item.label}</span>
                  <span style={{ color: '#F3F1EF', fontSize: 13 }}>{item.value}</span>
                </div>
              ))}
            </div>
            {drawer.weak_areas?.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div className="section-label">Weak Areas</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {drawer.weak_areas.map(t => <span key={t} className="badge badge-danger">{t}</span>)}
                </div>
              </div>
            )}
            {drawer.strong_areas?.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div className="section-label">Strong Areas</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {drawer.strong_areas.map(t => <span key={t} className="badge badge-success">{t}</span>)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Assign Topics Modal */}
        {showAssign && (
          <div className="modal-overlay" onClick={() => setShowAssign(false)}>
            <div
              style={{
                background: '#181919', border: '1px solid #343636', borderRadius: 8,
                padding: 28, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto',
              }}
              onClick={e => e.stopPropagation()}
            >
              <h3 style={{ marginBottom: 20 }}>Assign Topics to Team Members</h3>

              <div className="section-label">Select Members</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {team.map(m => (
                  <label key={m.id} style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={assignUserIds.includes(m.id)}
                      onChange={() => toggleUserId(m.id)}
                      style={{ width: 14, height: 14, accentColor: '#FFFFFF' }}
                    />
                    <span style={{ color: '#F3F1EF', fontSize: 13 }}>{m.name}</span>
                    <span style={{ color: '#A3A3A3', fontSize: 12 }}>{m.email}</span>
                  </label>
                ))}
              </div>

              <div className="section-label">Select Topics</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {TOPICS.map(t => (
                  <button
                    key={t}
                    onClick={() => toggleTopic(t)}
                    className={`badge ${assignTopics.includes(t) ? 'badge-accent' : 'badge-muted'}`}
                    style={{ cursor: 'pointer', border: 'none' }}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {assignError && <div className="form-error" style={{ marginBottom: 16 }}>{assignError}</div>}

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  className="btn btn-primary"
                  onClick={handleAssign}
                  disabled={assigning || !assignUserIds.length || !assignTopics.length}
                >
                  {assigning ? 'Assigning…' : 'Assign Topics'}
                </button>
                <button className="btn btn-secondary" onClick={() => setShowAssign(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
