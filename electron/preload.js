// The few things the page may ask of Windows. Nothing else from Node is exposed.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('sensoNative', {
  print: opts => ipcRenderer.invoke('senso:print', opts),
  where: () => ipcRenderer.invoke('senso:where'),
  saveTo: (folder, name, text) => ipcRenderer.invoke('senso:saveTo', folder, name, text),
  list: folder => ipcRenderer.invoke('senso:list', folder),
  read: (folder, name) => ipcRenderer.invoke('senso:read', folder, name),
  remove: (folder, name) => ipcRenderer.invoke('senso:remove', folder, name),
  openFolder: folder => ipcRenderer.invoke('senso:openFolder', folder),
});
