import React, { useEffect, useRef, useState } from 'react'
import { BusinessCardConfig } from '@renderer/types'
import { QrConfig } from '@renderer/types/qr'
import { createQrInstance } from '@renderer/utils'
import './BusinessCardPreview.css'

interface BusinessCardPreviewProps {
  config: BusinessCardConfig
  qrConfig: QrConfig
  previewUrl: string
}

export const BusinessCardPreview = React.forwardRef<HTMLDivElement, BusinessCardPreviewProps>(
  ({ config, qrConfig, previewUrl }, ref) => {
    const qrRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [scale, setScale] = useState(1)

    // Handle scaling so the 850x550 card fits in the container
    useEffect(() => {
      const observer = new ResizeObserver((entries) => {
        if (!entries[0]) return
        const { width, height } = entries[0].contentRect
        // The card is 850x550
        const scaleX = width / 850
        const scaleY = height / 550
        setScale(Math.min(scaleX, scaleY, 1)) // never scale up beyond 1 if not needed, or let it scale up to fill
      })

      if (containerRef.current) {
        observer.observe(containerRef.current)
      }

      return () => observer.disconnect()
    }, [])

    useEffect(() => {
      if (!qrRef.current) return
      qrRef.current.innerHTML = ''
      // Render a smaller QR code for the business card
      const cardQrConfig = {
        ...qrConfig,
        url: previewUrl,
        size: 150, // Fixed size for the business card layout
        margin: 0
      }
      const qr = createQrInstance(cardQrConfig)
      qr.append(qrRef.current)
    }, [qrConfig, previewUrl])

    const cardStyle: React.CSSProperties = {
      backgroundColor: config.backgroundColor,
      backgroundImage: config.backgroundImageUrl ? `url(${config.backgroundImageUrl})` : undefined,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      color: config.textColor,
      fontFamily: config.fontFamily,
      border: config.showBorder ? `${config.borderWidth}px solid ${config.borderColor}` : 'none',
      borderRadius: `${config.borderRadius}px`,
      transform: `scale(${scale})`,
      transformOrigin: 'center center'
    }

    return (
      <div className="business-card-container" ref={containerRef}>
        <div className="business-card" style={cardStyle} ref={ref}>
          <div className="business-card__content" style={{ transform: `scale(${config.fontSizeScale})`, transformOrigin: 'top left' }}>
            <div className="business-card__info">
              {config.iconUrl && (
                <img src={config.iconUrl} alt="Icon/Logo" className="business-card__icon" />
              )}
              <h1 className="business-card__name" style={{ color: config.accentColor }}>
                {config.name}
              </h1>
              <p className="business-card__profession">{config.professionOrDomain}</p>
              
              <div className="business-card__details">
                {config.location && (
                  <p className="business-card__detail-item">📍 {config.location}</p>
                )}
                {config.phone && (
                  <p className="business-card__detail-item">📞 {config.phone}</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="business-card__qr-wrapper">
            <div ref={qrRef} className="business-card__qr" />
          </div>
        </div>
      </div>
    )
  }
)

BusinessCardPreview.displayName = 'BusinessCardPreview'
