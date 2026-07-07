import { useState, useRef } from 'react'
import { ArrowLeft, Copy, ExternalLink, Upload, Check } from 'lucide-react'
import { Toolbar } from '@renderer/components/layout'
import { SplitLayout } from '@renderer/components/layout'
import { Button, IconButton } from '@renderer/components/common'
import { scanQrFromFile } from '@renderer/utils'
import './ScannerPage.css'

interface ScannerPageProps {
  onNavigate: (page: string, data?: Record<string, unknown>) => void
}

export function ScannerPage({ onNavigate }: ScannerPageProps): JSX.Element {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [scanResult, setScanResult] = useState<{ data?: string; error?: string } | null>(null)
  const [scanning, setScanning] = useState(false)
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File): Promise<void> => {
    const url = URL.createObjectURL(file)
    setImageUrl(url)
    setScanning(true)
    setScanResult(null)

    const result = await scanQrFromFile(file)
    setScanning(false)
    setScanResult(result.success ? { data: result.data } : { error: result.error })
  }

  const handleDrop = (e: React.DragEvent): void => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handleFile(file)
    }
  }

  const handleCopy = async (): Promise<void> => {
    if (scanResult?.data) {
      await navigator.clipboard.writeText(scanResult.data)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const leftPanel = (
    <div className="scanner-preview">
      {imageUrl ? (
        <div className="scanner-preview__image-container">
          <img src={imageUrl} alt="Image importée" className="scanner-preview__image" />
        </div>
      ) : (
        <div
          className="scanner-preview__dropzone"
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <Upload className="scanner-preview__upload-icon" />
          <p className="scanner-preview__dropzone-title">Glissez une image ici</p>
          <p className="scanner-preview__dropzone-hint">ou cliquez pour parcourir</p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />

      {imageUrl && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setImageUrl(null)
            setScanResult(null)
          }}
        >
          Charger une autre image
        </Button>
      )}
    </div>
  )

  const rightPanel = (
    <div className="scanner-result">
      <h2 className="scanner-result__title">Résultat du scan</h2>

      {!imageUrl && (
        <div className="scanner-result__status scanner-result__status--waiting">
          En attente d'une image...
        </div>
      )}

      {scanning && (
        <div className="scanner-result__status scanner-result__status--scanning">
          Analyse en cours...
        </div>
      )}

      {scanResult?.error && (
        <div className="scanner-result__status scanner-result__status--error">
          {scanResult.error}
        </div>
      )}

      {scanResult?.data && (
        <>
          <div className="scanner-result__status scanner-result__status--success">
            ✅ QR Code détecté !
          </div>

          <div className="scanner-result__link-container">
            <label className="scanner-result__label">Lien détecté</label>
            <div className="scanner-result__link-box">
              <span className="scanner-result__link">{scanResult.data}</span>
              <div className="scanner-result__link-actions">
                <IconButton
                  icon={copied ? Check : Copy}
                  size="sm"
                  tooltip="Copier"
                  onClick={handleCopy}
                />
                <IconButton
                  icon={ExternalLink}
                  size="sm"
                  tooltip="Ouvrir dans le navigateur"
                  onClick={() => window.open(scanResult.data, '_blank')}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )

  return (
    <div className="scanner page-enter page-active">
      <Toolbar
        left={
          <IconButton
            icon={ArrowLeft}
            onClick={() => onNavigate('activity-choice')}
            tooltip="Retour"
          />
        }
        center={<span style={{ fontWeight: 600 }}>Scanner un QR Code</span>}
      />
      <div className="scanner__body">
        <SplitLayout
          left={leftPanel}
          right={rightPanel}
          defaultLeftSize={55}
        />
      </div>
    </div>
  )
}
