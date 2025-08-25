import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'fs' // Import the Node.js file system module

function createWindow() {
  // ... (createWindow function is unchanged)
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    frame: false,
    titleBarStyle: 'hidden',
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

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('window-control', (event, action) => {
    // ... (window control logic is unchanged)
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
      if (action === 'minimize') win.minimize()
      if (action === 'maximize') {
        if (win.isMaximized()) {
          win.unmaximize()
        } else {
          win.maximize()
        }
      }
      if (action === 'close') win.close()
    }
  })

  // THIS IS THE FIX: Handle the 'save-file' event
  ipcMain.handle('save-file', async (event, data, options) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const { filePath } = await dialog.showSaveDialog(win, options)

    if (filePath) {
      try {
        fs.writeFileSync(filePath, data)
        return { success: true, path: filePath }
      } catch (error) {
        console.error('Failed to save the file:', error)
        return { success: false, error: error.message }
      }
    }
    return { success: false, error: 'Save dialog was canceled.' }
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  // ... (window-all-closed logic is unchanged)
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
