const fs = require('fs');
const path = require('path');

function copyDir(src, dst) {
  fs.rmSync(dst, { recursive: true, force: true });
  fs.mkdirSync(dst, { recursive: true });

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

const src = path.resolve(__dirname, '..', 'dist');
const dst = path.resolve(__dirname, '..', '..', 'backend', 'public', 'app');
copyDir(src, dst);

console.log(`Copied ${src} -> ${dst}`);
