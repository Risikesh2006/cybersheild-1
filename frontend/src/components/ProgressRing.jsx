/**
 * ProgressRing — SVG circular progress indicator.
 * Props: percentage (0–100), size (px), strokeWidth, color, label
 */
export default function ProgressRing({
  percentage = 0,
  size = 80,
  strokeWidth = 6,
  color = '#FFFFFF',
  label,
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#232424"
          strokeWidth={strokeWidth}
        />
        {/* Fill */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 150ms ease' }}
        />
        {/* Percentage text — needs to counter-rotate */}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#F3F1EF"
          fontSize={size * 0.22}
          fontWeight={600}
          fontFamily="IBM Plex Mono"
          style={{ transform: `rotate(90deg) translate(0px, -${size}px)` }}
        >
          {Math.round(percentage)}%
        </text>
      </svg>
      {label && (
        <span style={{ fontSize: 12, color: '#A3A3A3', textAlign: 'center' }}>{label}</span>
      )}
    </div>
  )
}
