export type BusinessCardType = 'person' | 'company'

export interface BusinessCardConfig {
  type: BusinessCardType
  // General details
  name: string // Person name or Company name
  professionOrDomain: string
  location: string
  phone: string
  
  // Design details
  backgroundColor: string
  backgroundImageUrl?: string
  textColor: string
  accentColor: string
  fontFamily: string
  fontSizeScale: number
  showBorder: boolean
  borderColor: string
  borderWidth: number
  borderRadius: number
  
  // Icon/Logo
  iconUrl?: string
}

export const DEFAULT_BUSINESS_CARD_CONFIG: BusinessCardConfig = {
  type: 'person',
  name: 'Jean Dupont',
  professionOrDomain: 'Développeur Web',
  location: 'Paris, France',
  phone: '+33 6 12 34 56 78',
  backgroundColor: '#ffffff',
  textColor: '#1a1a1a',
  accentColor: '#3b82f6',
  fontFamily: 'Inter',
  fontSizeScale: 1,
  showBorder: true,
  borderColor: '#e5e7eb',
  borderWidth: 1,
  borderRadius: 12
}
