/**
 * Card component — base surface card.
 * Props: children, className, style, onClick
 */
export default function Card({ children, className = '', style, onClick }) {
  return (
    <div
      className={`card ${className}`}
      style={style}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  )
}
