import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    
    minimize: () => ipcRenderer.send('window-minimize'),
    close: () => ipcRenderer.send('window-close'),
    
    getInitialSettings: () => ipcRenderer.invoke('get-initial-settings'),
    updateSettings: (settings: any) => ipcRenderer.invoke('update-settings', settings),
    toggleServer: () => ipcRenderer.invoke('toggle-server'),
    
    onStatusUpdate: (callback: any) => ipcRenderer.on('status-update', (_event, state) => callback(state)),
    onSongChange: (callback: any) => ipcRenderer.on('status-songchange', (_event, data) => callback(data)),
    onPlayPause: (callback: any) => ipcRenderer.on('status-playpause', (_event, state) => callback(state)),
    onProgress: (callback: any) => ipcRenderer.on('status-progress', (_event, state) => callback(state))

});