import React, { useEffect, useRef, useState } from 'react'
import { BusinessCardConfig } from '@renderer/types'
import { QrConfig } from '@renderer/types/qr'
import { createQrInstance } from '@renderer/utils'
import { MapPin, Phone, Briefcase, Building } from 'lucide-react'
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
        size: config.qrSize || 130,
        margin: 0
      }
      const qr = createQrInstance(cardQrConfig)
      qr.append(qrRef.current)
    }, [qrConfig, previewUrl])

    const cardStyle: React.CSSProperties = {
      background: config.backgroundType === 'gradient' 
        ? `linear-gradient(135deg, ${config.gradientStart || '#ffffff'} 0%, ${config.gradientEnd || '#f3f4f6'} 100%)`
        : config.backgroundType === 'image' && config.backgroundImageUrl
          ? `url(${config.backgroundImageUrl})`
          : config.backgroundColor,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      color: config.textColor,
      border: config.showBorder ? `${config.borderWidth}px solid ${config.borderColor}` : 'none',
      borderRadius: `${config.borderRadius}px`,
      transform: `scale(${scale})`,
      transformOrigin: 'center center'
    }

    return (
      <div className="business-card-container" ref={containerRef}>
        <div className="business-card" style={cardStyle} ref={ref}>
          <div className="business-card__content">
            <div className="business-card__info">
              {config.iconUrl && (
                <img 
                  src={config.iconUrl} 
                  alt="Icon/Logo" 
                  className="business-card__icon" 
                  style={{ 
                    width: `${config.iconSize}px`, 
                    height: `${config.iconSize}px`,
                    borderRadius: config.iconStyle === 'square' ? '8px' : '50%'
                  }} 
                />
              )}
              <h1 className="business-card__name" style={{ color: config.accentColor, fontFamily: config.nameFontFamily || 'Inter', fontSize: `${config.nameFontSize || 42}px` }}>
                {config.name}
              </h1>
              <p className="business-card__profession" style={{ fontFamily: config.descFontFamily || 'Inter', fontSize: `${config.descFontSize || 24}px` }}>
                {config.type === 'company' ? <Building size={Math.max(16, (config.descFontSize || 24) * 0.8)} /> : <Briefcase size={Math.max(16, (config.descFontSize || 24) * 0.8)} />}
                {config.professionOrDomain}
              </p>
              
              <div className="business-card__details" style={{ fontFamily: config.descFontFamily || 'Inter' }}>
                {config.location && (
                  <p className="business-card__detail-item" style={{ fontSize: `${Math.max(12, (config.descFontSize || 24) * 0.75)}px` }}>
                    <MapPin size={Math.max(14, (config.descFontSize || 24) * 0.7)} /> {config.location}
                  </p>
                )}
                {config.phone && (
                  <p className="business-card__detail-item" style={{ fontSize: `${Math.max(12, (config.descFontSize || 24) * 0.75)}px` }}>
                    <Phone size={Math.max(14, (config.descFontSize || 24) * 0.7)} /> {config.phone}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="business-card__qr-wrapper" style={{ width: `${(config.qrSize || 130) + 20}px`, height: `${(config.qrSize || 130) + 20}px` }}>
            <div ref={qrRef} className="business-card__qr" />
          </div>
        </div>
      </div>
    )
  }
)

BusinessCardPreview.displayName = 'BusinessCardPreview'
