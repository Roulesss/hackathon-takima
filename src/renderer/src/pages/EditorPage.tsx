import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowLeft, Save, Settings, QrCode, CreditCard, FileImage, Download, AlertTriangle, Check, Plus, Trash2, UploadCloud, MoveHorizontal, MoveVertical, Maximize, FileText, Image as ImageIcon } from 'lucide-react'
import { Toolbar } from '@renderer/components/layout'
import { SplitLayout } from '@renderer/components/layout'
import { Button, IconButton, Tabs, SettingsModal } from '@renderer/components/common'
import { createQrInstance, checkContrast, exportQrAsBlob, exportQrAsDataUrl, addQrToPdf, addQrToImage } from '@renderer/utils'
import { useBusinessCardConfig } from '@renderer/hooks'
import { BusinessCardPreview } from '@renderer/components/business-card/BusinessCardPreview'
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
  templateOptions: { x: number; y: number; size: number; pageIndex: number }[]
  setTemplateOptions: (options: { x: number; y: number; size: number; pageIndex: number }[]) => void
  onSaveProject?: (project: ProjectConfig) => void
  businessCardConfig?: import('@renderer/types').BusinessCardConfig
  onBusinessCardConfigChange?: (config: import('@renderer/types').BusinessCardConfig) => void
}

const DOT_STYLES: DotStyle[] = ['square', 'dots', 'rounded', 'extra-rounded', 'classy', 'classy-rounded']
const CORNER_STYLES: CornerStyle[] = ['square', 'dot', 'extra-rounded']
const CORNER_DOT_STYLES: CornerDotStyle[] = ['square', 'dot']

const ACTIVITY_TABS = [
  { id: 'qr-code', label: 'QR Code', icon: QrCode },
  { id: 'business-card', label: 'Carte de visite', icon: CreditCard },
  { id: 'document', label: 'Document', icon: FileImage }
]

const QrThumbnail = ({ config, url }: { config: QrConfig, url: string }) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  useEffect(() => {
    let active = true
    exportQrAsDataUrl({ ...config, url, size: 200 }).then(res => {
      if (active) setDataUrl(res)
    }).catch(console.error)
    return () => { active = false }
  }, [config, url])
  return (
    <div style={{ width: 40, height: 40, borderRadius: 4, overflow: 'hidden', flexShrink: 0, backgroundColor: config.style.colors.background }}>
      {dataUrl && <img src={dataUrl} alt="QR Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
    </div>
  )
}

