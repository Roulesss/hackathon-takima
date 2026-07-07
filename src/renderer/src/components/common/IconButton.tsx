import { type ButtonHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import './IconButton.css'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon
  size?: 'sm' | 'md' | 'lg'
  tooltip?: string
  variant?: 'ghost' | 'subtle'
}

export function IconButton({
  icon: Icon,
  size = 'md',
  tooltip,
  variant = 'ghost',
  className = '',
  ...props
}: IconButtonProps): React.JSX.Element {
  return (
    <button
      className={`icon-btn icon-btn--${size} icon-btn--${variant} ${className}`}
      title={tooltip}
      aria-label={tooltip}
      {...props}
    >
      <Icon />
    </button>
  )
}
