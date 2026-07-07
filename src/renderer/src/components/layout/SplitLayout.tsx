import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import './SplitLayout.css'

interface SplitLayoutProps {
  left: ReactNode
  right: ReactNode
  defaultLeftSize?: number
  minLeftSize?: number
  minRightSize?: number
}

export function SplitLayout({
  left,
  right,
  defaultLeftSize = 50,
  minLeftSize = 20,
  minRightSize = 20
}: SplitLayoutProps): JSX.Element {
  const [leftSize, setLeftSize] = useState(defaultLeftSize)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setIsDragging(true)
    },
    []
  )

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent): void => {
      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left
      const pct = (x / rect.width) * 100

      const clamped = Math.min(Math.max(pct, minLeftSize), 100 - minRightSize)
      setLeftSize(clamped)
    }

    const handleMouseUp = (): void => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, minLeftSize, minRightSize])

  return (
    <div
      ref={containerRef}
      className={`split-layout${isDragging ? ' split-layout--dragging' : ''}`}
    >
      <div className="split-layout__left" style={{ flex: `0 0 ${leftSize}%` }}>
        {left}
      </div>
      <div
        className={`split-layout__divider${isDragging ? ' split-layout__divider--dragging' : ''}`}
        onMouseDown={handleMouseDown}
      />
      <div className="split-layout__right">{right}</div>
    </div>
  )
}
