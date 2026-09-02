import fs from 'node:fs';
import path from 'node:path';
import archiver from 'archiver';
import * as DIR from './directories.js';

const browser = process.argv[2];

if (browser !== 'chrome' && browser !== 'firefox') {
  throw new Error('Usage: node ./tools/packageExtension.js <chrome|firefox>');
}

const packageJson = JSON.parse(
  fs.readFileSync(path.resolve('package.json'), 'utf-8'),
);

const sourceDir = path.resolve(DIR.DIST, browser);

if (!fs.existsSync(sourceDir) || !fs.statSync(sourceDir).isDirectory()) {
  throw new Error(`Build directory does not exist: ${sourceDir}`);
}

fs.mkdirSync(DIR.BUILDS, { recursive: true });

const suffix = browser === 'chrome' ? 'Chrome' : 'Firefox-unsigned';
const filename = `Cookie-AutoDelete-Next-Edition_${packageJson.version}_${suffix}.zip`;
const outputPath = path.resolve(DIR.BUILDS, filename);

await new Promise((resolve, reject) => {
  const output = fs.createWriteStream(outputPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  output.on('close', resolve);
  output.on('error', reject);
  archive.on('error', reject);

  archive.pipe(output);
  archive.directory(sourceDir, false);
  archive.finalize();
});

console.log(`Created ${outputPath}`);
