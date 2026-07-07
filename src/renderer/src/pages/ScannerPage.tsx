import { useState, useRef } from 'react'
import { ArrowLeft, Copy, ExternalLink, Upload, Check, ScanLine } from 'lucide-react'
import { Toolbar } from '@renderer/components/layout'
import { SplitLayout } from '@renderer/components/layout'
import { Button, IconButton } from '@renderer/components/common'
import { scanQrFromFile } from '@renderer/utils'
import './ScannerPage.css'

interface ScannerPageProps {
  onNavigate: (page: string, data?: Record<string, unknown>) => void
}

export function ScannerPage({ onNavigate }: ScannerPageProps): React.JSX.Element {
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

  const isHttpUrl = scanResult?.data && (scanResult.data.startsWith('http://') || scanResult.data.startsWith('https://'))

  const leftPanel = (
    <div className="scanner-preview" style={{ background: 'var(--color-bg-primary)', width: '100%', height: '100%', overflow: 'hidden' }}>
      {isHttpUrl ? (
        <webview
          src={scanResult.data}
          title="Prévisualisation du lien"
          style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-tertiary)' }}>
            <>
              <ScanLine size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
              {imageUrl && !isHttpUrl ? (
                <>
                  <p>Aucun aperçu web disponible</p>
                  <p style={{ fontSize: '12px', marginTop: 8 }}>Le contenu scanné n'est pas un lien valide</p>
                </>
              ) : (
                <>
                  <p>Importez un QR Code pour le décoder</p>
                  <p style={{ fontSize: '12px', marginTop: 8 }}>Aperçu web disponible pour les liens valides</p>
                </>
              )}
            </>
        </div>
      )}
    </div>
  )

  const rightPanel = (
    <div className="scanner-result" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', height: '100%', overflowY: 'auto' }}>
      <div>
        <h2 className="scanner-result__title" style={{ marginBottom: 'var(--space-4)' }}>Importer un QR Code</h2>
        
        <div
          className="scanner-preview__dropzone"
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          style={{ padding: imageUrl ? '0' : undefined, overflow: 'hidden' }}
        >
          {imageUrl ? (
            <img src={imageUrl} alt="Image importée" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <>
              <Upload className="scanner-preview__upload-icon" />
              <p className="scanner-preview__dropzone-title">Glissez une image ici</p>
              <p className="scanner-preview__dropzone-hint">ou cliquez pour parcourir</p>
            </>
          )}
        </div>
        
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
          <div style={{ marginTop: 'var(--space-3)', display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setImageUrl(null)
                setScanResult(null)
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
            >
              Effacer
            </Button>
          </div>
        )}
      </div>

      <div>
        <h2 className="scanner-result__title" style={{ marginBottom: 'var(--space-4)' }}>Résultat de l'analyse</h2>

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

            <div className="scanner-result__link-container" style={{ marginTop: 'var(--space-4)' }}>
              <label className="scanner-result__label">Contenu détecté</label>
              <div className="scanner-result__link-box">
                <span className="scanner-result__link">{scanResult.data}</span>
                <div className="scanner-result__link-actions">
                  <IconButton
                    icon={copied ? Check : Copy}
                    size="sm"
                    tooltip="Copier"
                    onClick={handleCopy}
                  />
                  {isHttpUrl && (
                    <IconButton
                      icon={ExternalLink}
                      size="sm"
                      tooltip="Ouvrir dans le navigateur"
                      onClick={() => window.open(scanResult.data, '_blank')}
                    />
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )

  return (
    <div className="scanner page-enter page-active">
      <Toolbar
        left={
          <IconButton
            icon={ArrowLeft}
            onClick={() => onNavigate('home')}
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
