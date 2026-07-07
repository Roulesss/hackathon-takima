import { PDFDocument } from 'pdf-lib'

export async function createPdfWithQr(
  qrImageBytes: Uint8Array,
  options?: { width?: number; height?: number }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const qrImage = await pdfDoc.embedPng(qrImageBytes)

  const pageWidth = options?.width || 595.28
  const pageHeight = options?.height || 841.89
  const page = pdfDoc.addPage([pageWidth, pageHeight])

  const qrSize = Math.min(pageWidth, pageHeight) * 0.5
  const x = (pageWidth - qrSize) / 2
  const y = (pageHeight - qrSize) / 2

  page.drawImage(qrImage, {
    x,
    y,
    width: qrSize,
    height: qrSize
  })

  return pdfDoc.save()
}

export async function addQrToPdf(
  existingPdfBytes: Uint8Array,
  qrImageBytes: Uint8Array,
  options: { pageIndex?: number; x: number; y: number; size: number }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(existingPdfBytes)
  const qrImage = await pdfDoc.embedPng(qrImageBytes)
  const pages = pdfDoc.getPages()
  const page = pages[options.pageIndex || 0]

  page.drawImage(qrImage, {
    x: options.x,
    y: options.y,
    width: options.size,
    height: options.size
  })

  return pdfDoc.save()
}
