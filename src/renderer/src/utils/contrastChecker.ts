import chroma from 'chroma-js'

export interface ContrastResult {
  ratio: number
  isReadable: boolean
  level: 'fail' | 'AA-large' | 'AA' | 'AAA'
  message: string
}

export function checkContrast(foreground: string, background: string): ContrastResult {
  try {
    const ratio = chroma.contrast(foreground, background)
    let level: ContrastResult['level'] = 'fail'
    let isReadable = false
    let message = ''

    if (ratio >= 7) {
      level = 'AAA'
      isReadable = true
      message = 'Excellent contraste — QR code facilement scannable'
    } else if (ratio >= 4.5) {
      level = 'AA'
      isReadable = true
      message = 'Bon contraste — QR code devrait scanner correctement'
    } else if (ratio >= 3) {
      level = 'AA-large'
      isReadable = true
      message = 'Contraste acceptable — possibles difficultés sur certains appareils'
    } else {
      level = 'fail'
      isReadable = false
      message = 'Contraste insuffisant — le QR code pourrait ne pas être scannable !'
    }

    return { ratio, isReadable, level, message }
  } catch {
    return {
      ratio: 0,
      isReadable: false,
      level: 'fail',
      message: 'Valeurs de couleurs invalides'
    }
  }
}
