import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // Window Controls
  windowControl: (action) => ipcRenderer.send('window-control', action),

  // File Operations
  saveFile: (data, options) => ipcRenderer.invoke('save-file', data, options),
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  // THE FIX: Added the missing processFiles function
  processFiles: (files) => ipcRenderer.invoke('process-files', files),

  // Chat History Management
  loadChats: () => ipcRenderer.invoke('load-chats'),
  saveChats: (chats) => ipcRenderer.invoke('save-chats', chats),
  deleteChat: (chatId) => ipcRenderer.invoke('delete-chat', chatId)
}

// Use `contextBridge` to securely expose protected APIs to the renderer process
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error)    {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
