'use client'

import { useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import TopicGrid from '../components/TopicGrid'
import InfiniteMenu from '@/components/InfiniteMenu'

function buildTopicImage(name) {
  const safeName = String(name ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0f1112" />
          <stop offset="100%" stop-color="#1b1c1d" />
        </linearGradient>
      </defs>
      <rect width="600" height="600" rx="36" fill="url(#bg)" />
      <rect x="28" y="28" width="544" height="544" rx="28" fill="none" stroke="#2f3131" stroke-width="2" />
      <text x="50%" y="50%" fill="#f3f1ef" font-family="IBM Plex Mono, monospace" font-size="36" text-anchor="middle" dominant-baseline="middle">${safeName}</text>
    </svg>
  `.trim()
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export default function TopicMap() {
  const [syllabus, setSyllabus] = useState([])
  const [showAdjust, setShowAdjust] = useState(false)
  const [adjustSelections, setAdjustSelections] = useState([])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    api.get('/onboarding/syllabus').then(r => setSyllabus(r.data || [])).catch(() => {})
  }, [])

  const menuItems = useMemo(() => (
    (syllabus || []).map((topic) => ({
      image: buildTopicImage(topic.name || topic.id),
      link: '#',
      title: topic.name || topic.id,
      description: topic.description || '',
    }))
  ), [syllabus])

  function toggleAdjust(id) {
    setAdjustSelections(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function openAdjust() {
    setAdjustSelections(syllabus.filter(t => t.is_selected).map(t => t.id))
    setShowAdjust(true)
  }

  async function saveAdjust() {
    setSaving(true)
    setSaveError('')
    try {
      await api.post('/onboarding/topics', { topics: adjustSelections })
      const r = await api.get('/onboarding/syllabus')
      setSyllabus(r.data || [])
      setShowAdjust(false)
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-container waves-content">

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <h1 style={{ fontSize: 22 }}>Topic Map</h1>
          <button className="btn btn-secondary btn-sm" onClick={openAdjust}>
            Adjust Selection
          </button>
        </div>

        {/* Interactive topic globe */}
        <div style={{ height: 620, position: 'relative' }}>
          <InfiniteMenu items={menuItems} scale={1} />
        </div>

        {/* Adjust Selection Modal */}
        {showAdjust && (
          <div className="modal-overlay" onClick={() => setShowAdjust(false)}>
            <div
              style={{
                background: '#181919', border: '1px solid #343636', borderRadius: 8,
                padding: 28, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto',
              }}
              onClick={e => e.stopPropagation()}
            >
              <h3 style={{ marginBottom: 16 }}>Adjust Topic Selection</h3>
              <TopicGrid
                topics={syllabus}
                selected={adjustSelections}
                onToggle={toggleAdjust}
                columns={2}
              />
              {saveError && <div className="form-error" style={{ marginTop: 16 }}>{saveError}</div>}
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button className="btn btn-primary" onClick={saveAdjust} disabled={saving || adjustSelections.length === 0}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
                <button className="btn btn-secondary" onClick={() => setShowAdjust(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}
