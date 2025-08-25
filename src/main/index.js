import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'fs'
import pdf from 'pdf-parse'

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

  // ... (ipcMain handlers for window-control, save-file are unchanged)
  ipcMain.on('window-control', (event, action) => {
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


  // THIS IS THE FIX: Combine filters for a better macOS experience
  ipcMain.handle('open-file-dialog', async () => {
    const { filePaths } = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Supported Files', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'docx', 'txt', 'md'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })
    return filePaths
  })

  ipcMain.handle('read-file-base64', async (event, filePath) => {
    try {
      const data = fs.readFileSync(filePath, { encoding: 'base64' });
      return data;
    } catch (error) {
      console.error('Failed to read file:', error);
      return null;
    }
  });

  ipcMain.handle('read-file-content', async (event, filePath) => {
    try {
      const extension = join(filePath).split('.').pop().toLowerCase();
      if (extension === 'pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        return data.text;
      } else if (extension === 'txt' || extension === 'md') {
        return fs.readFileSync(filePath, 'utf8');
      } else if (extension === 'docx') {
        return `[Content of DOCX file: ${join(filePath).split(/[\\/]/).pop()}]`;
      }
      return null;
    } catch (error) {
      console.error('Failed to read file content:', error);
      return null;
    }
  });


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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
