import jsQR from 'jsqr'

export interface ScanResult {
  success: boolean
  data?: string
  error?: string
}

export async function scanQrFromFile(file: File): Promise<ScanResult> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = (): void => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        resolve({ success: false, error: 'Could not create canvas context' })
        return
      }

      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height)

      URL.revokeObjectURL(url)

      if (code) {
        resolve({ success: true, data: code.data })
      } else {
        resolve({ success: false, error: 'Aucun QR code trouvé dans l\'image' })
      }
    }

    img.onerror = (): void => {
      URL.revokeObjectURL(url)
      resolve({ success: false, error: 'Échec du chargement de l\'image' })
    }

    img.src = url
  })
}
