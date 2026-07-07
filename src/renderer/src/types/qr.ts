export type DotStyle = 'square' | 'dots' | 'rounded' | 'extra-rounded' | 'classy' | 'classy-rounded'
export type CornerStyle = 'square' | 'dot' | 'extra-rounded'
export type CornerDotStyle = 'square' | 'dot'

export interface QrColorConfig {
  foreground: string
  background: string
  cornerSquareColor?: string
  cornerDotColor?: string
}

export interface QrStyleConfig {
  dotStyle: DotStyle
  cornerStyle: CornerStyle
  cornerDotStyle: CornerDotStyle
  colors: QrColorConfig
}

export interface QrConfig {
  url: string
  size: number
  margin: number
  style: QrStyleConfig
  logo?: {
    src: string
    size: number
  }
  batchUrls?: string[]
}

export const DEFAULT_QR_CONFIG: QrConfig = {
  url: 'https://example.com',
  size: 300,
  margin: 10,
  style: {
    dotStyle: 'square',
    cornerStyle: 'square',
    cornerDotStyle: 'square',
    colors: {
      foreground: '#000000',
      background: '#ffffff'
    }
  }
}
