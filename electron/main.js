// Senso Bar for Windows: wraps the offline app in its own window, prints
// receipts, saves files, and keeps a daily backup in Documents.
const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

if (!app.requestSingleInstanceLock()) app.quit();

let win = null;
const BACKUP_KEEP = 30;
const backupDir = () => path.join(app.getPath('documents'), 'Senso Bar Backups');

function createWindow() {
  win = new BrowserWindow({
    width: 1360, height: 860, minWidth: 380, minHeight: 560,
    backgroundColor: '#1A1714', title: 'Senso Bar', show: false, autoHideMenuBar: true,
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: true, nodeIntegration: false, spellcheck: false },
  });
  win.loadFile(path.join(__dirname, '..', 'app', 'index.html'));
  win.once('ready-to-show', () => { win.maximize(); win.show(); });
  // Keep the app on its own pages; open real web links in the browser.
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

ipcMain.handle('senso:saveFile', async (event, name, text) => {
  const safe = String(name || 'senso.txt').replace(/[\\/:*?"<>|]/g, '-');
  const r = await dialog.showSaveDialog(BrowserWindow.fromWebContents(event.sender), { defaultPath: path.join(app.getPath('documents'), safe) });
  if (r.canceled || !r.filePath) return false;
  await fs.promises.writeFile(r.filePath, String(text), 'utf8');
  return true;
});

ipcMain.handle('senso:autoBackup', async (_event, json) => {
  if (typeof json !== 'string' || json.length > 200 * 1024 * 1024) return false;
  const dir = backupDir();
  await fs.promises.mkdir(dir, { recursive: true });
  const d = new Date();
  const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const file = path.join(dir, `senso-backup-${day}.json`);
  await fs.promises.writeFile(file + '.tmp', json, 'utf8');
  await fs.promises.rename(file + '.tmp', file);
  const old = (await fs.promises.readdir(dir)).filter(f => /^senso-backup-\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort().reverse().slice(BACKUP_KEEP);
  await Promise.all(old.map(f => fs.promises.unlink(path.join(dir, f)).catch(() => {})));
  return true;
});
