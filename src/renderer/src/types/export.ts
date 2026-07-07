export type ExportFormat = 'png' | 'svg' | 'pdf'

export interface ExportOptions {
  format: ExportFormat
  quality?: number
  width?: number
  height?: number
}

export interface BatchExportOptions extends ExportOptions {
  namingPattern: string
  exportAsZip: boolean
  items: Array<{ url: string; name?: string }>
}
