import { useEffect, useRef } from 'react'
import type { QrConfig } from '../../types/qr'
import { createQrInstance } from '../../utils/qrGenerator'

interface ProjectThumbnailProps {
  qrConfig: QrConfig
  size?: number
}

export function ProjectThumbnail({ qrConfig, size = 60 }: ProjectThumbnailProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    containerRef.current.innerHTML = ''
    
    // Create a specific config for thumbnail, overriding size
    const thumbConfig = { ...qrConfig, size }
    
    try {
      const qr = createQrInstance(thumbConfig)
      qr.append(containerRef.current)
    } catch (err) {
      console.error('Failed to generate thumbnail', err)
    }
  }, [qrConfig, size])

  return (
    <div 
      ref={containerRef} 
      className="project-thumbnail"
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fff', // Ensure QR code has white background
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
        flexShrink: 0
      }}
    />
  )
}
