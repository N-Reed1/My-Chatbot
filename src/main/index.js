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

  // ... (ipcMain handlers for window-control, save-file, open-file-dialog are unchanged)
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

  // THE FIX: This handler now opens the "Save As" dialog defaulting to the Downloads folder
  ipcMain.handle('save-file', async (event, data, options) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const downloadsPath = app.getPath('downloads');
    const defaultPath = join(downloadsPath, options.defaultPath || 'download');

    const { filePath } = await dialog.showSaveDialog(win, {
      ...options,
      defaultPath: defaultPath
    });

    if (filePath) {
      try {
        fs.writeFileSync(filePath, data);
        return { success: true, path: filePath };
      } catch (error) {
        console.error('Failed to save the file:', error);
        return { success: false, error: error.message };
      }
    }
    return { success: false, error: 'Save dialog was canceled.' };
  });

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

  // THIS IS THE FIX: A single function to process an array of files
  ipcMain.handle('process-files', async (event, files) => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const base64Images = [];
    const textContents = [];

    for (const file of files) {
      try {
        const extension = join(file.path).split('.').pop().toLowerCase();
        if (imageExtensions.includes(extension)) {
          const data = fs.readFileSync(file.path, { encoding: 'base64' });
          base64Images.push(data);
        } else {
          let content = null;
          if (extension === 'pdf') {
            const dataBuffer = fs.readFileSync(file.path);
            const data = await pdf(dataBuffer);
            content = data.text;
          } else if (extension === 'txt' || extension === 'md') {
            content = fs.readFileSync(file.path, 'utf8');
          } else if (extension === 'docx') {
            content = `[Content of DOCX file: ${file.name}]`;
          }
          if (content) {
            textContents.push(`[Content from ${file.name}]:\n${content}`);
          }
        }
      } catch (error) {
        console.error(`Failed to process file ${file.path}:`, error);
      }
    }
    return { base64Images, textContents };
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
