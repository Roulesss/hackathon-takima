import QRCodeStyling from 'qr-code-styling'
import type { QrConfig } from '../types/qr'

export function createQrInstance(config: QrConfig): QRCodeStyling {
  return new QRCodeStyling({
    width: config.size,
    height: config.size,
    margin: config.margin,
    data: config.url,
    dotsOptions: {
      color: config.style.colors.foreground,
      type: config.style.dotStyle
    },
    backgroundOptions: {
      color: config.style.colors.background
    },
    cornersSquareOptions: {
      color: config.style.colors.cornerSquareColor || config.style.colors.foreground,
      type: config.style.cornerStyle
    },
    cornersDotOptions: {
      color: config.style.colors.cornerDotColor || config.style.colors.foreground,
      type: config.style.cornerDotStyle
    },
    imageOptions: config.logo
      ? {
          crossOrigin: 'anonymous',
          margin: 5
        }
      : undefined,
    image: config.logo?.src
  })
}

export async function exportQrAsBlob(
  config: QrConfig,
  format: 'png' | 'svg' = 'png'
): Promise<Blob | undefined> {
  const qr = createQrInstance(config)
  const blob = await qr.getRawData(format === 'svg' ? 'svg' : 'png')
  return blob ?? undefined
}

export async function exportQrAsDataUrl(config: QrConfig): Promise<string> {
  const blob = await exportQrAsBlob(config, 'png')
  if (!blob) throw new Error('Failed to generate QR code')
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
