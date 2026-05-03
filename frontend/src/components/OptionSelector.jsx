/**
 * OptionSelector — renders the 4 scenario response options as selectable cards.
 * Props: options [{key, label, action_detail, consequence, description?}], selected (key string), onSelect (fn)
 * Supports both new format (action_detail + consequence) and legacy format (description).
 */
export default function OptionSelector({ options = [], selected, onSelect }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {options.map(opt => {
        const isSelected = selected === opt.key
        // Support both new format and legacy format
        const actionDetail = opt.action_detail || opt.description || ''
        const consequence = opt.consequence || ''

        return (
          <div
            key={opt.key}
            onClick={() => onSelect(opt.key)}
            className="option-card cursor-target"
            style={{
              display: 'flex',
              gap: 14,
              padding: '16px 18px',
              borderRadius: 10,
              border: `1px solid ${isSelected ? '#FFFFFF' : '#343636'}`,
              background: isSelected ? 'rgba(255,255,255,0.10)' : '#181919',
              cursor: 'pointer',
              transition: 'border-color 180ms ease, background 180ms ease, box-shadow 180ms ease',
              alignItems: 'flex-start',
              boxShadow: isSelected ? '0 0 0 1px rgba(79,142,247,0.25)' : 'none',
            }}
          >
            {/* Key badge */}
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: isSelected ? '#FFFFFF' : '#1F1F1F',
                color: isSelected ? '#F3F1EF' : '#A3A3A3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 700,
                flexShrink: 0,
                transition: 'background 180ms ease, color 180ms ease',
                fontFamily: '"IBM Plex Mono", monospace',
                marginTop: 2,
              }}
            >
              {opt.key}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Label */}
              <div style={{
                color: isSelected ? '#E5E5E5' : '#F3F1EF',
                fontWeight: 600,
                marginBottom: 6,
                fontSize: 14,
                lineHeight: 1.4,
              }}>
                {opt.label}
              </div>

              {/* Action detail */}
              {actionDetail && (
                <div style={{
                  color: '#A3A3A3',
                  fontSize: 12.5,
                  fontFamily: '"IBM Plex Sans", sans-serif',
                  lineHeight: 1.6,
                  marginBottom: consequence ? 6 : 0,
                }}>
                  {actionDetail}
                </div>
              )}

              {/* Consequence */}
              {consequence && (
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 5,
                  marginTop: 2,
                }}>
                  <span style={{
                    color: isSelected ? '#FFFFFF' : '#3A3A3A',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    flexShrink: 0,
                    marginTop: 1,
                    fontFamily: '"IBM Plex Mono", monospace',
                  }}>
                    ↳
                  </span>
                  <span style={{
                    color: isSelected ? '#8C8C8C' : '#6F6F6F',
                    fontSize: 12,
                    fontStyle: 'italic',
                    lineHeight: 1.55,
                    fontFamily: '"IBM Plex Sans", sans-serif',
                  }}>
                    {consequence}
                  </span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
