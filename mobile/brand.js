// Replaces Capacitor's default launcher icons and splash screens with Senso Bar's.
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const res = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');
const icon = path.join(__dirname, '..', 'app', 'icons', 'icon.svg');
const fg = path.join(__dirname, 'icon-foreground.svg');
const BG = '#1A1714';

async function sizeOf(file) { const m = await sharp(file).metadata(); return [m.width, m.height]; }

async function main() {
  let n = 0;
  for (const dir of fs.readdirSync(res)) {
    const full = path.join(res, dir);
    if (!fs.statSync(full).isDirectory()) continue;
    for (const f of fs.readdirSync(full)) {
      const file = path.join(full, f);
      if (!f.endsWith('.png')) continue;
      const [w, h] = await sizeOf(file);
      let buf;
      if (f === 'ic_launcher.png' || f === 'ic_launcher_round.png') {
        const base = sharp(icon, { density: 400 }).resize(w, h);
        buf = f === 'ic_launcher_round.png'
          ? await base.composite([{ input: Buffer.from(`<svg width="${w}" height="${h}"><circle cx="${w / 2}" cy="${h / 2}" r="${w / 2}"/></svg>`), blend: 'dest-in' }]).png().toBuffer()
          : await base.png().toBuffer();
      } else if (f === 'ic_launcher_foreground.png') {
        // Adaptive icons keep the middle 66/108 safe; draw the glass inside it.
        const inner = Math.round(w * 0.62);
        const glass = await sharp(fg, { density: 400 }).resize(inner, inner).png().toBuffer();
        buf = await sharp({ create: { width: w, height: h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
          .composite([{ input: glass, left: Math.round((w - inner) / 2), top: Math.round((h - inner) / 2) }]).png().toBuffer();
      } else if (f === 'splash.png') {
        const s = Math.round(Math.min(w, h) * 0.3);
        const mark = await sharp(icon, { density: 400 }).resize(s, s).png().toBuffer();
        buf = await sharp({ create: { width: w, height: h, channels: 4, background: BG } })
          .composite([{ input: mark, left: Math.round((w - s) / 2), top: Math.round((h - s) / 2) }]).png().toBuffer();
      } else continue;
      fs.writeFileSync(file, buf); n++;
    }
  }
  // Yellow behind the adaptive icon's glass.
  const bgXml = path.join(res, 'values', 'ic_launcher_background.xml');
  if (fs.existsSync(bgXml)) fs.writeFileSync(bgXml, '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#F2B632</color>\n</resources>\n');
  console.log(`brand: replaced ${n} images`);
}
main().catch(e => { console.error(e); process.exit(1); });
