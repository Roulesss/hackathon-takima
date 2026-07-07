import { useCallback, useState } from 'react'
import type { QrConfig } from '../types/qr'
import type { ExportFormat } from '../types/export'
import { exportQrAsBlob } from '../utils/qrGenerator'
import { createPdfWithQr, addQrToPdf } from '../utils/pdfUtils'
import { addQrToImage } from '../utils/imageUtils'

export interface TemplateExportOptions {
  templateBytes?: Uint8Array
  templateMimeType?: string
  x: number
  y: number
  size: number
  pageIndex: number
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
