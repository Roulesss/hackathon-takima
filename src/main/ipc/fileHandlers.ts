import { ipcMain, dialog } from 'electron'
import fs from 'fs/promises'

export function setupFileHandlers() {
  ipcMain.handle('file:saveJson', async (_, defaultPath: string, data: any) => {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Sauvegarder le projet',
      defaultPath,
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })
    
    if (canceled || !filePath) return null
    
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
    return filePath
  })

  ipcMain.handle('file:loadJson', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Ouvrir un projet',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile']
    })
    
    if (canceled || filePaths.length === 0) return null
    
    const content = await fs.readFile(filePaths[0], 'utf-8')
    return { filePath: filePaths[0], data: JSON.parse(content) }
  })
}
