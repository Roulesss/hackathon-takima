import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowLeft, Save, Settings, QrCode, CreditCard, FileImage, Download, AlertTriangle, Check, Plus, Trash2, UploadCloud, MoveHorizontal, MoveVertical, Maximize, FileText, Image as ImageIcon } from 'lucide-react'
import { Toolbar } from '@renderer/components/layout'
import { SplitLayout } from '@renderer/components/layout'
import { Button, IconButton, Tabs, SettingsModal } from '@renderer/components/common'
import { createQrInstance, checkContrast, exportQrAsBlob, addQrToPdf, addQrToImage } from '@renderer/utils'
import type { QrConfig, DotStyle, CornerStyle, CornerDotStyle, ActivityType, ProjectConfig } from '@renderer/types'

import './EditorPage.css'

interface EditorPageProps {
  onNavigate: (page: string, data?: Record<string, unknown>) => void
  initialActivity?: ActivityType
  qrConfig: QrConfig
  onConfigChange: (config: QrConfig) => void
  templateBytes: Uint8Array | null
  setTemplateBytes: (bytes: Uint8Array | null) => void
  templateMimeType: string
  setTemplateMimeType: (mimeType: string) => void
  templateOptions: { x: number; y: number; size: number; pageIndex: number }
  setTemplateOptions: (options: { x: number; y: number; size: number; pageIndex: number }) => void
  onSaveProject?: (project: ProjectConfig) => void
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
  onConfigChange,
  templateBytes,
  setTemplateBytes,
  templateMimeType,
  setTemplateMimeType,
  templateOptions,
  setTemplateOptions,
  onSaveProject
}: EditorPageProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<string>(initialActivity)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [useCustomCornerColor, setUseCustomCornerColor] = useState(false)
  const [useCustomCornerDotColor, setUseCustomCornerDotColor] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [batchUrls, setBatchUrls] = useState<string[]>(qrConfig.batchUrls || [])
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null)
  const [debouncedTemplateOptions, setDebouncedTemplateOptions] = useState(templateOptions)
  const qrRef = useRef<HTMLDivElement>(null)

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    onNavigate('editor', { activity: tabId })
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTemplateOptions(templateOptions)
    }, 50)
    return () => clearTimeout(timer)
  }, [templateOptions])

  const contrast = checkContrast(
    qrConfig.style.colors.foreground,
    qrConfig.style.colors.background
  )

  const renderQr = useCallback(() => {
    if (!qrRef.current) return
    qrRef.current.innerHTML = ''
    const previewUrl = batchUrls.length > 0 ? batchUrls[0] : qrConfig.url
    const qr = createQrInstance({ ...qrConfig, url: previewUrl })
    qr.append(qrRef.current)
  }, [qrConfig, batchUrls])

  useEffect(() => {
    renderQr()
  }, [renderQr, activeTab])

  useEffect(() => {
    let active = true
    const updatePreview = async () => {
      if (activeTab === 'document' && templateBytes) {
        try {
          const previewUrl = batchUrls.length > 0 ? batchUrls[0] : qrConfig.url
          const pngBlob = await exportQrAsBlob({ ...qrConfig, url: previewUrl }, 'png')
          if (!pngBlob) return
          const arrayBuffer = await pngBlob.arrayBuffer()
          
          if (templateMimeType === 'application/pdf') {
            const pdfBytes = await addQrToPdf(
              templateBytes,
              new Uint8Array(arrayBuffer),
              debouncedTemplateOptions
            )
            if (!active) return
            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
            const url = URL.createObjectURL(blob)
            setPdfPreviewUrl(`${url}#page=${debouncedTemplateOptions.pageIndex + 1}`)
          } else {
            const imgBytes = await addQrToImage(
              templateBytes,
              new Uint8Array(arrayBuffer),
              debouncedTemplateOptions,
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
  }, [activeTab, templateBytes, templateMimeType, debouncedTemplateOptions, qrConfig, batchUrls])

  const handleImportDocument = async () => {
    if (window.api && window.api.openFileDialog) {
      const result = await window.api.openFileDialog({
        filters: [{ name: 'Documents et Images', extensions: ['pdf', 'png', 'jpg', 'jpeg'] }],
        properties: ['openFile']
      })
      if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0]
        const ext = filePath.split('.').pop()?.toLowerCase()
        const mimeType = ext === 'pdf' ? 'application/pdf' : ext === 'png' ? 'image/png' : 'image/jpeg'
        
        const readResult = await window.api.readBinaryFile(filePath)
        if (readResult.success && readResult.data) {
          setTemplateBytes(new Uint8Array(readResult.data))
          setTemplateMimeType(mimeType)
        }
      }
    }
  }

  const handleClearTemplate = () => {
    setTemplateBytes(null)
  }

  const handleRawExport = async (): Promise<void> => {
    const { exportQrAsBlob } = await import('@renderer/utils/qrGenerator')
    const previewUrl = batchUrls.length > 0 ? batchUrls[0] : qrConfig.url
    const rawConfig = { ...qrConfig, url: previewUrl }
    const blob = await exportQrAsBlob(rawConfig, 'png')
    if (blob) {
      if (window.api && window.api.saveFileDialog) {
        const arrayBuffer = await blob.arrayBuffer()
        const { canceled, filePath } = await window.api.saveFileDialog({
          defaultPath: 'qr-raw.png',
          filters: [{ name: 'PNG', extensions: ['png'] }]
        })
        if (!canceled && filePath) {
          await window.api.writeBinaryFile(filePath, arrayBuffer)
        }
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'qr-raw.png'
        a.click()
        URL.revokeObjectURL(url)
      }
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
      {activeTab === 'document' && pdfPreviewUrl ? (
        <div className="editor-preview__pdf-container" style={{ width: '100%', height: '100%', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
          <iframe src={pdfPreviewUrl} width="100%" height="100%" style={{ flexGrow: 1, borderRadius: '12px', border: 'none' }} title="PDF Preview">
            <p>Impossible d'afficher le PDF</p>
          </iframe>
        </div>
      ) : (
        <div className="editor-preview__qr-container">
          <div ref={qrRef} className="editor-preview__qr" />
        </div>
      )}

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="editor-config__label" style={{ marginBottom: 0 }}>URLs / Liens</label>
            </div>
            
            {batchUrls.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {batchUrls.map((url, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '4px' }}>
                    <input
                      type="url"
                      className="editor-config__input editor-config__input--url"
                      value={url}
                      onChange={(e) => {
                        const newUrls = [...batchUrls]
                        newUrls[idx] = e.target.value
                        setBatchUrls(newUrls)
                        updateField('batchUrls', newUrls)
                      }}
                      placeholder="https://example.com"
                    />
                    <IconButton 
                      icon={Trash2} 
                      onClick={() => {
                        const newUrls = batchUrls.filter((_, i) => i !== idx)
                        if (newUrls.length === 0) {
                          updateField('batchUrls', undefined)
                        } else {
                          updateField('batchUrls', newUrls)
                        }
                        setBatchUrls(newUrls)
                      }} 
                    />
                  </div>
                ))}
                <Button 
                  variant="secondary" 
                  size="sm" 
                  icon={Plus} 
                  onClick={() => {
                    const newUrls = [...batchUrls, '']
                    setBatchUrls(newUrls)
                    updateField('batchUrls', newUrls)
                  }}
                >
                  Ajouter une URL
                </Button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <input
                    type="url"
                    className="editor-config__input editor-config__input--url"
                    value={qrConfig.url}
                    onChange={(e) => updateField('url', e.target.value)}
                    placeholder="https://example.com"
                  />
                  <IconButton 
                    icon={Plus} 
                    tooltip="Passer en mode lot (batch)"
                    onClick={() => {
                      const newUrls = [qrConfig.url, '']
                      setBatchUrls(newUrls)
                      updateField('batchUrls', newUrls)
                    }} 
                  />
                </div>
              </div>
            )}
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
      ) : activeTab === 'document' ? (
        <div className="editor-config__section">
          {!templateBytes ? (
            <div
              className={`editor-document__dropzone ${isDragging ? 'is-dragging' : ''}`}
              onClick={handleImportDocument}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={(e) => {
                e.preventDefault()
                setIsDragging(false)
              }}
              onDrop={async (e) => {
                e.preventDefault()
                setIsDragging(false)
                const file = e.dataTransfer.files?.[0]
                if (file) {
                  const ext = file.name.split('.').pop()?.toLowerCase()
                  const mimeType = ext === 'pdf' ? 'application/pdf' : ext === 'png' ? 'image/png' : 'image/jpeg'
                  if (['pdf', 'png', 'jpg', 'jpeg'].includes(ext || '')) {
                    const filePath = (file as File & { path: string }).path
                    const readResult = await window.api.readBinaryFile(filePath)
                    if (readResult.success && readResult.data) {
                      setTemplateBytes(new Uint8Array(readResult.data))
                      setTemplateMimeType(mimeType)
                    }
                  }
                }
              }}
            >
              <UploadCloud size={48} className="editor-document__dropzone-icon" />
              <span className="editor-document__dropzone-text">Importer un document</span>
              <span className="editor-document__dropzone-subtext">
                Glissez-déposez un PDF ou une image, ou cliquez pour parcourir
              </span>
            </div>
          ) : (
            <>
              <div className="editor-document__file-card">
                <div className="editor-document__file-info">
                  {templateMimeType === 'application/pdf' ? (
                    <FileText size={24} className="editor-document__file-icon" />
                  ) : (
                    <ImageIcon size={24} className="editor-document__file-icon" />
                  )}
                  <span className="editor-document__file-name">
                    {templateMimeType === 'application/pdf' ? 'Document PDF' : 'Image'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button variant="secondary" size="sm" onClick={handleImportDocument}>
                    Remplacer
                  </Button>
                  <IconButton icon={Trash2} onClick={handleClearTemplate} tooltip="Supprimer" />
                </div>
              </div>

              <div className="editor-document__card">
                <div className="editor-document__card-header">
                  <MoveHorizontal size={18} className="editor-document__card-icon" />
                  Positionnement & Taille
                </div>

                <div className="editor-document__presets">
                  <button className="editor-document__preset-btn" onClick={() => setTemplateOptions({ ...templateOptions, x: Math.round(20 + templateOptions.size / 2), y: Math.round(20 + templateOptions.size / 2) })}>
                    Haut Gauche
                  </button>
                  <button className="editor-document__preset-btn" onClick={() => setTemplateOptions({ ...templateOptions, x: Math.round(600 - 20 - templateOptions.size / 2), y: Math.round(20 + templateOptions.size / 2) })}>
                    Haut Droit
                  </button>
                  <button className="editor-document__preset-btn" onClick={() => setTemplateOptions({ ...templateOptions, x: 300, y: 425 })}>
                    Milieu
                  </button>
                  <button className="editor-document__preset-btn" onClick={() => setTemplateOptions({ ...templateOptions, x: Math.round(20 + templateOptions.size / 2), y: Math.round(850 - 20 - templateOptions.size / 2) })}>
                    Bas Gauche
                  </button>
                  <button className="editor-document__preset-btn" onClick={() => setTemplateOptions({ ...templateOptions, x: Math.round(600 - 20 - templateOptions.size / 2), y: Math.round(850 - 20 - templateOptions.size / 2) })}>
                    Bas Droit
                  </button>
                </div>
                
                <div className="editor-document__slider-row">
                  <div className="editor-document__slider-label">
                    <MoveHorizontal size={14} className="editor-document__card-icon" /> X
                  </div>
                  <input
                    type="range"
                    className="editor-config__slider"
                    min="0"
                    max="600"
                    step="1"
                    value={templateOptions.x}
                    onChange={(e) => setTemplateOptions({ ...templateOptions, x: parseInt(e.target.value) || 0 })}
                  />
                  <input
                    type="number"
                    className="editor-config__input"
                    value={templateOptions.x}
                    onChange={(e) => setTemplateOptions({ ...templateOptions, x: parseInt(e.target.value) || 0 })}
                    style={{ width: '70px', margin: 0, padding: '4px 8px' }}
                  />
                </div>

                <div className="editor-document__slider-row">
                  <div className="editor-document__slider-label">
                    <MoveVertical size={14} className="editor-document__card-icon" /> Y
                  </div>
                  <input
                    type="range"
                    className="editor-config__slider"
                    min="0"
                    max="850"
                    step="1"
                    value={templateOptions.y}
                    onChange={(e) => setTemplateOptions({ ...templateOptions, y: parseInt(e.target.value) || 0 })}
                  />
                  <input
                    type="number"
                    className="editor-config__input"
                    value={templateOptions.y}
                    onChange={(e) => setTemplateOptions({ ...templateOptions, y: parseInt(e.target.value) || 0 })}
                    style={{ width: '70px', margin: 0, padding: '4px 8px' }}
                  />
                </div>

                <div className="editor-document__slider-row">
                  <div className="editor-document__slider-label">
                    <Maximize size={14} className="editor-document__card-icon" /> Taille
                  </div>
                  <input
                    type="range"
                    className="editor-config__slider"
                    min="10"
                    max="600"
                    step="1"
                    value={templateOptions.size}
                    onChange={(e) => setTemplateOptions({ ...templateOptions, size: parseInt(e.target.value) || 0 })}
                  />
                  <input
                    type="number"
                    className="editor-config__input"
                    value={templateOptions.size}
                    onChange={(e) => setTemplateOptions({ ...templateOptions, size: parseInt(e.target.value) || 0 })}
                    style={{ width: '70px', margin: 0, padding: '4px 8px' }}
                  />
                </div>
              </div>

              {templateMimeType === 'application/pdf' && (
                <div className="editor-document__card">
                  <div className="editor-document__card-header">
                    <FileText size={18} className="editor-document__card-icon" />
                    Options PDF
                  </div>
                  <div className="editor-document__slider-row">
                    <div className="editor-document__slider-label">Numéro de page</div>
                    <input
                      type="number"
                      className="editor-config__input"
                      value={templateOptions.pageIndex + 1}
                      onChange={(e) => {
                        const val = parseInt(e.target.value)
                        setTemplateOptions({ ...templateOptions, pageIndex: isNaN(val) ? 0 : Math.max(0, val - 1) })
                      }}
                      min="1"
                      style={{ flex: 1, margin: 0 }}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
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
            onClick={() => onNavigate('home')}
            tooltip="Retour"
          />
        }
        center={
          <Tabs
            tabs={ACTIVITY_TABS}
            activeTab={activeTab}
            onTabChange={handleTabChange}
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
                      if (onSaveProject) {
                        onSaveProject({
                          id: Date.now().toString(),
                          name: filePath.split('/').pop() || 'projet-qr',
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString(),
                          activityType: activeTab as ActivityType,
                          qrConfig,
                          filePath
                        })
                      }
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

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
