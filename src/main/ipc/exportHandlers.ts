import { ipcMain, dialog } from 'electron'
import fs from 'fs/promises'

export function setupExportHandlers() {
  ipcMain.handle('export:saveFile', async (_, defaultPath: string, buffer: ArrayBuffer) => {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Exporter',
      defaultPath,
    })
    
    if (canceled || !filePath) return null
    
    await fs.writeFile(filePath, Buffer.from(buffer))
    return filePath
  })
}
