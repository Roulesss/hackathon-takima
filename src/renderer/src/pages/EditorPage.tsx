import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowLeft, Save, Settings, QrCode, CreditCard, FileImage, Download, AlertTriangle, Check } from 'lucide-react'
import { Toolbar } from '@renderer/components/layout'
import { SplitLayout } from '@renderer/components/layout'
import { Button, IconButton, Tabs, Modal } from '@renderer/components/common'
import { createQrInstance, checkContrast } from '@renderer/utils'
import type { QrConfig, DotStyle, CornerStyle, CornerDotStyle, ActivityType } from '@renderer/types'
import './EditorPage.css'

interface EditorPageProps {
  onNavigate: (page: string, data?: Record<string, unknown>) => void
  initialActivity?: ActivityType
  qrConfig: QrConfig
  onConfigChange: (config: QrConfig) => void
}

const DOT_STYLES: DotStyle[] = ['square', 'dots', 'rounded', 'extra-rounded', 'classy', 'classy-rounded']
const CORNER_STYLES: CornerStyle[] = ['square', 'dot', 'extra-rounded']
const CORNER_DOT_STYLES: CornerDotStyle[] = ['square', 'dot']

const ACTIVITY_TABS = [
  { id: 'qr-code', label: 'QR Code', icon: QrCode },
  { id: 'business-card', label: 'Carte de visite', icon: CreditCard },
  { id: 'document', label: 'Document', icon: FileImage }
]

