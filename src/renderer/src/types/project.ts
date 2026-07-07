import type { QrConfig } from './qr'

export type ActivityType = 'qr-code' | 'business-card' | 'document' | 'scanner'

export interface ProjectConfig {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  activityType: ActivityType
  qrConfig: QrConfig
  thumbnail?: string
  filePath?: string
}

export interface AppSettings {
  defaultConfigPath: string
  defaultExportPath: string
  recentProjects: Array<{
    id: string
    name: string
    filePath: string
    thumbnail?: string
    updatedAt: string
  }>
  theme: 'light' | 'dark' | 'system'
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  defaultConfigPath: '',
  defaultExportPath: '',
  recentProjects: [],
  theme: 'system'
}
