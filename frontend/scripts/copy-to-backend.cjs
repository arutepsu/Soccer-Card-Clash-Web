const fs = require('fs');
const path = require('path');

function copyDir(srcDir, dstDir) {
  fs.mkdirSync(dstDir, { recursive: true });

  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const s = path.join(srcDir, entry.name);
    const d = path.join(dstDir, entry.name);

    if (entry.isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

const src = path.resolve(__dirname, '..', 'dist');
const dst = path.resolve(__dirname, '..', '..', 'backend', 'public');

fs.rmSync(dst, { recursive: true, force: true });
copyDir(src, dst);

console.log(`Copied ${src} -> ${dst}`);
