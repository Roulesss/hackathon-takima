import { useCallback, useState } from 'react'
import type { QrConfig } from '../types/qr'
import type { ExportFormat } from '../types/export'
import { exportQrAsBlob } from '../utils/qrGenerator'
import { createPdfWithQr } from '../utils/pdfUtils'
import JSZip from 'jszip'

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
    async (config: QrConfig, format: ExportFormat, filename?: string) => {
      setExporting(true)
      setError(null)
      try {
        const urls = (config.batchUrls && config.batchUrls.length > 0) ? config.batchUrls : [config.url]
        
        if (urls.length > 1) {
          // Batch export
          if (window.api && window.api.saveFileDialog) {
            const zip = new JSZip()
            for (let i = 0; i < urls.length; i++) {
              const batchConfig = { ...config, url: urls[i] }
              let blob: Blob | null | undefined = null
              
              if (format === 'svg' || format === 'png') {
                blob = await exportQrAsBlob(batchConfig, format)
              } else if (format === 'pdf') {
                const pngBlob = await exportQrAsBlob(batchConfig, 'png')
                if (pngBlob) {
                  const arrayBuffer = await pngBlob.arrayBuffer()
                  const pdfBytes = await createPdfWithQr(new Uint8Array(arrayBuffer))
                  blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
                }
              }
              
              if (blob) {
                const arrayBuffer = await blob.arrayBuffer()
                zip.file(`qr-${i + 1}.${format}`, arrayBuffer)
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
              
              if (format === 'svg' || format === 'png') {
                blob = await exportQrAsBlob(batchConfig, format)
              } else if (format === 'pdf') {
                const pngBlob = await exportQrAsBlob(batchConfig, 'png')
                if (pngBlob) {
                  const arrayBuffer = await pngBlob.arrayBuffer()
                  const pdfBytes = await createPdfWithQr(new Uint8Array(arrayBuffer))
                  blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
                }
              }
              
              if (blob) {
                downloadBlob(blob, `qr-${i + 1}.${format}`)
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
            defaultFilename = filename || 'qr-code.png'
          } else if (format === 'pdf') {
            const pngBlob = await exportQrAsBlob(config, 'png')
            if (pngBlob) {
              const arrayBuffer = await pngBlob.arrayBuffer()
              const pdfBytes = await createPdfWithQr(new Uint8Array(arrayBuffer))
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
