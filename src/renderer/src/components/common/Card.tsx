import { type ReactNode, type HTMLAttributes } from 'react'
import './Card.css'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
  padding?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

export function Card({
  hoverable = false,
  padding = 'md',
  children,
  className = '',
  onClick,
  ...props
}: CardProps): React.JSX.Element {
  return (
    <div
      className={`card card--pad-${padding} ${hoverable ? 'card--hoverable' : ''} ${onClick ? 'card--clickable' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(e as any) } : undefined}
      {...props}
    >
      {children}
    </div>
  )
}