export function EditorPage(props: EditorPageProps): React.JSX.Element {
  const {
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
  } = props
  const [activeTab, setActiveTab] = useState<string>(initialActivity)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [useCustomCornerColor, setUseCustomCornerColor] = useState(false)
  const [useCustomCornerDotColor, setUseCustomCornerDotColor] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [batchUrls, setBatchUrls] = useState<string[]>(qrConfig.batchUrls || [])
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null)
  const [debouncedTemplateOptions, setDebouncedTemplateOptions] = useState(templateOptions)
  const { config: bcConfigLocal, setConfig: setBcConfigLocal } = useBusinessCardConfig()
  const bcConfig = props.businessCardConfig || bcConfigLocal
  const setBcConfig = (newConfig: import('@renderer/types').BusinessCardConfig | ((prev: import('@renderer/types').BusinessCardConfig) => import('@renderer/types').BusinessCardConfig)) => {
    let updatedConfig: import('@renderer/types').BusinessCardConfig;
    if (typeof newConfig === 'function') {
      updatedConfig = newConfig(bcConfig);
    } else {
      updatedConfig = newConfig;
    }
    setBcConfigLocal(updatedConfig)
    if (props.onBusinessCardConfigChange) {
      props.onBusinessCardConfigChange(updatedConfig)
    }
  }
  const [lastModifiedIndex, setLastModifiedIndex] = useState<number>(0)
  const [templateDimensions, setTemplateDimensions] = useState<{width: number, height: number}>({ width: 600, height: 850 })
  const [previewIndex, setPreviewIndex] = useState(0)
  const qrRef = useRef<HTMLDivElement>(null)

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    onNavigate('editor', { activity: tabId })
  }

  useEffect(() => {
    // Longer debounce for PDF to prevent continuous iframe reloading and zoom resets while dragging
    const delay = templateMimeType === 'application/pdf' ? 500 : 50
    const timer = setTimeout(() => {
      setDebouncedTemplateOptions(templateOptions)
    }, delay)
    return () => clearTimeout(timer)
  }, [templateOptions, templateMimeType])

  useEffect(() => {
    if (!templateBytes) return
    let active = true
    const updateDims = async () => {
      if (templateMimeType === 'application/pdf') {
        try {
          const { PDFDocument } = await import('pdf-lib')
          const pdfDoc = await PDFDocument.load(templateBytes)
          const pages = pdfDoc.getPages()
          if (pages.length > 0 && active) {
            const { width, height } = pages[0].getSize()
            setTemplateDimensions({ width: Math.round(width), height: Math.round(height) })
          }
        } catch (e) {
          console.error(e)
        }
      } else {
        const blob = new Blob([templateBytes as any], { type: templateMimeType })
        const url = URL.createObjectURL(blob)
        const img = new Image()
        img.onload = () => {
          if (active) setTemplateDimensions({ width: img.width, height: img.height })
          URL.revokeObjectURL(url)
        }
        img.src = url
      }
    }
    updateDims()
    return () => { active = false }
  }, [templateBytes, templateMimeType])

  useEffect(() => {
    const needed = Math.max(1, batchUrls.length)
    if (templateOptions.length !== needed) {
      const newOptions = [...templateOptions]
      const defaultOpt = templateOptions[0] || { x: 50, y: 50, size: 150, pageIndex: 0 }
      while (newOptions.length < needed) {
        newOptions.push({ ...defaultOpt })
      }
      if (newOptions.length > needed) {
        newOptions.length = needed
      }
      setTemplateOptions(newOptions)
    }
  }, [batchUrls, templateOptions, setTemplateOptions])

  const contrast = checkContrast(
    qrConfig.style.colors.foreground,
    qrConfig.style.colors.background
  )

  const renderQr = useCallback(() => {
    if (!qrRef.current) return
    qrRef.current.innerHTML = ''
    const urls = batchUrls.length > 0 ? batchUrls : [qrConfig.url]
    const previewUrl = urls[previewIndex] || urls[0]
    const qr = createQrInstance({ ...qrConfig, url: previewUrl })
    qr.append(qrRef.current)
  }, [qrConfig, batchUrls, previewIndex])

  useEffect(() => {
    renderQr()
  }, [renderQr, activeTab])

  useEffect(() => {
    let active = true
    const updatePreview = async () => {
      if (activeTab === 'document' && templateBytes) {
        try {
          const urls = batchUrls.length > 0 ? batchUrls : [qrConfig.url]
          
          if (templateMimeType === 'application/pdf') {
            let currentPdfBytes = templateBytes
            for (let i = 0; i < urls.length; i++) {
              const pngBlob = await exportQrAsBlob({ ...qrConfig, url: urls[i] }, 'png')
              if (!pngBlob) continue
              const arrayBuffer = await pngBlob.arrayBuffer()
              const opt = debouncedTemplateOptions[i] || debouncedTemplateOptions[0] || { x: 50, y: 50, size: 150, pageIndex: 0 }
              currentPdfBytes = await addQrToPdf(
                currentPdfBytes,
                new Uint8Array(arrayBuffer),
                opt
              )
            }
            if (!active) return
            const blob = new Blob([currentPdfBytes as any], { type: 'application/pdf' })
            const url = URL.createObjectURL(blob)
            const optToFocus = debouncedTemplateOptions[lastModifiedIndex] || debouncedTemplateOptions[0] || { pageIndex: 0 }
            setPdfPreviewUrl(`${url}#page=${optToFocus.pageIndex + 1}`)
          } else {
            let currentImgBytes = templateBytes
            for (let i = 0; i < urls.length; i++) {
              const pngBlob = await exportQrAsBlob({ ...qrConfig, url: urls[i] }, 'png')
              if (!pngBlob) continue
              const arrayBuffer = await pngBlob.arrayBuffer()
              const opt = debouncedTemplateOptions[i] || debouncedTemplateOptions[0] || { x: 50, y: 50, size: 150, pageIndex: 0 }
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
  }, [activeTab, templateBytes, templateMimeType, debouncedTemplateOptions, qrConfig, batchUrls])

  const handleImportImage = async (field: 'iconUrl' | 'backgroundImageUrl') => {
    if (window.api && window.api.openFileDialog) {
      const result = await window.api.openFileDialog({
        filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }],
        properties: ['openFile']
      })
      if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0]
        const readResult = await window.api.readBinaryFile(filePath)
        if (readResult.success && readResult.data) {
          const ext = filePath.split('.').pop()?.toLowerCase() || 'png'
          const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png'
          
          // Convert arraybuffer to base64
          const bytes = new Uint8Array(readResult.data)
          let binary = ''
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i])
          }
          const base64 = btoa(binary)
          setBcConfig({ ...bcConfig, [field]: `data:${mime};base64,${base64}` })
        }
      }
    }
  }

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
      {activeTab === 'business-card' ? (
        <BusinessCardPreview 
          config={bcConfig} 
          qrConfig={qrConfig} 
          previewUrl={(batchUrls.length > 0 ? batchUrls : [qrConfig.url])[previewIndex] || (batchUrls.length > 0 ? batchUrls[0] : qrConfig.url)} 
        />
      ) : activeTab === 'document' && pdfPreviewUrl ? (
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
      
      {batchUrls.length > 1 && activeTab !== 'document' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: '16px', background: 'var(--background-secondary)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <Button disabled={previewIndex === 0} onClick={() => setPreviewIndex(p => Math.max(0, p - 1))} variant="secondary" style={{ padding: '8px' }}>Précédent</Button>
          <span style={{ fontSize: '14px', fontWeight: 600 }}>{previewIndex + 1} / {batchUrls.length}</span>
          <Button disabled={previewIndex === batchUrls.length - 1} onClick={() => setPreviewIndex(p => Math.min(batchUrls.length - 1, p + 1))} variant="secondary" style={{ padding: '8px' }}>Suivant</Button>
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
      ) : activeTab === 'business-card' ? (
        <>
          <div className="editor-config__section">
            <label className="editor-config__label">Taille du QR Code (Miniature)</label>
            <input
              type="range"
              className="editor-config__slider"
              min={80} max={250} step={5}
              value={bcConfig.qrSize || 130}
              onChange={(e) => setBcConfig({ ...bcConfig, qrSize: Number(e.target.value) })}
            />
          </div>

          <div className="editor-config__section">
            <label className="editor-config__label">Nom et Prénom / Entreprise</label>
            <input
              type="text"
              className="editor-config__input"
              value={bcConfig.name}
              onChange={(e) => setBcConfig({ ...bcConfig, name: e.target.value })}
            />
          </div>

          <div className="editor-config__section">
            <label className="editor-config__label">"Profession / Domaine"</label>
            <input
              type="text"
              className="editor-config__input"
              value={bcConfig.professionOrDomain}
              onChange={(e) => setBcConfig({ ...bcConfig, professionOrDomain: e.target.value })}
            />
          </div>

          <div className="editor-config__section">
            <label className="editor-config__label">Lieu / Adresse</label>
            <input
              type="text"
              className="editor-config__input"
              value={bcConfig.location}
              onChange={(e) => setBcConfig({ ...bcConfig, location: e.target.value })}
            />
          </div>

          <div className="editor-config__section">
            <label className="editor-config__label">Téléphone</label>
            <input
              type="tel"
              className="editor-config__input"
              value={bcConfig.phone}
              onChange={(e) => setBcConfig({ ...bcConfig, phone: e.target.value })}
            />
          </div>

          <div className="editor-config__divider" />

          <div className="editor-config__section">
            <label className="editor-config__label">Logo / Photo de profil</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <Button onClick={() => handleImportImage('iconUrl')} variant="secondary" fullWidth>
                {bcConfig.iconUrl ? 'Changer l\'image' : 'Importer une image'}
              </Button>
              {bcConfig.iconUrl && (
                <Button onClick={() => setBcConfig({ ...bcConfig, iconUrl: undefined })} variant="secondary" style={{ padding: '0.5rem', minWidth: '40px' }}>
                  🗑️
                </Button>
              )}
            </div>
            {bcConfig.iconUrl && (
              <div style={{ marginTop: '8px' }}>
                <span style={{ fontSize: '12px', marginBottom: '4px', display: 'block' }}>Taille de l'image ({bcConfig.iconSize || 80}px)</span>
                <input
                  type="range"
                  className="editor-config__slider"
                  min={40} max={200} step={5}
                  value={bcConfig.iconSize || 80}
                  onChange={(e) => setBcConfig({ ...bcConfig, iconSize: Number(e.target.value) })}
                />
                <span style={{ fontSize: '12px', marginTop: '12px', marginBottom: '4px', display: 'block' }}>Style de l'image</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    variant={bcConfig.iconStyle === 'square' ? 'primary' : 'secondary'}
                    onClick={() => setBcConfig({ ...bcConfig, iconStyle: 'square' })}
                    style={{ flex: 1, padding: '4px' }}
                  >
                    Carré
                  </Button>
                  <Button
                    variant={bcConfig.iconStyle === 'circle' ? 'primary' : 'secondary'}
                    onClick={() => setBcConfig({ ...bcConfig, iconStyle: 'circle' })}
                    style={{ flex: 1, padding: '4px' }}
                  >
                    Cercle
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="editor-config__section">
            <label className="editor-config__label">Type d'arrière-plan</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <Button
                variant={bcConfig.backgroundType === 'solid' ? 'primary' : 'secondary'}
                onClick={() => setBcConfig({ ...bcConfig, backgroundType: 'solid' })}
                style={{ flex: 1, padding: '4px' }}
              >
                Couleur
              </Button>
              <Button
                variant={bcConfig.backgroundType === 'gradient' ? 'primary' : 'secondary'}
                onClick={() => setBcConfig({ ...bcConfig, backgroundType: 'gradient' })}
                style={{ flex: 1, padding: '4px' }}
              >
                Dégradé
              </Button>
            </div>
            
            {bcConfig.backgroundType === 'solid' && (
              <div className="editor-config__color-row" style={{ marginBottom: '12px' }}>
                <span className="editor-config__color-label">Couleur de fond</span>
                <input
                  type="color"
                  className="editor-config__color-input"
                  value={bcConfig.backgroundColor}
                  onChange={(e) => setBcConfig({ ...bcConfig, backgroundColor: e.target.value })}
                />
              </div>
            )}
            
            {bcConfig.backgroundType === 'gradient' && (
              <div className="editor-config__color-group" style={{ marginBottom: '12px' }}>
                <div className="editor-config__color-row">
                  <span className="editor-config__color-label">Début du dégradé</span>
                  <input
                    type="color"
                    className="editor-config__color-input"
                    value={bcConfig.gradientStart || '#ffffff'}
                    onChange={(e) => setBcConfig({ ...bcConfig, gradientStart: e.target.value })}
                  />
                </div>
                <div className="editor-config__color-row">
                  <span className="editor-config__color-label">Fin du dégradé</span>
                  <input
                    type="color"
                    className="editor-config__color-input"
                    value={bcConfig.gradientEnd || '#f3f4f6'}
                    onChange={(e) => setBcConfig({ ...bcConfig, gradientEnd: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="editor-config__section">
            <label className="editor-config__label">Couleurs du texte</label>
            <div className="editor-config__color-group">
              <div className="editor-config__color-row">
                <span className="editor-config__color-label">Texte</span>
                <input
                  type="color"
                  className="editor-config__color-input"
                  value={bcConfig.textColor}
                  onChange={(e) => setBcConfig({ ...bcConfig, textColor: e.target.value })}
                />
              </div>
              <div className="editor-config__color-row">
                <span className="editor-config__color-label">Accent</span>
                <input
                  type="color"
                  className="editor-config__color-input"
                  value={bcConfig.accentColor}
                  onChange={(e) => setBcConfig({ ...bcConfig, accentColor: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="editor-config__divider" />

          <div className="editor-config__section">
            <label className="editor-config__label">Style du texte</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <span style={{ fontSize: '12px', marginBottom: '4px', display: 'block' }}>Police du nom</span>
                  <select
                    className="editor-config__input"
                    value={bcConfig.nameFontFamily || 'Inter'}
                    onChange={(e) => setBcConfig({ ...bcConfig, nameFontFamily: e.target.value })}
                    style={{ padding: '8px' }}
                  >
                    <option value="Inter">Inter</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Playfair Display">Playfair Display</option>
                    <option value="Montserrat">Montserrat</option>
                    <option value="Arial">Arial</option>
                    <option value="Times New Roman">Times</option>
                  </select>
                </div>
                <div>
                  <span style={{ fontSize: '12px', marginBottom: '4px', display: 'block' }}>Taille du nom ({bcConfig.nameFontSize || 42}px)</span>
                  <input
                    type="range"
                    className="editor-config__slider"
                    min={20} max={80} step={1}
                    value={bcConfig.nameFontSize || 42}
                    onChange={(e) => setBcConfig({ ...bcConfig, nameFontSize: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <span style={{ fontSize: '12px', marginBottom: '4px', display: 'block' }}>Police description</span>
                  <select
                    className="editor-config__input"
                    value={bcConfig.descFontFamily || 'Inter'}
                    onChange={(e) => setBcConfig({ ...bcConfig, descFontFamily: e.target.value })}
                    style={{ padding: '8px' }}
                  >
                    <option value="Inter">Inter</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Playfair Display">Playfair Display</option>
                    <option value="Montserrat">Montserrat</option>
                    <option value="Arial">Arial</option>
                    <option value="Times New Roman">Times</option>
                  </select>
                </div>
                <div>
                  <span style={{ fontSize: '12px', marginBottom: '4px', display: 'block' }}>Taille desc ({bcConfig.descFontSize || 24}px)</span>
                  <input
                    type="range"
                    className="editor-config__slider"
                    min={12} max={40} step={1}
                    value={bcConfig.descFontSize || 24}
                    onChange={(e) => setBcConfig({ ...bcConfig, descFontSize: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="editor-config__divider" />

          <div className="editor-config__section">
            <label className="editor-config__label">Bordure</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label className="editor-config__checkbox-row">
                <input
                  type="checkbox"
                  checked={bcConfig.showBorder}
                  onChange={(e) => setBcConfig({ ...bcConfig, showBorder: e.target.checked })}
                />
                <span className="editor-config__color-label">Afficher une bordure</span>
              </label>
              
              {bcConfig.showBorder && (
                <>
                  <div className="editor-config__color-row">
                    <span className="editor-config__color-label">Couleur</span>
                    <input
                      type="color"
                      className="editor-config__color-input"
                      value={bcConfig.borderColor}
                      onChange={(e) => setBcConfig({ ...bcConfig, borderColor: e.target.value })}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', marginBottom: '4px', display: 'block' }}>Épaisseur ({bcConfig.borderWidth || 1}px)</span>
                    <input
                      type="range"
                      className="editor-config__slider"
                      min={1} max={20} step={1}
                      value={bcConfig.borderWidth || 1}
                      onChange={(e) => setBcConfig({ ...bcConfig, borderWidth: Number(e.target.value) })}
                    />
                  </div>
                </>
              )}
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

              {Array.from({ length: Math.max(1, batchUrls.length) }).map((_, idx) => {
                const urlLabel = batchUrls.length > 0 ? `QR Code n°${idx + 1} (${batchUrls[idx]})` : 'QR Code'
                const opt = templateOptions[idx] || templateOptions[0] || { x: 50, y: 50, size: 150, pageIndex: 0 }
                
                const updateOpt = (updates: Partial<typeof opt>) => {
                  const newOptions = [...templateOptions]
                  newOptions[idx] = { ...opt, ...updates }
                  setTemplateOptions(newOptions)
                  setLastModifiedIndex(idx)
                }

                return (
                  <div key={idx} style={{ marginBottom: idx < Math.max(1, batchUrls.length) - 1 ? '32px' : '0' }}>
                    <h3 className="editor-config__label" style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <QrThumbnail config={qrConfig} url={batchUrls.length > 0 ? batchUrls[idx] : qrConfig.url} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.8em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)' }}>Réglages pour</span>
                        <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', textTransform: 'none', marginTop: '2px' }}>{urlLabel}</span>
                      </div>
                    </h3>

                    <div className="editor-document__card">
                      <div className="editor-document__card-header">
                        <MoveHorizontal size={18} className="editor-document__card-icon" />
                        Positionnement & Taille
                      </div>

                      <div className="editor-document__presets">
                        <button className="editor-document__preset-btn" onClick={() => updateOpt({ x: Math.round(20 + opt.size / 2), y: Math.round(20 + opt.size / 2) })}>
                          Haut Gauche
                        </button>
                        <button className="editor-document__preset-btn" onClick={() => updateOpt({ x: Math.round(templateDimensions.width - 20 - opt.size / 2), y: Math.round(20 + opt.size / 2) })}>
                          Haut Droit
                        </button>
                        <button className="editor-document__preset-btn" onClick={() => updateOpt({ x: Math.round(templateDimensions.width / 2), y: Math.round(templateDimensions.height / 2) })}>
                          Milieu
                        </button>
                        <button className="editor-document__preset-btn" onClick={() => updateOpt({ x: Math.round(20 + opt.size / 2), y: Math.round(templateDimensions.height - 20 - opt.size / 2) })}>
                          Bas Gauche
                        </button>
                        <button className="editor-document__preset-btn" onClick={() => updateOpt({ x: Math.round(templateDimensions.width - 20 - opt.size / 2), y: Math.round(templateDimensions.height - 20 - opt.size / 2) })}>
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
                          max={templateDimensions.width}
                          step="1"
                          value={opt.x}
                          onChange={(e) => updateOpt({ x: parseInt(e.target.value) || 0 })}
                        />
                        <input
                          type="number"
                          className="editor-config__input"
                          value={opt.x}
                          onChange={(e) => updateOpt({ x: parseInt(e.target.value) || 0 })}
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
                          max={templateDimensions.height}
                          step="1"
                          value={opt.y}
                          onChange={(e) => updateOpt({ y: parseInt(e.target.value) || 0 })}
                        />
                        <input
                          type="number"
                          className="editor-config__input"
                          value={opt.y}
                          onChange={(e) => updateOpt({ y: parseInt(e.target.value) || 0 })}
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
                          max={Math.max(10, Math.round(Math.min(templateDimensions.width, templateDimensions.height)))}
                          step="1"
                          value={opt.size}
                          onChange={(e) => updateOpt({ size: parseInt(e.target.value) || 0 })}
                        />
                        <input
                          type="number"
                          className="editor-config__input"
                          value={opt.size}
                          onChange={(e) => updateOpt({ size: parseInt(e.target.value) || 0 })}
                          style={{ width: '70px', margin: 0, padding: '4px 8px' }}
                        />
                      </div>
                    </div>

                    {templateMimeType === 'application/pdf' && (
                      <div className="editor-document__card" style={{ marginTop: '16px' }}>
                        <div className="editor-document__card-header">
                          <FileText size={18} className="editor-document__card-icon" />
                          Options PDF
                        </div>
                        <div className="editor-document__slider-row">
                          <div className="editor-document__slider-label">Numéro de page</div>
                          <input
                            type="number"
                            className="editor-config__input"
                            value={opt.pageIndex + 1}
                            onChange={(e) => {
                              const val = parseInt(e.target.value)
                              updateOpt({ pageIndex: isNaN(val) ? 0 : Math.max(0, val - 1) })
                            }}
                            min="1"
                            style={{ flex: 1, margin: 0 }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
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
                          businessCardConfig: bcConfig,
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
