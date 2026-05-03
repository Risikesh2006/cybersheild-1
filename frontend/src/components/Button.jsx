/**
 * Button component.
 * Props: variant ('primary'|'secondary'|'danger'), size ('sm'|'md'), full, disabled, onClick, children, type
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  full = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
}) {
  const cls = [
    'btn',
    `btn-${variant}`,
    size === 'sm' ? 'btn-sm' : '',
    full ? 'btn-full' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <button
      type={type}
      className={cls}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
