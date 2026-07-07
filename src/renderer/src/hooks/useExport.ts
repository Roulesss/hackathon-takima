import { useCallback, useState } from 'react'
import type { QrConfig } from '../types/qr'
import type { ExportFormat } from '../types/export'
import { exportQrAsBlob } from '../utils/qrGenerator'
import { createPdfWithQr, addQrToPdf } from '../utils/pdfUtils'
import { addQrToImage } from '../utils/imageUtils'
import JSZip from 'jszip'

export interface TemplateExportOptions {
  templateBytes?: Uint8Array
  templateMimeType?: string
  x: number
  y: number
  size: number
  pageIndex: number
  batchNaming?: string
}

export function useExport() {
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const exportQr = useCallback(
    async (config: QrConfig, format: ExportFormat, filename?: string, options?: TemplateExportOptions) => {
      setExporting(true)
      setError(null)
      try {
                const validUrls = (config.batchUrls && config.batchUrls.length > 0) ? config.batchUrls.filter(u => u.trim() !== '') : [config.url]
        const urls = validUrls.length > 0 ? validUrls : [config.url]
        
        if (urls.length > 1) {
          // Batch export
          if (window.api && window.api.saveFileDialog) {
            const zip = new JSZip()
            for (let i = 0; i < urls.length; i++) {
              const batchConfig = { ...config, url: urls[i] }
              let blob: Blob | null | undefined = null
              let fileExtension = format

              if (format === 'svg') {
                blob = await exportQrAsBlob(batchConfig, 'svg')
              } else if (format === 'png') {
                blob = await exportQrAsBlob(batchConfig, 'png')
                if (blob && options?.templateBytes && options.templateMimeType && options.templateMimeType !== 'application/pdf') {
                  const arrayBuffer = await blob.arrayBuffer()
                  const imgBytes = await addQrToImage(
                    options.templateBytes,
                    new Uint8Array(arrayBuffer),
                    { x: options.x, y: options.y, size: options.size },
                    options.templateMimeType
                  )
                  blob = new Blob([imgBytes as any], { type: options.templateMimeType })
                  fileExtension = options.templateMimeType === 'image/jpeg' ? 'jpg' : ('png' as any)
                }
              } else if (format === 'pdf') {
                const pngBlob = await exportQrAsBlob(batchConfig, 'png')
                if (pngBlob) {
                  const arrayBuffer = await pngBlob.arrayBuffer()
                  let pdfBytes: Uint8Array
                  if (options?.templateBytes && options.templateMimeType === 'application/pdf') {
                    pdfBytes = await addQrToPdf(
                      options.templateBytes,
                      new Uint8Array(arrayBuffer),
                      { pageIndex: options.pageIndex, x: options.x, y: options.y, size: options.size }
                    )
                  } else {
                    pdfBytes = await createPdfWithQr(new Uint8Array(arrayBuffer))
                  }
                  blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
                }
              }
              
              if (blob) {
                const arrayBuffer = await blob.arrayBuffer()
                                const naming = options?.batchNaming || 'qr_{index}'
                zip.file(`${naming.replace('{index}', String(i + 1))}.${fileExtension}`, arrayBuffer)
              }
            }
            
            const zipBlob = await zip.generateAsync({ type: 'blob' })
            const arrayBuffer = await zipBlob.arrayBuffer()
            const { canceled, filePath } = await window.api.saveFileDialog({
              defaultPath: filename ? `${filename.split('.')[0]}.zip` : 'qrs.zip',
              filters: [{ name: 'ZIP', extensions: ['zip'] }]
            })
            if (!canceled && filePath) {
              await window.api.writeBinaryFile(filePath, arrayBuffer)
            }
          } else {
            // Fallback for browser: download multiple files
            for (let i = 0; i < urls.length; i++) {
              const batchConfig = { ...config, url: urls[i] }
              let blob: Blob | null | undefined = null
              let fileExtension = format
              
              if (format === 'svg') {
                blob = await exportQrAsBlob(batchConfig, 'svg')
              } else if (format === 'png') {
                blob = await exportQrAsBlob(batchConfig, 'png')
                if (blob && options?.templateBytes && options.templateMimeType && options.templateMimeType !== 'application/pdf') {
                  const arrayBuffer = await blob.arrayBuffer()
                  const imgBytes = await addQrToImage(
                    options.templateBytes,
                    new Uint8Array(arrayBuffer),
                    { x: options.x, y: options.y, size: options.size },
                    options.templateMimeType
                  )
                  blob = new Blob([imgBytes as any], { type: options.templateMimeType })
                  fileExtension = options.templateMimeType === 'image/jpeg' ? 'jpg' : ('png' as any)
                }
              } else if (format === 'pdf') {
                const pngBlob = await exportQrAsBlob(batchConfig, 'png')
                if (pngBlob) {
                  const arrayBuffer = await pngBlob.arrayBuffer()
                  let pdfBytes: Uint8Array
                  if (options?.templateBytes && options.templateMimeType === 'application/pdf') {
                    pdfBytes = await addQrToPdf(
                      options.templateBytes,
                      new Uint8Array(arrayBuffer),
                      { pageIndex: options.pageIndex, x: options.x, y: options.y, size: options.size }
                    )
                  } else {
                    pdfBytes = await createPdfWithQr(new Uint8Array(arrayBuffer))
                  }
                  blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
                }
              }
              
              if (blob) {
                                const naming = options?.batchNaming || 'qr_{index}'
                downloadBlob(blob, `${naming.replace('{index}', String(i + 1))}.${fileExtension}`)
              }
            }
          }
        } else {
          // Single export
          let blob: Blob | null | undefined = null
          let defaultFilename = ''

          if (format === 'svg') {
            blob = await exportQrAsBlob(config, 'svg')
            defaultFilename = filename || 'qr-code.svg'
          } else if (format === 'png') {
            blob = await exportQrAsBlob(config, 'png')
            if (blob && options?.templateBytes && options.templateMimeType && options.templateMimeType !== 'application/pdf') {
              const arrayBuffer = await blob.arrayBuffer()
              const imgBytes = await addQrToImage(
                options.templateBytes,
                new Uint8Array(arrayBuffer),
                {
                  x: options.x,
                  y: options.y,
                  size: options.size
                },
                options.templateMimeType
              )
              blob = new Blob([imgBytes as any], { type: options.templateMimeType })
              const ext = options.templateMimeType === 'image/jpeg' ? 'jpg' : 'png'
              defaultFilename = filename || `qr-code.${ext}`
            } else {
              defaultFilename = filename || 'qr-code.png'
            }
          } else if (format === 'pdf') {
            const pngBlob = await exportQrAsBlob(config, 'png')
            if (pngBlob) {
              const arrayBuffer = await pngBlob.arrayBuffer()
              let pdfBytes: Uint8Array
              
              if (options?.templateBytes && options.templateMimeType === 'application/pdf') {
                pdfBytes = await addQrToPdf(
                  options.templateBytes,
                  new Uint8Array(arrayBuffer),
                  {
                    pageIndex: options.pageIndex,
                    x: options.x,
                    y: options.y,
                    size: options.size
                  }
                )
              } else {
                pdfBytes = await createPdfWithQr(new Uint8Array(arrayBuffer))
              }
              
              blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
              defaultFilename = filename || 'qr-code.pdf'
            }
          }

          if (blob) {
            if (window.api && window.api.saveFileDialog) {
              const arrayBuffer = await blob.arrayBuffer()
              const { canceled, filePath } = await window.api.saveFileDialog({
                defaultPath: defaultFilename,
                filters: [{ name: format.toUpperCase(), extensions: [format] }]
              })
              if (!canceled && filePath) {
                await window.api.writeBinaryFile(filePath, arrayBuffer)
              }
            } else {
              downloadBlob(blob, defaultFilename)
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Export failed')
      } finally {
        setExporting(false)
      }
    },
    [downloadBlob]
  )

  return { exportQr, exporting, error }
}
