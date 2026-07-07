import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowLeft, FileImage, Code, FileText, Download } from 'lucide-react'
import { Toolbar } from '@renderer/components/layout'
import { SplitLayout } from '@renderer/components/layout'
import { Button, IconButton, Card } from '@renderer/components/common'
import { useExport } from '@renderer/hooks'
import type { QrConfig, ExportFormat } from '@renderer/types'
import { createQrInstance, exportQrAsBlob, addQrToPdf, addQrToImage } from '@renderer/utils'
import './ExportPage.css'

interface ExportPageProps {
  onNavigate: (page: string, data?: Record<string, unknown>) => void
  qrConfig: QrConfig
  templateBytes: Uint8Array | null
  templateMimeType?: string
  templateOptions: { x: number; y: number; size: number; pageIndex: number }
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

export function ExportPage({ onNavigate, qrConfig, templateBytes, templateMimeType, templateOptions }: ExportPageProps): React.JSX.Element {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('png')
  const [batchNaming, setBatchNaming] = useState('qr_{index}')
  const [batchZip, setBatchZip] = useState(false)
  const { exportQr, exporting, error } = useExport()
  const qrRef = useRef<HTMLDivElement>(null)
  
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
          const pngBlob = await exportQrAsBlob(qrConfig, 'png')
          if (!pngBlob) return
          const arrayBuffer = await pngBlob.arrayBuffer()
          
          if (templateMimeType === 'application/pdf') {
            const pdfBytes = await addQrToPdf(
              templateBytes,
              new Uint8Array(arrayBuffer),
              templateOptions
            )
            if (!active) return
            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
            const url = URL.createObjectURL(blob)
            setPdfPreviewUrl(`${url}#page=${templateOptions.pageIndex + 1}`)
          } else {
            const imgBytes = await addQrToImage(
              templateBytes,
              new Uint8Array(arrayBuffer),
              templateOptions,
              templateMimeType
            )
            if (!active) return
            const blob = new Blob([imgBytes as any], { type: templateMimeType })
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

  const handleExport = (): void => {
    if (templateBytes && templateMimeType) {
      exportQr(qrConfig, selectedFormat, undefined, {
        templateBytes: templateBytes,
        templateMimeType: templateMimeType,
        ...templateOptions
      })
    } else {
      exportQr(qrConfig, selectedFormat)
    }
  }

  const leftPanel = (
    <div className="export-preview">
      {templateBytes && pdfPreviewUrl ? (
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
          <span className="export-preview__info-label">URL</span>
          <span className="export-preview__info-value">{qrConfig.url}</span>
        </div>
        <div className="export-preview__info-row">
          <span className="export-preview__info-label">Taille</span>
          <span className="export-preview__info-value">{qrConfig.size}px</span>
        </div>
        <div className="export-preview__info-row">
          <span className="export-preview__info-label">Format</span>
          <span className="export-preview__info-value">{selectedFormat.toUpperCase()}</span>
        </div>
      </div>
    </div>
  )

  const rightPanel = (
    <div className="export-config">
      <h2 className="export-config__title">Format d'exportation</h2>

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

      <div className="export-config__divider" />

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
        <label className="export-config__checkbox-row">
          <input
            type="checkbox"
            checked={batchZip}
            onChange={(e) => setBatchZip(e.target.checked)}
          />
          <span>Exporter en ZIP</span>
        </label>
        <p className="export-config__batch-note">🚧 Fonctionnalité batch en développement</p>
      </div>

      {error && (
        <div className="export-config__error">
          {error}
        </div>
      )}

      <Button
        variant="primary"
        size="lg"
        icon={Download}
        fullWidth
        onClick={handleExport}
        disabled={exporting}
      >
        {exporting ? 'Export en cours...' : `Exporter en ${selectedFormat.toUpperCase()}`}
      </Button>
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
