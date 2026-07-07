export type BusinessCardType = 'person' | 'company'

export interface BusinessCardConfig {
  type: BusinessCardType
  // General details
  name: string // Person name or Company name
  professionOrDomain: string
  location: string
  phone: string
  
  // Design details
  backgroundType: 'solid' | 'gradient' | 'image'
  backgroundColor: string
  gradientStart?: string
  gradientEnd?: string
  backgroundImageUrl?: string
  textColor: string
  accentColor: string
  nameFontFamily: string
  descFontFamily: string
  nameFontSize: number
  descFontSize: number
  showBorder: boolean
  borderColor: string
  borderWidth: number
  borderRadius: number
  
  // Icon/Logo
  iconUrl?: string
  iconSize: number
  iconStyle?: 'circle' | 'square'
  
  // QR Code
  qrSize?: number
}

export const DEFAULT_BUSINESS_CARD_CONFIG: BusinessCardConfig = {
  type: 'person',
  name: 'Jean Dupont',
  professionOrDomain: 'Développeur Web',
  location: 'Paris, France',
  phone: '+33 6 12 34 56 78',
  backgroundType: 'solid',
  backgroundColor: '#ffffff',
  gradientStart: '#ffffff',
  gradientEnd: '#f3f4f6',
  textColor: '#1a1a1a',
  accentColor: '#3b82f6',
  nameFontFamily: 'Inter',
  descFontFamily: 'Inter',
  nameFontSize: 42,
  descFontSize: 24,
  showBorder: true,
  borderColor: '#e5e7eb',
  borderWidth: 1,
  borderRadius: 12,
  iconSize: 80
}
