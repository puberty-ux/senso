/* Saving files outside the app: backups and exports.
   Windows app → Documents\Senso Bar\{Backups,Exports}
   Android app → Documents/SensoBar/{Backups,Exports} (or the app's own folder if Documents isn't allowed)
   Browser     → the Downloads folder */
(function (root) {
  'use strict';
  const cap = root.Capacitor && root.Capacitor.isNativePlatform && root.Capacitor.isNativePlatform() ? root.Capacitor : null;
  const nat = root.sensoNative || null;
  const F = { kind: cap ? 'android' : nat ? 'win' : 'web' };
  const P = cap ? cap.Plugins : {};
  const FOLDERS = ['Backups', 'Exports'];
  let dir = null;

  async function androidDir() {
    if (dir) return dir;
    try { if (P.Filesystem.requestPermissions) await P.Filesystem.requestPermissions(); } catch (_) { /* Android 11+ needs none */ }
    for (const d of ['DOCUMENTS', 'EXTERNAL']) {
      try {
        await P.Filesystem.writeFile({ path: 'SensoBar/.senso', data: 'ok', directory: d, encoding: 'utf8', recursive: true });
        dir = d; return d;
      } catch (_) { /* try the next place */ }
    }
    dir = 'DATA'; return dir;
  }
  function download(name, text, mime) {
    const url = URL.createObjectURL(new Blob([text], { type: mime || 'application/octet-stream' }));
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }
  const ok = f => { if (!FOLDERS.includes(f)) throw new Error('bad folder'); return f; };

  F.where = async () => {
    if (F.kind === 'win') return nat.where ? await nat.where() : 'Documents\\Senso Bar';
    if (F.kind === 'android') { const d = await androidDir(); return d === 'DOCUMENTS' ? 'Documents/SensoBar' : d === 'EXTERNAL' ? 'Android/data/af.sensobar.pos/files/SensoBar' : 'Senso Bar'; }
    return 'Downloads';
  };
  /** Save a text file; returns where it went. */
  F.save = async (folder, name, text, mime) => {
    ok(folder);
    if (F.kind === 'win') return nat.saveTo(folder, name, text);
    if (F.kind === 'android') {
      const d = await androidDir();
      const r = await P.Filesystem.writeFile({ path: `SensoBar/${folder}/${name}`, data: text, directory: d, encoding: 'utf8', recursive: true });
      return r.uri;
    }
    download(name, text, mime); return 'Downloads';
  };
  F.list = async folder => {
    ok(folder);
    if (F.kind === 'win') return nat.list(folder);
    if (F.kind === 'android') {
      const d = await androidDir();
      try {
        const r = await P.Filesystem.readdir({ path: `SensoBar/${folder}`, directory: d });
        return (r.files || []).map(f => (typeof f === 'string' ? { name: f } : { name: f.name, size: f.size, mtime: f.mtime })).filter(f => !f.name.startsWith('.'));
      } catch (_) { return []; }
    }
    return [];
  };
  F.read = async (folder, name) => {
    ok(folder);
    if (F.kind === 'win') return nat.read(folder, name);
    const d = await androidDir();
    return (await P.Filesystem.readFile({ path: `SensoBar/${folder}/${name}`, directory: d, encoding: 'utf8' })).data;
  };
  F.remove = async (folder, name) => {
    ok(folder);
    if (F.kind === 'win') return nat.remove(folder, name);
    const d = await androidDir();
    return P.Filesystem.deleteFile({ path: `SensoBar/${folder}/${name}`, directory: d });
  };
  F.canShare = F.kind === 'android' && !!P.Share;
  /** Android: send a file to WhatsApp, Drive, Bluetooth, a printer app… */
  F.share = async (name, text, title) => {
    if (!F.canShare) { download(name, text); return; }
    const r = await P.Filesystem.writeFile({ path: name, data: text, directory: 'CACHE', encoding: 'utf8' });
    await P.Share.share({ title: title || name, url: r.uri, dialogTitle: title || name });
  };
  F.shareText = async (text, title) => {
    if (F.kind === 'android' && P.Share) return P.Share.share({ title, text, dialogTitle: title });
    try { await navigator.clipboard.writeText(text); } catch (_) { /* ignore */ }
  };
  F.canOpenFolder = F.kind === 'win' && !!(nat && nat.openFolder);
  F.openFolder = folder => nat.openFolder(ok(folder));

  root.SensoFiles = F;
})(window);
