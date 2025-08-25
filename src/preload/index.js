import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  windowControl: (action) => ipcRenderer.send('window-control', action),
  saveFile: (data, options) => ipcRenderer.invoke('save-file', data, options),
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  readFileAsBase64: (filePath) => ipcRenderer.invoke('read-file-base64', filePath),
  // Add the new function for reading text content
  readFileContent: (filePath) => ipcRenderer.invoke('read-file-content', filePath)
}

// Use `contextBridge` to securely expose protected APIs to the renderer process
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
