// Senso Bar for Windows: wraps the offline app in its own window, prints
// receipts, and saves backups and exports in Documents\Senso Bar.
const { app, BrowserWindow, ipcMain, shell, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

if (!app.requestSingleInstanceLock()) app.quit();

let win = null;
const FOLDERS = ['Backups', 'Exports'];
const base = () => path.join(app.getPath('documents'), 'Senso Bar');
function folderPath(folder) {
  if (!FOLDERS.includes(folder)) throw new Error('Unknown folder');
  return path.join(base(), folder);
}
function filePath(folder, name) {
  const safe = path.basename(String(name || '')).replace(/[\\/:*?"<>|]/g, '-');
  if (!safe || safe.startsWith('.')) throw new Error('Bad file name');
  return path.join(folderPath(folder), safe);
}

function createWindow() {
  win = new BrowserWindow({
    width: 1360, height: 860, minWidth: 380, minHeight: 560,
    backgroundColor: '#1A1714', title: 'Senso Bar', show: false, autoHideMenuBar: true,
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: true, nodeIntegration: false, spellcheck: false },
  });
  win.loadFile(path.join(__dirname, '..', 'app', 'index.html'));
  win.once('ready-to-show', () => { win.maximize(); win.show(); });
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https:\/\//.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('file://')) e.preventDefault(); });
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

ipcMain.handle('senso:print', (event, opts) => new Promise(resolve => {
  event.sender.print({ silent: !!(opts && opts.silent), printBackground: true, margins: { marginType: 'none' } }, (ok, reason) => resolve({ ok, reason }));
}));
ipcMain.handle('senso:where', () => base());
ipcMain.handle('senso:saveTo', async (_e, folder, name, text) => {
  if (typeof text !== 'string' || text.length > 300 * 1024 * 1024) throw new Error('File too large');
  const file = filePath(folder, name);
  await fs.promises.mkdir(path.dirname(file), { recursive: true });
  await fs.promises.writeFile(file + '.tmp', text, 'utf8');
  await fs.promises.rename(file + '.tmp', file);
  return file;
});
ipcMain.handle('senso:list', async (_e, folder) => {
  const dir = folderPath(folder);
  try {
    const names = (await fs.promises.readdir(dir)).filter(n => !n.startsWith('.') && !n.endsWith('.tmp'));
    return Promise.all(names.map(async name => { const st = await fs.promises.stat(path.join(dir, name)); return { name, size: st.size, mtime: st.mtimeMs }; }));
  } catch (_) { return []; }
});
ipcMain.handle('senso:read', (_e, folder, name) => fs.promises.readFile(filePath(folder, name), 'utf8'));
ipcMain.handle('senso:remove', (_e, folder, name) => fs.promises.unlink(filePath(folder, name)));
ipcMain.handle('senso:openFolder', async (_e, folder) => {
  const dir = folderPath(folder);
  await fs.promises.mkdir(dir, { recursive: true });
  return shell.openPath(dir);
});
