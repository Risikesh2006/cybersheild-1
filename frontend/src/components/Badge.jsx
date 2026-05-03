/**
 * Badge component — small pill labels.
 * Props: variant ('accent'|'success'|'warning'|'danger'|'info'|'muted'), children
 */
export default function Badge({ children, variant = 'muted', className = '', style }) {
  return (
    <span className={`badge badge-${variant} ${className}`} style={style}>
      {children}
    </span>
  )
}
