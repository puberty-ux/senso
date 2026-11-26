// Copies the Vazirmatn and Lalezar web fonts into app/fonts so the app works
// fully offline. If the font packages aren't installed, the app falls back to
// Windows/Android system fonts (Segoe UI, Tahoma, Noto) and still works.
const fs = require('fs');
const path = require('path');

const roots = [process.env.FONTS_FROM, path.join(__dirname, '..', 'node_modules')].filter(Boolean);
const out = path.join(__dirname, '..', 'app', 'fonts');
fs.mkdirSync(out, { recursive: true });

const wanted = [
  ['@fontsource-variable/vazirmatn', /-arabic-wght-normal\.woff2$/, 'vazirmatn-arabic.woff2'],
  ['@fontsource-variable/vazirmatn', /-latin-wght-normal\.woff2$/, 'vazirmatn-latin.woff2'],
  ['@fontsource/lalezar', /-arabic-400-normal\.woff2$/, 'lalezar-arabic.woff2'],
  ['@fontsource/lalezar', /-latin-400-normal\.woff2$/, 'lalezar-latin.woff2'],
];

let copied = 0;
for (const [pkg, re, name] of wanted) {
  let done = false;
  for (const root of roots) {
    const dir = path.join(root, pkg, 'files');
    if (!fs.existsSync(dir)) continue;
    const file = fs.readdirSync(dir).find(f => re.test(f) && !/latin-ext/.test(f));
    if (file) { fs.copyFileSync(path.join(dir, file), path.join(out, name)); copied++; done = true; break; }
  }
  if (!done) console.warn(`fonts: ${name} not found (${pkg}); system fonts will be used.`);
}
console.log(`fonts: copied ${copied} of ${wanted.length}`);