export function EditorPage({
  onNavigate,
  initialActivity = 'qr-code',
  qrConfig,
  onConfigChange
}: EditorPageProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<string>(initialActivity)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [useCustomCornerColor, setUseCustomCornerColor] = useState(false)
  const [useCustomCornerDotColor, setUseCustomCornerDotColor] = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)

  const contrast = checkContrast(
    qrConfig.style.colors.foreground,
    qrConfig.style.colors.background
  )

  const renderQr = useCallback(() => {
    if (!qrRef.current) return
    qrRef.current.innerHTML = ''
    const qr = createQrInstance(qrConfig)
    qr.append(qrRef.current)
  }, [qrConfig])

  useEffect(() => {
    renderQr()
  }, [renderQr])

  const handleRawExport = async (): Promise<void> => {
    const { exportQrAsBlob } = await import('@renderer/utils/qrGenerator')
    const blob = await exportQrAsBlob(qrConfig, 'png')
    if (blob) {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'qr-raw.png'
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const updateField = <K extends keyof QrConfig>(key: K, value: QrConfig[K]): void => {
    onConfigChange({ ...qrConfig, [key]: value })
  }

  const updateColor = (key: string, value: string): void => {
    onConfigChange({
      ...qrConfig,
      style: {
        ...qrConfig.style,
        colors: { ...qrConfig.style.colors, [key]: value }
      }
    })
  }

  const updateStyleProp = (key: string, value: string): void => {
    onConfigChange({
      ...qrConfig,
      style: { ...qrConfig.style, [key]: value }
    })
  }

  const previewPanel = (
    <div className="editor-preview">
      <div className="editor-preview__qr-container">
        <div ref={qrRef} className="editor-preview__qr" />
      </div>

      {!contrast.isReadable && (
        <div className="editor-preview__warning">
          <AlertTriangle size={16} />
          <span>{contrast.message}</span>
        </div>
      )}

      {contrast.isReadable && contrast.level !== 'AAA' && (
        <div className="editor-preview__info">
          <Check size={16} />
          <span>{contrast.message}</span>
          <span className="editor-preview__ratio">Ratio: {contrast.ratio.toFixed(1)}:1</span>
        </div>
      )}

      <div className="editor-preview__actions">
        <Button variant="ghost" size="sm" onClick={handleRawExport}>
          Raw Export
        </Button>
      </div>
    </div>
  )

  const configPanel = (
    <div className="editor-config">
      {activeTab === 'qr-code' ? (
        <>
          <div className="editor-config__section">
            <label className="editor-config__label">URL / Lien</label>
            <input
              type="url"
              className="editor-config__input editor-config__input--url"
              value={qrConfig.url}
              onChange={(e) => updateField('url', e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          <div className="editor-config__section">
            <label className="editor-config__label">
              Taille: {qrConfig.size}px
            </label>
            <input
              type="range"
              className="editor-config__slider"
              min={100}
              max={1000}
              step={10}
              value={qrConfig.size}
              onChange={(e) => updateField('size', Number(e.target.value))}
            />
          </div>

          <div className="editor-config__section">
            <label className="editor-config__label">
              Marge: {qrConfig.margin}px
            </label>
            <input
              type="range"
              className="editor-config__slider"
              min={0}
              max={50}
              step={1}
              value={qrConfig.margin}
              onChange={(e) => updateField('margin', Number(e.target.value))}
            />
          </div>

          <div className="editor-config__divider" />

          <div className="editor-config__section">
            <label className="editor-config__label">Couleurs</label>
            <div className="editor-config__color-group">
              <div className="editor-config__color-row">
                <span className="editor-config__color-label">Premier plan</span>
                <input
                  type="color"
                  className="editor-config__color-input"
                  value={qrConfig.style.colors.foreground}
                  onChange={(e) => updateColor('foreground', e.target.value)}
                />
              </div>
              <div className="editor-config__color-row">
                <span className="editor-config__color-label">Arrière-plan</span>
                <input
                  type="color"
                  className="editor-config__color-input"
                  value={qrConfig.style.colors.background}
                  onChange={(e) => updateColor('background', e.target.value)}
                />
              </div>
              <div className="editor-config__color-row">
                <label className="editor-config__checkbox-row">
                  <input
                    type="checkbox"
                    checked={useCustomCornerColor}
                    onChange={(e) => setUseCustomCornerColor(e.target.checked)}
                  />
                  <span className="editor-config__color-label">Coins (carré)</span>
                </label>
                {useCustomCornerColor && (
                  <input
                    type="color"
                    className="editor-config__color-input"
                    value={qrConfig.style.colors.cornerSquareColor || qrConfig.style.colors.foreground}
                    onChange={(e) => updateColor('cornerSquareColor', e.target.value)}
                  />
                )}
              </div>
              <div className="editor-config__color-row">
                <label className="editor-config__checkbox-row">
                  <input
                    type="checkbox"
                    checked={useCustomCornerDotColor}
                    onChange={(e) => setUseCustomCornerDotColor(e.target.checked)}
                  />
                  <span className="editor-config__color-label">Coins (point)</span>
                </label>
                {useCustomCornerDotColor && (
                  <input
                    type="color"
                    className="editor-config__color-input"
                    value={qrConfig.style.colors.cornerDotColor || qrConfig.style.colors.foreground}
                    onChange={(e) => updateColor('cornerDotColor', e.target.value)}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="editor-config__divider" />

          <div className="editor-config__section">
            <label className="editor-config__label">Style des points</label>
            <div className="editor-config__style-grid">
              {DOT_STYLES.map((style) => (
                <button
                  key={style}
                  className={`editor-config__style-btn ${qrConfig.style.dotStyle === style ? 'editor-config__style-btn--active' : ''}`}
                  onClick={() => updateStyleProp('dotStyle', style)}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div className="editor-config__section">
            <label className="editor-config__label">Style des coins</label>
            <div className="editor-config__style-grid">
              {CORNER_STYLES.map((style) => (
                <button
                  key={style}
                  className={`editor-config__style-btn ${qrConfig.style.cornerStyle === style ? 'editor-config__style-btn--active' : ''}`}
                  onClick={() => updateStyleProp('cornerStyle', style)}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div className="editor-config__section">
            <label className="editor-config__label">Style des points de coin</label>
            <div className="editor-config__style-grid">
              {CORNER_DOT_STYLES.map((style) => (
                <button
                  key={style}
                  className={`editor-config__style-btn ${qrConfig.style.cornerDotStyle === style ? 'editor-config__style-btn--active' : ''}`}
                  onClick={() => updateStyleProp('cornerDotStyle', style)}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="editor-config__placeholder">
          <p>🚧 Fonctionnalité en cours de développement</p>
          <p className="editor-config__placeholder-hint">
            La configuration QR ci-dessous reste accessible
          </p>
        </div>
      )}
    </div>
  )

  return (
    <div className="editor page-enter page-active">
      <Toolbar
        left={
          <IconButton
            icon={ArrowLeft}
            onClick={() => onNavigate('activity-choice')}
            tooltip="Retour"
          />
        }
        center={
          <Tabs
            tabs={ACTIVITY_TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        }
        right={
          <div style={{ display: 'flex', gap: '4px' }}>
            <IconButton
              icon={Save}
              tooltip="Sauvegarder"
              onClick={async () => {
                try {
                  const dataToSave = JSON.stringify(qrConfig, null, 2)
                  if (window.api && window.api.saveFileDialog) {
                    const { canceled, filePath } = await window.api.saveFileDialog({
                      defaultPath: 'projet-qr.json',
                      filters: [{ name: 'JSON', extensions: ['json'] }]
                    })
                    if (!canceled && filePath) {
                      await window.api.writeFile(filePath, dataToSave)
                    }
                  } else {
                    const blob = new Blob([dataToSave], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = 'projet-qr.json'
                    a.click()
                    URL.revokeObjectURL(url)
                  }
                } catch (err) {
                  console.error('Failed to save project:', err)
                }
              }}
            />
            <IconButton icon={Settings} tooltip="Paramètres" onClick={() => setSettingsOpen(true)} />
          </div>
        }
      />

      <div className="editor__body">
        <SplitLayout
          left={previewPanel}
          right={configPanel}
          defaultLeftSize={45}
          minLeftSize={30}
          minRightSize={35}
        />
      </div>

      <div className="editor__footer">
        <Button
          variant="primary"
          icon={Download}
          onClick={() => onNavigate('export')}
        >
          Exporter
        </Button>
      </div>

      <Modal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} title="Paramètres du projet">
        <p style={{ color: 'var(--color-text-secondary)' }}>Paramètres du projet à configurer ici.</p>
      </Modal>
    </div>
  )
}
