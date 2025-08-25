import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  windowControl: (action) => ipcRenderer.send('window-control', action),
  saveFile: (data, options) => ipcRenderer.invoke('save-file', data, options),
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  // THE FIX: Replace the single-file functions with the new multi-file function
  processFiles: (files) => ipcRenderer.invoke('process-files', files)
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
