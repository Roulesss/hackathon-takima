import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hiddenInset',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ─── IPC Handlers ──────────────────────────────────────────────

// Save file dialog
ipcMain.handle('dialog:saveFile', async (_event, options: { defaultPath?: string; filters?: Electron.FileFilter[] }) => {
  const result = await dialog.showSaveDialog({
    defaultPath: options.defaultPath,
    filters: options.filters || [
      { name: 'All Files', extensions: ['*'] }
    ]
  })
  return result
})

// Open file dialog
ipcMain.handle('dialog:openFile', async (_event, options: { filters?: Electron.FileFilter[]; properties?: Electron.OpenDialogOptions['properties'] }) => {
  const result = await dialog.showOpenDialog({
    filters: options.filters,
    properties: options.properties || ['openFile']
  })
  return result
})

// Read file
ipcMain.handle('fs:readFile', async (_event, filePath: string) => {
  try {
    const data = await readFile(filePath)
    return { success: true, data: data.toString('utf-8') }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
})

// Write file
ipcMain.handle('fs:writeFile', async (_event, filePath: string, content: string) => {
  try {
    await writeFile(filePath, content, 'utf-8')
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
})

// Write binary file (for exports)
ipcMain.handle('fs:writeBinaryFile', async (_event, filePath: string, data: ArrayBuffer) => {
  try {
    await writeFile(filePath, Buffer.from(data))
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
})

// Ensure directory exists
ipcMain.handle('fs:ensureDir', async (_event, dirPath: string) => {
  try {
    await mkdir(dirPath, { recursive: true })
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
})

// ─── App Lifecycle ─────────────────────────────────────────────

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.qrforge')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
