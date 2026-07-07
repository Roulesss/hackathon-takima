export async function addQrToImage(
  backgroundBytes: Uint8Array,
  qrBytes: Uint8Array,
  options: { x: number; y: number; size: number },
  mimeType: string = 'image/png'
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const bgBlob = new Blob([backgroundBytes as any])
    const bgUrl = URL.createObjectURL(bgBlob)
    const qrBlob = new Blob([qrBytes as any])
    const qrUrl = URL.createObjectURL(qrBlob)

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      URL.revokeObjectURL(bgUrl)
      URL.revokeObjectURL(qrUrl)
      return reject(new Error('Failed to get canvas 2D context'))
    }

    const bgImg = new Image()
    bgImg.onload = () => {
      canvas.width = bgImg.width
      canvas.height = bgImg.height
      ctx.drawImage(bgImg, 0, 0)

      const qrImg = new Image()
      qrImg.onload = () => {
        ctx.drawImage(qrImg, options.x - options.size / 2, options.y - options.size / 2, options.size, options.size)
        canvas.toBlob((blob) => {
          if (!blob) {
            URL.revokeObjectURL(bgUrl)
            URL.revokeObjectURL(qrUrl)
            return reject(new Error('Canvas toBlob failed'))
          }
          blob.arrayBuffer().then((buffer) => {
            resolve(new Uint8Array(buffer))
            URL.revokeObjectURL(bgUrl)
            URL.revokeObjectURL(qrUrl)
          })
        }, mimeType)
      }
      qrImg.onerror = () => {
        URL.revokeObjectURL(bgUrl)
        URL.revokeObjectURL(qrUrl)
        reject(new Error('Failed to load QR image'))
      }
      qrImg.src = qrUrl
    }
    bgImg.onerror = () => {
      URL.revokeObjectURL(bgUrl)
      URL.revokeObjectURL(qrUrl)
      reject(new Error('Failed to load background image'))
    }
    bgImg.src = bgUrl
  })
}
