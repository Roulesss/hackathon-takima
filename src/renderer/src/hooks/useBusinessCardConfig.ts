import { useState, useCallback, useEffect } from 'react'
import { BusinessCardConfig, DEFAULT_BUSINESS_CARD_CONFIG } from '../types/businessCard'

const STORAGE_KEY = 'qr-forge-business-card-config'

export function useBusinessCardConfig() {
  const [config, setConfigState] = useState<BusinessCardConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        return { ...DEFAULT_BUSINESS_CARD_CONFIG, ...JSON.parse(saved) }
      } catch (e) {
        console.error('Failed to parse saved business card config', e)
      }
    }
    return DEFAULT_BUSINESS_CARD_CONFIG
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  }, [config])

  const setConfig = useCallback((newConfig: BusinessCardConfig | ((prev: BusinessCardConfig) => BusinessCardConfig)) => {
    setConfigState(newConfig)
  }, [])

  const resetConfig = useCallback(() => {
    setConfigState(DEFAULT_BUSINESS_CARD_CONFIG)
  }, [])

  return { config, setConfig, resetConfig }
}
