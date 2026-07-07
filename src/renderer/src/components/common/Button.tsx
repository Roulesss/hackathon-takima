import { type ReactNode, type ButtonHTMLAttributes } from 'react'
import './Button.css'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ComponentType<{ size?: number }>
  fullWidth?: boolean
  children?: ReactNode
  type?: 'button' | 'submit'
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  fullWidth = false,
  children,
  className = '',
  type = 'button',
  ...props
}: ButtonProps): JSX.Element {
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16

  return (
    <button
      className={`btn btn--${variant} btn--${size} ${fullWidth ? 'btn--full' : ''} ${className}`}
      type={type}
      {...props}
    >
      {Icon && (
        <span className="btn__icon">
          <Icon size={iconSize} />
        </span>
      )}
      {children && <span className="btn__label">{children}</span>}
    </button>
  )
}
