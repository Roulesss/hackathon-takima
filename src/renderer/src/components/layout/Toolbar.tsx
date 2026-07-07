import { type ReactNode } from 'react'
import './Toolbar.css'

interface ToolbarProps {
  left?: ReactNode
  center?: ReactNode
  right?: ReactNode
}

export function Toolbar({ left, center, right }: ToolbarProps): React.JSX.Element {
  return (
    <div className="toolbar">
      <div className="toolbar__left">{left}</div>
      <div className="toolbar__center">{center}</div>
      <div className="toolbar__right">{right}</div>
    </div>
  )
}
