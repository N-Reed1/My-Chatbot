import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  windowControl: (action) => ipcRenderer.send('window-control', action),
  // Add a new function for saving files. It's async because we'll wait for a response.
  saveFile: (data, options) => ipcRenderer.invoke('save-file', data, options)
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
