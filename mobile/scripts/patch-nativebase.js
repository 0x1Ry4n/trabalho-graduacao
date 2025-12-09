/**
 * Patches NativeBase theme files to remove outline* CSS properties
 * that are unsupported by React Native 0.76+ native views.
 *
 * Replaces entire lines containing outlineWidth/outlineStyle/outlineColor
 * with `// [patched] <original>` to preserve line count and structure.
 *
 * Run: node scripts/patch-nativebase.js
 */
const fs = require('fs');
const path = require('path');

const THEME_DIRS = [
  'node_modules/native-base/src/theme/components',
  'node_modules/native-base/lib/commonjs/theme/components',
  'node_modules/native-base/lib/module/theme/components',
];

// Match any line that has outline(Width|Style|Color) as a property key
const OUTLINE_PROP_RE = /^(\s*)(outline(?:Width|Style|Color))\s*:/;

function patchFile(filePath) {
  if (!fs.existsSync(filePath)) return false;
  const ext = path.extname(filePath);
  if (ext !== '.ts' && ext !== '.js') return false;

  const original = fs.readFileSync(filePath, 'utf8');
  const lines = original.split('\n');
  let changed = false;

  const patched = lines.map((line) => {
    const match = line.match(OUTLINE_PROP_RE);
    if (match) {
      changed = true;
      const indent = match[1];
      const prop = match[2];
      // Detect if line ends with comma
      const trimmed = line.trimEnd();
      const comma = trimmed.endsWith(',') ? ',' : '';
      return `${indent}// ${prop}: patched`;
    }
    return line;
  });

  if (changed) {
    fs.writeFileSync(filePath, patched.join('\n'), 'utf8');
    return true;
  }
  return false;
}

let totalPatched = 0;

for (const dir of THEME_DIRS) {
  const absDir = path.resolve(__dirname, '..', dir);
  if (!fs.existsSync(absDir)) continue;

  const files = fs.readdirSync(absDir);
  for (const file of files) {
    if (file.endsWith('.map')) continue;
    const filePath = path.join(absDir, file);
    if (patchFile(filePath)) {
      totalPatched++;
    }
  }
}

console.log(`Patched ${totalPatched} NativeBase theme files (removed outline* properties)`);
