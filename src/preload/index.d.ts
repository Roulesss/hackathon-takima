import { ElectronAPI } from '@electron-toolkit/preload'

interface QrForgeAPI {
  saveFileDialog: (options: {
    defaultPath?: string
    filters?: { name: string; extensions: string[] }[]
  }) => Promise<{ canceled: boolean; filePath?: string }>
  openFileDialog: (options: {
    filters?: { name: string; extensions: string[] }[]
    properties?: string[]
  }) => Promise<{ canceled: boolean; filePaths: string[] }>
  readFile: (filePath: string) => Promise<{ success: boolean; data?: string; error?: string }>
  readBinaryFile: (filePath: string) => Promise<{ success: boolean; data?: ArrayBuffer; error?: string }>
  writeFile: (
    filePath: string,
    content: string
  ) => Promise<{ success: boolean; error?: string }>
  writeBinaryFile: (
    filePath: string,
    data: ArrayBuffer
  ) => Promise<{ success: boolean; error?: string }>
  ensureDir: (dirPath: string) => Promise<{ success: boolean; error?: string }>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: QrForgeAPI
  }
}
