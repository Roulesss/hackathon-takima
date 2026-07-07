import { useCallback, useState } from 'react'
import type { QrConfig } from '../types/qr'
import type { ExportFormat } from '../types/export'
import { exportQrAsBlob } from '../utils/qrGenerator'
import { createPdfWithQr } from '../utils/pdfUtils'

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
        if (format === 'svg') {
          const blob = await exportQrAsBlob(config, 'svg')
          if (blob) downloadBlob(blob, filename || 'qr-code.svg')
        } else if (format === 'png') {
          const blob = await exportQrAsBlob(config, 'png')
          if (blob) downloadBlob(blob, filename || 'qr-code.png')
        } else if (format === 'pdf') {
          const pngBlob = await exportQrAsBlob(config, 'png')
          if (pngBlob) {
            const arrayBuffer = await pngBlob.arrayBuffer()
            const pdfBytes = await createPdfWithQr(new Uint8Array(arrayBuffer))
            const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' })
            downloadBlob(pdfBlob, filename || 'qr-code.pdf')
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
