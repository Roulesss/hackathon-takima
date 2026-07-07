import { type ReactNode, type ButtonHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import './Button.css'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  icon?: LucideIcon
  fullWidth?: boolean
  children?: ReactNode
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  fullWidth = false,
  children,
  className = '',
  ...props
}: ButtonProps): JSX.Element {
  return (
    <button
      className={`btn btn--${variant} btn--${size} ${fullWidth ? 'btn--full' : ''} ${className}`}
      {...props}
    >
      {Icon && <Icon className="btn__icon" />}
      {children && <span className="btn__label">{children}</span>}
    </button>
  )
}
