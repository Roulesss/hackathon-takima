import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowLeft, FileImage, Code, FileText, Download, Printer } from 'lucide-react'
import { Toolbar } from '@renderer/components/layout'
import { SplitLayout } from '@renderer/components/layout'
import { Button, IconButton, Card } from '@renderer/components/common'
import { useExport } from '@renderer/hooks'
import type { QrConfig, ExportFormat, BusinessCardConfig, ActivityType } from '@renderer/types'
import { BusinessCardPreview } from '@renderer/components/business-card/BusinessCardPreview'
import * as htmlToImage from 'html-to-image'
import { createQrInstance, exportQrAsBlob, addQrToPdf, addQrToImage } from '@renderer/utils'
import './ExportPage.css'

interface ExportPageProps {
  onNavigate: (page: string, data?: Record<string, unknown>) => void
  qrConfig: QrConfig
  businessCardConfig?: BusinessCardConfig
  activityType?: ActivityType
  templateBytes: Uint8Array | null
  templateMimeType?: string
  templateOptions: { x: number; y: number; size: number; pageIndex: number }[]
}

const FORMAT_OPTIONS: Array<{
  format: ExportFormat
  icon: typeof FileImage
  title: string
  description: string
}> = [
  { format: 'png', icon: FileImage, title: 'PNG', description: 'Image haute qualité, idéale pour le web' },
  { format: 'svg', icon: Code, title: 'SVG', description: 'Vectoriel, redimensionnable sans perte' },
  { format: 'pdf', icon: FileText, title: 'PDF', description: 'Document prêt à imprimer' }
]

