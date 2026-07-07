import { useState, useCallback } from 'react'
import type { QrConfig, QrStyleConfig, QrColorConfig } from '../types/qr'
import { DEFAULT_QR_CONFIG } from '../types/qr'

export function useQrConfig(initialConfig?: Partial<QrConfig>) {
  const [config, setConfig] = useState<QrConfig>({
    ...DEFAULT_QR_CONFIG,
    ...initialConfig
  })

  const updateUrl = useCallback((url: string) => {
    setConfig((prev) => ({ ...prev, url }))
  }, [])

  const updateSize = useCallback((size: number) => {
    setConfig((prev) => ({ ...prev, size }))
  }, [])

  const updateMargin = useCallback((margin: number) => {
    setConfig((prev) => ({ ...prev, margin }))
  }, [])

  const updateStyle = useCallback((style: Partial<QrStyleConfig>) => {
    setConfig((prev) => ({
      ...prev,
      style: { ...prev.style, ...style }
    }))
  }, [])

  const updateColors = useCallback((colors: Partial<QrColorConfig>) => {
    setConfig((prev) => ({
      ...prev,
      style: {
        ...prev.style,
        colors: { ...prev.style.colors, ...colors }
      }
    }))
  }, [])

  const resetConfig = useCallback(() => {
    setConfig({ ...DEFAULT_QR_CONFIG, ...initialConfig })
  }, [initialConfig])

  const loadConfig = useCallback((newConfig: QrConfig) => {
    setConfig(newConfig)
  }, [])

  const exportConfigAsJson = useCallback((): string => {
    return JSON.stringify(config, null, 2)
  }, [config])

  return {
    config,
    setConfig,
    updateUrl,
    updateSize,
    updateMargin,
    updateStyle,
    updateColors,
    resetConfig,
    loadConfig,
    exportConfigAsJson
  }
}
