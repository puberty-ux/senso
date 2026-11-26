// The few things the page may ask of Windows. Nothing else from Node is exposed.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('sensoNative', {
  print: opts => ipcRenderer.invoke('senso:print', opts),
  saveFile: (name, text) => ipcRenderer.invoke('senso:saveFile', name, text),
  autoBackup: json => ipcRenderer.invoke('senso:autoBackup', json),
});