export function ExportPage({ onNavigate, qrConfig, businessCardConfig, activityType, templateBytes, templateMimeType, templateOptions }: ExportPageProps): React.JSX.Element {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('png')
  const [batchNaming, setBatchNaming] = useState('qr_{index}')
  const [bcResolution, setBcResolution] = useState<number>(2)
  const { exportQr, exporting, error } = useExport()
    if (activityType === 'document' && templateMimeType) {
      if (templateMimeType === 'application/pdf' && selectedFormat !== 'pdf') setSelectedFormat('pdf')
      if (templateMimeType.startsWith('image/') && selectedFormat !== 'png') setSelectedFormat('png')
    }
  const qrRef = useRef<HTMLDivElement>(null)
  const bcRef = useRef<HTMLDivElement>(null)
  
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null)

  const renderQr = useCallback(() => {
    if (!qrRef.current) return
    qrRef.current.innerHTML = ''
    const qr = createQrInstance(qrConfig)
    qr.append(qrRef.current)
  }, [qrConfig])

  useEffect(() => {
    renderQr()
  }, [renderQr])

  useEffect(() => {
    let active = true
    const updatePreview = async () => {
      if (templateBytes && templateMimeType && ((selectedFormat === 'pdf' && templateMimeType === 'application/pdf') || (selectedFormat === 'png' && templateMimeType.startsWith('image/')))) {
        try {
          const urls = qrConfig.batchUrls && qrConfig.batchUrls.length > 0 ? qrConfig.batchUrls : [qrConfig.url]
          
          if (templateMimeType === 'application/pdf') {
            let currentPdfBytes = templateBytes
            for (let i = 0; i < urls.length; i++) {
              const pngBlob = await exportQrAsBlob({ ...qrConfig, url: urls[i] }, 'png')
              if (!pngBlob) continue
              const arrayBuffer = await pngBlob.arrayBuffer()
              const opt = templateOptions[i] || templateOptions[0] || { x: 50, y: 50, size: 150, pageIndex: 0 }
              currentPdfBytes = await addQrToPdf(
                currentPdfBytes,
                new Uint8Array(arrayBuffer),
                opt
              )
            }
            if (!active) return
            const blob = new Blob([currentPdfBytes as any], { type: 'application/pdf' })
            const url = URL.createObjectURL(blob)
            const firstOpt = templateOptions[0] || { pageIndex: 0 }
            setPdfPreviewUrl(`${url}#page=${firstOpt.pageIndex + 1}`)
          } else {
            let currentImgBytes = templateBytes
            for (let i = 0; i < urls.length; i++) {
              const pngBlob = await exportQrAsBlob({ ...qrConfig, url: urls[i] }, 'png')
              if (!pngBlob) continue
              const arrayBuffer = await pngBlob.arrayBuffer()
              const opt = templateOptions[i] || templateOptions[0] || { x: 50, y: 50, size: 150, pageIndex: 0 }
              currentImgBytes = await addQrToImage(
                currentImgBytes,
                new Uint8Array(arrayBuffer),
                opt,
                templateMimeType
              )
            }
            if (!active) return
            const blob = new Blob([currentImgBytes as any], { type: templateMimeType })
            const url = URL.createObjectURL(blob)
            setPdfPreviewUrl(url)
          }
        } catch (e) {
          console.error('Preview error', e)
        }
      } else {
        setPdfPreviewUrl(null)
      }
    }
    updatePreview()
    return () => {
      active = false
    }
  }, [templateBytes, templateMimeType, templateOptions, qrConfig, selectedFormat])

  const handlePrint = async (): Promise<void> => {
    try {
      let printUrl = ''
      
      if (activityType === 'business-card' && bcRef.current && businessCardConfig) {
        const dataUrl = await htmlToImage.toPng(bcRef.current, { quality: 1, pixelRatio: bcResolution })
        printUrl = dataUrl
      } else if (activityType === 'document' && templateBytes && templateMimeType) {
        if (pdfPreviewUrl) {
          printUrl = pdfPreviewUrl.split('#')[0] // Remove #page=... if present
        }
      } else {
        const blob = await exportQrAsBlob(qrConfig, selectedFormat === 'svg' ? 'svg' : 'png')
        if (blob) printUrl = URL.createObjectURL(blob)
      }

      if (printUrl) {
        const iframe = document.createElement('iframe')
        iframe.style.display = 'none'
        iframe.src = printUrl
        document.body.appendChild(iframe)
        iframe.onload = () => {
          setTimeout(() => {
            iframe.contentWindow?.print()
            setTimeout(() => {
              document.body.removeChild(iframe)
              if (printUrl.startsWith('blob:')) URL.revokeObjectURL(printUrl)
            }, 1000)
          }, 500)
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleExport = async (): Promise<void> => {
    if (activityType === 'business-card' && bcRef.current && businessCardConfig) {
      try {
        const dataUrl = await htmlToImage.toPng(bcRef.current, {
          quality: 1,
          pixelRatio: bcResolution,
        })
        const a = document.createElement('a')
        a.href = dataUrl
        a.download = `carte-de-visite-${businessCardConfig.name.replace(/\s+/g, '-').toLowerCase()}.png`
        a.click()
      } catch (err) {
        console.error('Failed to export business card', err)
      }
    } else if (activityType === 'document' && templateBytes && templateMimeType) {
      exportQr(qrConfig, selectedFormat, undefined, {
        templateBytes: templateBytes,
        templateMimeType: templateMimeType,
        batchNaming,
        templateOptionsArray: templateOptions
      })
    } else {
      exportQr(qrConfig, selectedFormat, undefined, {
        batchNaming
      })
    }
  }

  const leftPanel = (
    <div className="export-preview">
      {activityType === 'business-card' && businessCardConfig ? (
        <div className="export-preview__qr-container" style={{ padding: 0, overflow: 'hidden' }}>
          <BusinessCardPreview 
            config={businessCardConfig} 
            qrConfig={qrConfig} 
            previewUrl={qrConfig.url} 
            ref={bcRef}
          />
        </div>
      ) : templateBytes && pdfPreviewUrl ? (
        <div className="export-preview__pdf-container" style={{ width: '100%', height: '100%', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
          <iframe src={pdfPreviewUrl} width="100%" height="100%" style={{ flexGrow: 1, borderRadius: '12px', border: 'none' }} title="Document Preview">
            <p>Impossible d'afficher l'aperçu</p>
          </iframe>
        </div>
      ) : (
        <div className="export-preview__qr-container">
          <div ref={qrRef} className="export-preview__qr" />
        </div>
      )}
      
      <div className="export-preview__info">
        <div className="export-preview__info-row">
          <span className="export-preview__info-label">Type</span>
          <span className="export-preview__info-value">{activityType === 'business-card' ? 'Carte de visite' : 'QR Code'}</span>
        </div>
        {activityType === 'qr-code' && (
          <div className="export-preview__info-row">
            <span className="export-preview__info-label">Taille</span>
            <span className="export-preview__info-value">{qrConfig.size}px</span>
          </div>
        )}
        <div className="export-preview__info-row">
          <span className="export-preview__info-label">Format</span>
          <span className="export-preview__info-value">{activityType === 'business-card' ? 'PNG' : selectedFormat.toUpperCase()}</span>
        </div>
      </div>
    </div>
  )

  const rightPanel = (
    <div className="export-config">
      <h2 className="export-config__title">Format d'exportation</h2>

      {activityType === 'qr-code' && (
        <div className="export-config__formats">
          {FORMAT_OPTIONS.map(({ format, icon: Icon, title, description }) => (
            <Card
              key={format}
              padding="md"
              hoverable
              className={`export-config__format-card ${selectedFormat === format ? 'export-config__format-card--active' : ''}`}
              onClick={() => setSelectedFormat(format)}
            >
              <div className="export-config__format-header">
                <Icon className="export-config__format-icon" />
                <span className="export-config__format-title">{title}</span>
              </div>
              <p className="export-config__format-desc">{description}</p>
            </Card>
          ))}
        </div>
      )}

      {activityType === 'document' && templateMimeType && (
        <div className="export-config__formats">
          <Card
            padding="md"
            className="export-config__format-card export-config__format-card--active"
          >
            <div className="export-config__format-header">
              {templateMimeType === 'application/pdf' ? <FileText className="export-config__format-icon" /> : <FileImage className="export-config__format-icon" />}
              <span className="export-config__format-title">
                {templateMimeType === 'application/pdf' ? 'PDF Document' : 'Image Document'}
              </span>
            </div>
            <p className="export-config__format-desc">Document fusionné avec votre QR Code prêt à être partagé ou imprimé</p>
          </Card>
        </div>
      )}

      {activityType === 'business-card' && (
        <>
          <div className="export-config__formats">
            <Card
              padding="md"
              className="export-config__format-card export-config__format-card--active"
            >
              <div className="export-config__format-header">
                <FileImage className="export-config__format-icon" />
                <span className="export-config__format-title">PNG</span>
              </div>
              <p className="export-config__format-desc">Format image pour la carte de visite complète</p>
            </Card>
          </div>
          
          <div className="export-config__batch" style={{ marginTop: '24px' }}>
            <h3 className="export-config__batch-title">Résolution d'export</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Button 
                variant={bcResolution === 1 ? 'primary' : 'secondary'} 
                onClick={() => setBcResolution(1)}
              >
                Standard (Web)
              </Button>
              <Button 
                variant={bcResolution === 2 ? 'primary' : 'secondary'} 
                onClick={() => setBcResolution(2)}
              >
                Haute Définition (x2)
              </Button>
              <Button 
                variant={bcResolution === 4 ? 'primary' : 'secondary'} 
                onClick={() => setBcResolution(4)}
              >
                Très Haute Qualité / Impression (x4)
              </Button>
            </div>
          </div>
        </>
      )}

      <div className="export-config__divider" />

      {activityType === 'qr-code' && (
        <div className="export-config__batch">
          <h3 className="export-config__batch-title">Options batch</h3>
          <div className="export-config__batch-field">
            <label className="export-config__label">Pattern de nommage</label>
            <input
              type="text"
              className="export-config__input"
              value={batchNaming}
              onChange={(e) => setBatchNaming(e.target.value)}
              placeholder="qr_{index}"
            />
          </div>
        </div>
      )}

      {error && (
        <div className="export-config__error">
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px' }}>
        <Button
          variant="secondary"
          size="lg"
          icon={Printer}
          onClick={handlePrint}
          disabled={exporting}
          style={{ flex: 1 }}
        >
          Imprimer
        </Button>
        <Button
          variant="primary"
          size="lg"
          icon={Download}
          onClick={handleExport}
          disabled={exporting}
          style={{ flex: 2 }}
        >
          {exporting ? 'Export en cours...' : activityType === 'business-card' ? 'Exporter (PNG)' : activityType === 'document' ? 'Exporter Document' : `Exporter en ${selectedFormat.toUpperCase()}`}
        </Button>
      </div>
    </div>
  )

  return (
    <div className="export-page page-enter page-active">
      <Toolbar
        left={
          <IconButton
            icon={ArrowLeft}
            onClick={() => onNavigate('editor')}
            tooltip="Retour à l'éditeur"
          />
        }
        center={<span style={{ fontWeight: 600 }}>Exporter</span>}
      />
      <div className="export-page__body">
        <SplitLayout
          left={leftPanel}
          right={rightPanel}
          defaultLeftSize={45}
        />
      </div>
    </div>
  )
}
