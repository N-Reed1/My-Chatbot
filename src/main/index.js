import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'fs'
import path from 'path'
import mime from 'mime-types'

const CHATS_FILE_PATH = path.join(app.getPath('userData'), 'chats.json')

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    ...(process.platform === 'darwin'
      ? {
          titleBarStyle: 'hidden',
          trafficLightPosition: { x: 15, y: 15 }
        }
      : {
          frame: false
        }),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
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
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// --- IPC Handlers ---

// Window Controls
ipcMain.on('window-control', (event, action) => {
  const window = BrowserWindow.fromWebContents(event.sender)
  if (action === 'minimize') window.minimize()
  else if (action === 'maximize') {
    if (window.isMaximized()) window.unmaximize()
    else window.maximize()
  } else if (action === 'close') window.close()
})

// Chat History Management
const readChatsFromFile = () => {
  try {
    if (fs.existsSync(CHATS_FILE_PATH)) {
      const data = fs.readFileSync(CHATS_FILE_PATH, 'utf-8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Failed to read chats file:', error)
  }
  return []
}

const writeChatsToFile = (chats) => {
  try {
    fs.writeFileSync(CHATS_FILE_PATH, JSON.stringify(chats, null, 2), 'utf-8')
  } catch (error) {
    console.error('Failed to write chats file:', error)
  }
}

ipcMain.handle('load-chats', () => {
  return readChatsFromFile()
})

ipcMain.handle('save-chats', (event, chats) => {
  writeChatsToFile(chats)
})

ipcMain.handle('delete-chat', (event, chatId) => {
  const chats = readChatsFromFile()
  const updatedChats = chats.filter((chat) => chat.id !== chatId)
  writeChatsToFile(updatedChats)
})

// File Operations
ipcMain.handle('save-file', async (event, data, options) => {
  const window = BrowserWindow.fromWebContents(event.sender)
  const { filePath } = await dialog.showSaveDialog(window, options)
  if (filePath) {
    fs.writeFileSync(filePath, data)
    return filePath
  }
  return null
})

ipcMain.handle('open-file-dialog', async () => {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections']
  })
  return filePaths
})

// THE FIX: Renamed 'read-files' to 'process-files' to match the frontend call
ipcMain.handle('process-files', async (event, files) => {
  const processedFiles = []
  for (const file of files) {
    try {
      const mimeType = mime.lookup(file.path)
      if (mimeType && mimeType.startsWith('image/')) {
        const data = fs.readFileSync(file.path, 'base64')
        processedFiles.push({ name: file.name, type: 'image', content: data })
      } else {
        const content = fs.readFileSync(file.path, 'utf-8')
        processedFiles.push({ name: file.name, type: 'text', content })
      }
    } catch (error) {
      console.error(`Failed to read file ${file.path}:`, error)
    }
  }
  return processedFiles
})

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')
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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
